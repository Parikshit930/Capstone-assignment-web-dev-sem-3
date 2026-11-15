const Announcement = require('../models/Announcement');
const Section = require('../models/Section');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ApiResponse = require('../utils/apiResponse');
const { ROLES, ANNOUNCEMENT_TARGET } = require('../config/constants');
const { appEvents, EVENT_NAMES } = require('../events/appEvents');

/**
 * Create announcement
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority, targetAudience, courseId, sectionId, isPinned } = req.body;

    // Authorization checks
    if (req.user.role === ROLES.STUDENT) {
      return ApiResponse.error(res, 'Students are not authorized to publish announcements', 403);
    }

    if (req.user.role === ROLES.FACULTY) {
      if (targetAudience === ANNOUNCEMENT_TARGET.ALL) {
        return ApiResponse.error(res, 'Faculty members cannot post university-wide announcements. Contact Admin.', 403);
      }
      if (targetAudience === ANNOUNCEMENT_TARGET.SECTION && sectionId) {
        const sec = await Section.findById(sectionId);
        if (!sec || sec.faculty.toString() !== req.user._id.toString()) {
          return ApiResponse.error(res, 'You can only post announcements to sections assigned to you', 403);
        }
      }
    }

    // Validate relations if specified
    if (targetAudience === ANNOUNCEMENT_TARGET.COURSE) {
      if (!courseId) return ApiResponse.error(res, 'Course ID is required for course-level announcements', 400);
      const course = await Course.findById(courseId);
      if (!course) return ApiResponse.error(res, 'Course not found', 404);
    }

    if (targetAudience === ANNOUNCEMENT_TARGET.SECTION) {
      if (!sectionId) return ApiResponse.error(res, 'Section ID is required for section-level announcements', 400);
      const sec = await Section.findById(sectionId);
      if (!sec) return ApiResponse.error(res, 'Section not found', 404);
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority: priority || 'medium',
      targetAudience,
      course: courseId || null,
      section: sectionId || null,
      createdBy: req.user._id,
      isPinned: !!isPinned
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email role')
      .populate('course', 'courseCode title')
      .populate('section', 'sectionName');

    // Trigger event for Socket.IO broadcast
    appEvents.emit(EVENT_NAMES.ANNOUNCEMENT_CREATED, populated);

    return ApiResponse.created(res, 'Announcement created and broadcasted successfully', {
      announcement: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get announcements accessible to current user
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, targetAudience, courseId, sectionId } = req.query;
    let query = {};

    if (req.user.role === ROLES.ADMIN) {
      // Admin sees everything with optional filters
      if (targetAudience) query.targetAudience = targetAudience;
      if (courseId) query.course = courseId;
      if (sectionId) query.section = sectionId;
    } else if (req.user.role === ROLES.FACULTY) {
      // Faculty sees: 'all' + announcements for courses/sections they teach
      const mySections = await Section.find({ faculty: req.user._id }).select('_id course');
      const mySectionIds = mySections.map(s => s._id);
      const myCourseIds = mySections.map(s => s.course);

      query = {
        $or: [
          { targetAudience: ANNOUNCEMENT_TARGET.ALL },
          { section: { $in: mySectionIds } },
          { course: { $in: myCourseIds } },
          { createdBy: req.user._id }
        ]
      };
    } else {
      // Student sees: 'all' + announcements for sections/courses they are enrolled in
      const myEnrollments = await Enrollment.find({
        student: req.user._id,
        status: 'enrolled'
      }).select('course section');

      const enrolledCourseIds = myEnrollments.map(e => e.course);
      const enrolledSectionIds = myEnrollments.map(e => e.section);

      query = {
        $or: [
          { targetAudience: ANNOUNCEMENT_TARGET.ALL },
          { course: { $in: enrolledCourseIds } },
          { section: { $in: enrolledSectionIds } }
        ]
      };
    }

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email role')
      .populate('course', 'courseCode title')
      .populate('section', 'sectionName')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return ApiResponse.paginate(res, 'Announcements fetched successfully', announcements, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * Get announcement by ID
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('course', 'courseCode title')
      .populate('section', 'sectionName');

    if (!announcement) {
      return ApiResponse.error(res, 'Announcement not found', 404);
    }

    return ApiResponse.success(res, 'Announcement retrieved successfully', { announcement });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete announcement (Author or Admin)
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return ApiResponse.error(res, 'Announcement not found', 404);
    }

    if (req.user.role !== ROLES.ADMIN && announcement.createdBy.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Unauthorized to delete this announcement', 403);
    }

    await Announcement.findByIdAndDelete(req.params.id);
    return ApiResponse.success(res, 'Announcement deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  deleteAnnouncement
};
