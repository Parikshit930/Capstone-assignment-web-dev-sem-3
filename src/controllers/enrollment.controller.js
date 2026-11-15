const Enrollment = require('../models/Enrollment');
const Section = require('../models/Section');
const Course = require('../models/Course');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { ROLES, ENROLLMENT_STATUS } = require('../config/constants');
const { appEvents, EVENT_NAMES } = require('../events/appEvents');

/**
 * Enroll a student in a course section
 */
const enrollStudent = async (req, res, next) => {
  try {
    let studentId;

    if (req.user.role === ROLES.STUDENT) {
      studentId = req.user._id;
    } else if (req.user.role === ROLES.ADMIN) {
      studentId = req.body.studentId;
      if (!studentId) {
        return ApiResponse.error(res, 'Student ID is required for administrative enrollment', 400);
      }
    } else {
      return ApiResponse.error(res, 'Faculty members cannot directly enroll students', 403);
    }

    const { courseId, sectionId } = req.body;

    // Validate student user
    const studentUser = await User.findById(studentId);
    if (!studentUser || studentUser.role !== ROLES.STUDENT) {
      return ApiResponse.error(res, 'Invalid student user reference', 400);
    }

    // Validate course
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return ApiResponse.error(res, 'Course not found or inactive', 404);
    }

    // Validate section
    const section = await Section.findById(sectionId);
    if (!section || !section.isActive) {
      return ApiResponse.error(res, 'Section not found or inactive', 404);
    }

    // Validate that section belongs to the course
    if (section.course.toString() !== courseId.toString()) {
      return ApiResponse.error(res, 'The specified section does not belong to the selected course', 400);
    }

    // Check duplicate enrollment for this course
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: ENROLLMENT_STATUS.ENROLLED
    });
    if (existingEnrollment) {
      return ApiResponse.error(
        res,
        'Duplicate enrollment error: The student is already actively enrolled in this course',
        409
      );
    }

    // Check section capacity limit
    if (section.currentEnrolled >= section.maxCapacity) {
      return ApiResponse.error(
        res,
        `Section capacity reached. Maximum capacity is ${section.maxCapacity} students.`,
        400
      );
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      section: sectionId,
      status: ENROLLMENT_STATUS.ENROLLED
    });

    // Atomically increment currentEnrolled count
    section.currentEnrolled += 1;
    await section.save();

    // Trigger internal EventEmitter
    appEvents.emit(EVENT_NAMES.ENROLLMENT_CREATED, {
      enrollmentId: enrollment._id,
      studentId,
      courseCode: course.courseCode,
      sectionName: section.sectionName
    });

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'name email studentId')
      .populate('course', 'courseCode title credits')
      .populate('section', 'sectionName academicYear schedule roomNumber');

    return ApiResponse.created(res, 'Student enrolled successfully', {
      enrollment: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Drop enrollment
 */
const dropEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findById(id);

    if (!enrollment) {
      return ApiResponse.error(res, 'Enrollment record not found', 404);
    }

    // Students can only drop their own enrollments
    if (req.user.role === ROLES.STUDENT && enrollment.student.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Unauthorized to drop another student enrollment', 403);
    }

    if (enrollment.status === ENROLLMENT_STATUS.DROPPED) {
      return ApiResponse.error(res, 'This course is already dropped', 400);
    }

    enrollment.status = ENROLLMENT_STATUS.DROPPED;
    await enrollment.save();

    // Decrement section capacity
    await Section.findByIdAndUpdate(enrollment.section, {
      $inc: { currentEnrolled: -1 }
    });

    return ApiResponse.success(res, 'Course dropped successfully', { enrollment });
  } catch (error) {
    next(error);
  }
};

/**
 * Get courses enrolled by logged-in student
 */
const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: ENROLLMENT_STATUS.ENROLLED
    })
      .populate('course', 'courseCode title credits department semester')
      .populate({
        path: 'section',
        select: 'sectionName academicYear term schedule roomNumber faculty',
        populate: {
          path: 'faculty',
          select: 'name email department facultyId'
        }
      });

    return ApiResponse.success(res, 'Enrolled courses retrieved successfully', {
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all enrollments for a specific section (Faculty or Admin)
 */
const getSectionEnrollments = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const section = await Section.findById(sectionId);
    if (!section) {
      return ApiResponse.error(res, 'Section not found', 404);
    }

    // If faculty, must be assigned to this section
    if (req.user.role === ROLES.FACULTY && section.faculty.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'You are not authorized to view enrollments for a section not assigned to you', 403);
    }

    const enrollments = await Enrollment.find({
      section: sectionId,
      status: ENROLLMENT_STATUS.ENROLLED
    }).populate('student', 'name email studentId department');

    return ApiResponse.success(res, 'Section students retrieved successfully', {
      total: enrollments.length,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollStudent,
  dropEnrollment,
  getMyEnrollments,
  getSectionEnrollments
};
