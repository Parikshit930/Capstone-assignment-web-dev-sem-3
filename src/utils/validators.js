const { body, param, query } = require('express-validator');
const { ROLES, ATTENDANCE_STATUS, ANNOUNCEMENT_TARGET, ANNOUNCEMENT_PRIORITY } = require('../config/constants');

// Auth Validators
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  body('department').optional().trim(),
  body('phone').optional().trim()
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

// Course Validators
const createCourseValidator = [
  body('courseCode').trim().notEmpty().withMessage('Course code is required').toUpperCase(),
  body('title').trim().notEmpty().withMessage('Course title is required'),
  body('credits').isInt({ min: 1, max: 8 }).withMessage('Credits must be an integer between 1 and 8'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('description').optional().trim()
];

const updateCourseValidator = [
  param('id').isMongoId().withMessage('Invalid course ID format'),
  body('courseCode').optional().trim().toUpperCase(),
  body('title').optional().trim().notEmpty().withMessage('Course title cannot be empty'),
  body('credits').optional().isInt({ min: 1, max: 8 }).withMessage('Credits must be between 1 and 8'),
  body('department').optional().trim(),
  body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('description').optional().trim()
];

// Section Validators
const createSectionValidator = [
  body('sectionName').trim().notEmpty().withMessage('Section name is required (e.g. Section A)').toUpperCase(),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('faculty').isMongoId().withMessage('Valid faculty user ID is required'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required (e.g. 2026-2027)'),
  body('maxCapacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('roomNumber').optional().trim(),
  body('schedule').optional().trim()
];

const updateSectionValidator = [
  param('id').isMongoId().withMessage('Invalid section ID format'),
  body('faculty').optional().isMongoId().withMessage('Valid faculty ID is required'),
  body('sectionName').optional().trim().toUpperCase(),
  body('maxCapacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('roomNumber').optional().trim(),
  body('schedule').optional().trim()
];

// Enrollment Validators
const createEnrollmentValidator = [
  body('studentId').optional().isMongoId().withMessage('Invalid student ID format'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('sectionId').isMongoId().withMessage('Valid section ID is required')
];

// Attendance Validators
const markAttendanceValidator = [
  body('sectionId').isMongoId().withMessage('Valid section ID is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('date').isISO8601().withMessage('Valid ISO date is required (YYYY-MM-DD)'),
  body('sessionNumber').isInt({ min: 1 }).withMessage('Session number must be a positive integer'),
  body('topicCovered').optional().trim(),
  body('records').isArray({ min: 1 }).withMessage('Attendance records array is required and must not be empty'),
  body('records.*.student').isMongoId().withMessage('Valid student ID is required for each record'),
  body('records.*.status').isIn(Object.values(ATTENDANCE_STATUS)).withMessage(`Status must be one of: ${Object.values(ATTENDANCE_STATUS).join(', ')}`),
  body('records.*.remarks').optional().trim()
];

const updateAttendanceValidator = [
  param('id').isMongoId().withMessage('Invalid attendance ID format'),
  body('reason').trim().notEmpty().withMessage('Audit reason for attendance update is required'),
  body('records').isArray({ min: 1 }).withMessage('Updated records array is required'),
  body('records.*.student').isMongoId().withMessage('Valid student ID is required for each record'),
  body('records.*.status').isIn(Object.values(ATTENDANCE_STATUS)).withMessage(`Status must be one of: ${Object.values(ATTENDANCE_STATUS).join(', ')}`),
  body('records.*.remarks').optional().trim()
];

// Announcement Validators
const createAnnouncementValidator = [
  body('title').trim().notEmpty().withMessage('Announcement title is required'),
  body('content').trim().notEmpty().withMessage('Announcement content is required'),
  body('targetAudience').isIn(Object.values(ANNOUNCEMENT_TARGET)).withMessage(`Target audience must be one of: ${Object.values(ANNOUNCEMENT_TARGET).join(', ')}`),
  body('priority').optional().isIn(Object.values(ANNOUNCEMENT_PRIORITY)).withMessage(`Priority must be one of: ${Object.values(ANNOUNCEMENT_PRIORITY).join(', ')}`),
  body('courseId').optional().isMongoId().withMessage('Invalid course ID format'),
  body('sectionId').optional().isMongoId().withMessage('Invalid section ID format')
];

// Id Param Validator
const idParamValidator = [
  param('id').isMongoId().withMessage('Invalid ID format')
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  createCourseValidator,
  updateCourseValidator,
  createSectionValidator,
  updateSectionValidator,
  createEnrollmentValidator,
  markAttendanceValidator,
  updateAttendanceValidator,
  createAnnouncementValidator,
  idParamValidator
};
