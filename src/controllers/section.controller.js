const Section = require('../models/Section');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

/**
 * Get all sections with course and faculty populated
 */
const getAllSections = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, courseId, facultyId, academicYear } = req.query;
    const query = { isActive: true };

    if (courseId) query.course = courseId;
    if (facultyId) query.faculty = facultyId;
    if (academicYear) query.academicYear = academicYear;

    const total = await Section.countDocuments(query);
    const sections = await Section.find(query)
      .populate('course', 'courseCode title credits department')
      .populate('faculty', 'name email department facultyId')
      .sort({ academicYear: -1, sectionName: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return ApiResponse.paginate(res, 'Sections fetched successfully', sections, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single section by ID
 */
const getSectionById = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('course', 'courseCode title credits department semester')
      .populate('faculty', 'name email department facultyId');

    if (!section) {
      return ApiResponse.error(res, 'Section not found', 404);
    }

    const enrolledStudents = await Enrollment.find({
      section: section._id,
      status: 'enrolled'
    }).populate('student', 'name email studentId department');

    return ApiResponse.success(res, 'Section retrieved successfully', {
      section,
      enrolledCount: enrolledStudents.length,
      students: enrolledStudents.map(e => e.student)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sections assigned to the logged-in faculty member
 */
const getMyAssignedSections = async (req, res, next) => {
  try {
    const sections = await Section.find({
      faculty: req.user._id,
      isActive: true
    }).populate('course', 'courseCode title credits department semester');

    return ApiResponse.success(res, 'Assigned sections retrieved successfully', {
      sections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new section (Admin only)
 */
const createSection = async (req, res, next) => {
  try {
    const { sectionName, course: courseId, faculty: facultyId, academicYear, term, roomNumber, schedule, maxCapacity } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return ApiResponse.error(res, 'Referenced course does not exist', 400);
    }

    // Validate faculty exists and has faculty role
    const facultyUser = await User.findById(facultyId);
    if (!facultyUser) {
      return ApiResponse.error(res, 'Referenced faculty user does not exist', 400);
    }
    if (facultyUser.role !== ROLES.FACULTY) {
      return ApiResponse.error(res, 'Assigned user must have the "faculty" role', 400);
    }

    // Check duplicate section
    const existing = await Section.findOne({
      course: courseId,
      sectionName: sectionName.toUpperCase(),
      academicYear
    });
    if (existing) {
      return ApiResponse.error(
        res,
        `Section '${sectionName}' for this course in academic year '${academicYear}' already exists`,
        409
      );
    }

    const section = await Section.create({
      sectionName: sectionName.toUpperCase(),
      course: courseId,
      faculty: facultyId,
      academicYear,
      term: term || 'Current',
      roomNumber,
      schedule,
      maxCapacity: maxCapacity || 60
    });

    const populated = await Section.findById(section._id)
      .populate('course', 'courseCode title')
      .populate('faculty', 'name email facultyId');

    return ApiResponse.created(res, 'Section created and faculty assigned successfully', {
      section: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update section / assign different faculty (Admin only)
 */
const updateSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return ApiResponse.error(res, 'Section not found', 404);
    }

    const { faculty: facultyId, sectionName, maxCapacity, roomNumber, schedule, isActive } = req.body;

    if (facultyId) {
      const facultyUser = await User.findById(facultyId);
      if (!facultyUser || facultyUser.role !== ROLES.FACULTY) {
        return ApiResponse.error(res, 'Assigned user must be a valid faculty member', 400);
      }
      section.faculty = facultyId;
    }

    if (sectionName) section.sectionName = sectionName.toUpperCase();
    if (maxCapacity) section.maxCapacity = maxCapacity;
    if (roomNumber !== undefined) section.roomNumber = roomNumber;
    if (schedule !== undefined) section.schedule = schedule;
    if (typeof isActive === 'boolean') section.isActive = isActive;

    await section.save();

    const updated = await Section.findById(section._id)
      .populate('course', 'courseCode title')
      .populate('faculty', 'name email facultyId');

    return ApiResponse.success(res, 'Section updated successfully', { section: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete section (Admin only)
 */
const deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return ApiResponse.error(res, 'Section not found', 404);
    }

    const enrollmentsCount = await Enrollment.countDocuments({ section: section._id });
    if (enrollmentsCount > 0) {
      return ApiResponse.error(
        res,
        `Cannot delete section with ${enrollmentsCount} existing enrollment(s).`,
        400
      );
    }

    await Section.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, 'Section deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSections,
  getSectionById,
  getMyAssignedSections,
  createSection,
  updateSection,
  deleteSection
};
