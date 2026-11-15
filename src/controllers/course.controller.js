const Course = require('../models/Course');
const Section = require('../models/Section');
const ApiResponse = require('../utils/apiResponse');

/**
 * List all courses with search and filtering
 */
const getAllCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, department, semester, search } = req.query;
    const query = { isActive: true };

    if (department) query.department = new RegExp(department, 'i');
    if (semester) query.semester = Number(semester);
    if (search) {
      query.$or = [
        { courseCode: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') }
      ];
    }

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .sort({ courseCode: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return ApiResponse.paginate(res, 'Courses fetched successfully', courses, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single course with its active sections
 */
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return ApiResponse.error(res, 'Course not found', 404);
    }

    const sections = await Section.find({ course: course._id, isActive: true })
      .populate('faculty', 'name email department facultyId');

    return ApiResponse.success(res, 'Course retrieved successfully', {
      course,
      sections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create course (Admin only)
 */
const createCourse = async (req, res, next) => {
  try {
    const { courseCode, title, description, credits, department, semester, syllabus } = req.body;

    const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existingCourse) {
      return ApiResponse.error(res, `Course code '${courseCode}' already exists`, 409);
    }

    const course = await Course.create({
      courseCode,
      title,
      description,
      credits,
      department,
      semester,
      syllabus: syllabus || []
    });

    return ApiResponse.created(res, 'Course created successfully', { course });
  } catch (error) {
    next(error);
  }
};

/**
 * Update course (Admin only)
 */
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return ApiResponse.error(res, 'Course not found', 404);
    }

    const { courseCode, title, description, credits, department, semester, isActive } = req.body;

    if (courseCode && courseCode.toUpperCase() !== course.courseCode) {
      const duplicate = await Course.findOne({ courseCode: courseCode.toUpperCase() });
      if (duplicate) {
        return ApiResponse.error(res, `Course code '${courseCode}' is already in use`, 409);
      }
      course.courseCode = courseCode.toUpperCase();
    }

    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (credits) course.credits = credits;
    if (department) course.department = department;
    if (semester) course.semester = semester;
    if (typeof isActive === 'boolean') course.isActive = isActive;

    await course.save();

    return ApiResponse.success(res, 'Course updated successfully', { course });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete course (Admin only)
 */
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return ApiResponse.error(res, 'Course not found', 404);
    }

    const sectionCount = await Section.countDocuments({ course: course._id });
    if (sectionCount > 0) {
      return ApiResponse.error(
        res,
        `Cannot delete course. It currently has ${sectionCount} active section(s) linked to it.`,
        400
      );
    }

    await Course.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, 'Course deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
