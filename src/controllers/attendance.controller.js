const Attendance = require('../models/Attendance');
const Section = require('../models/Section');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const ApiResponse = require('../utils/apiResponse');
const { ROLES, ATTENDANCE_STATUS, ENROLLMENT_STATUS } = require('../config/constants');
const { appEvents, EVENT_NAMES } = require('../events/appEvents');

/**
 * Mark attendance for a section session
 * Enforces business rule: Faculty must be assigned to the section
 */
const markAttendance = async (req, res, next) => {
  try {
    const { sectionId, courseId, date, sessionNumber, topicCovered, records } = req.body;

    // Validate section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return ApiResponse.error(res, 'Section not found', 404);
    }

    // Business Rule Check: Faculty can only mark attendance for their assigned sections (Admins can also mark)
    if (req.user.role === ROLES.FACULTY && section.faculty.toString() !== req.user._id.toString()) {
      return ApiResponse.error(
        res,
        'Forbidden: You are not authorized to mark attendance for a course/section not assigned to you.',
        403
      );
    }

    // Ensure section belongs to course
    if (section.course.toString() !== courseId.toString()) {
      return ApiResponse.error(res, 'The provided course does not match the section course', 400);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Business Rule Check: Duplicate session prevention
    const existingAttendance = await Attendance.findOne({
      section: sectionId,
      date: attendanceDate,
      sessionNumber
    });
    if (existingAttendance) {
      return ApiResponse.error(
        res,
        `Duplicate Attendance Error: Attendance for session #${sessionNumber} on ${date} has already been recorded for this section.`,
        409
      );
    }

    // Verify that all students in records are actually enrolled in this section
    const enrolledStudents = await Enrollment.find({
      section: sectionId,
      status: ENROLLMENT_STATUS.ENROLLED
    }).select('student');

    const enrolledIds = new Set(enrolledStudents.map(e => e.student.toString()));
    for (const rec of records) {
      if (!enrolledIds.has(rec.student.toString())) {
        return ApiResponse.error(
          res,
          `Invalid Student Reference: Student with ID ${rec.student} is not enrolled in this section.`,
          400
        );
      }
    }

    const attendance = await Attendance.create({
      section: sectionId,
      course: courseId,
      faculty: req.user._id,
      date: attendanceDate,
      sessionNumber,
      topicCovered: topicCovered || '',
      records: records.map(r => ({
        student: r.student,
        status: r.status,
        remarks: r.remarks || ''
      })),
      auditLog: []
    });

    // Fire application event for decoupled listeners (Socket.IO broadcast, low attendance warnings)
    appEvents.emit(EVENT_NAMES.ATTENDANCE_MARKED, {
      attendanceId: attendance._id,
      sectionId,
      courseId,
      date: attendanceDate,
      sessionNumber,
      records
    });

    return ApiResponse.created(res, 'Attendance recorded successfully', {
      attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Correct / update attendance with mandatory audit trail
 */
const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, records } = req.body;

    const attendance = await Attendance.findById(id).populate('section');
    if (!attendance) {
      return ApiResponse.error(res, 'Attendance record not found', 404);
    }

    // Authorization check
    if (req.user.role === ROLES.FACULTY && attendance.faculty.toString() !== req.user._id.toString()) {
      return ApiResponse.error(
        res,
        'Forbidden: You are not authorized to modify attendance for this section.',
        403
      );
    }

    // Build audit diff
    const changedRecords = [];
    const recordMap = new Map();
    attendance.records.forEach(r => recordMap.set(r.student.toString(), r.status));

    const updatedRecords = [];
    for (const rec of records) {
      const oldStatus = recordMap.get(rec.student.toString());
      if (oldStatus && oldStatus !== rec.status) {
        changedRecords.push({
          student: rec.student,
          oldStatus,
          newStatus: rec.status
        });
      }
      updatedRecords.push({
        student: rec.student,
        status: rec.status,
        remarks: rec.remarks || ''
      });
    }

    // Append to audit log
    attendance.auditLog.push({
      modifiedBy: req.user._id,
      modifiedAt: new Date(),
      reason,
      changedRecords
    });

    attendance.records = updatedRecords;
    await attendance.save();

    // Trigger update event
    appEvents.emit(EVENT_NAMES.ATTENDANCE_UPDATED, {
      attendanceId: attendance._id,
      sectionId: attendance.section._id,
      reason
    });

    return ApiResponse.success(res, 'Attendance updated with audit record successfully', {
      attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance records for a section (Faculty or Admin)
 */
const getSectionAttendance = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { startDate, endDate } = req.query;

    const section = await Section.findById(sectionId);
    if (!section) {
      return ApiResponse.error(res, 'Section not found', 404);
    }

    if (req.user.role === ROLES.FACULTY && section.faculty.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'You are not assigned to this section', 403);
    }

    const query = { section: sectionId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendances = await Attendance.find(query)
      .populate('course', 'courseCode title')
      .populate('records.student', 'name email studentId')
      .populate('auditLog.modifiedBy', 'name email')
      .sort({ date: -1, sessionNumber: -1 });

    return ApiResponse.success(res, 'Section attendance retrieved successfully', {
      totalSessions: attendances.length,
      attendances
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get individual student attendance across enrolled courses or a specific course
 * Enforces business rule: Students can only view their own attendance!
 */
const getStudentAttendance = async (req, res, next) => {
  try {
    let studentId = req.params.studentId;

    // Business rule: Student cannot view another student's attendance
    if (req.user.role === ROLES.STUDENT) {
      if (studentId && studentId.toString() !== req.user._id.toString()) {
        return ApiResponse.error(res, 'Forbidden: You cannot view another student private attendance record.', 403);
      }
      studentId = req.user._id;
    }

    if (!studentId) {
      studentId = req.user._id;
    }

    const { courseId } = req.query;

    // Get all sessions where student was marked
    const query = { 'records.student': studentId };
    if (courseId) {
      query.course = courseId;
    }

    const sessions = await Attendance.find(query)
      .populate('course', 'courseCode title credits')
      .populate('section', 'sectionName academicYear')
      .populate('faculty', 'name email')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {};
    sessions.forEach(sess => {
      const cId = sess.course._id.toString();
      if (!summary[cId]) {
        summary[cId] = {
          courseId: cId,
          courseCode: sess.course.courseCode,
          courseTitle: sess.course.title,
          totalClasses: 0,
          attendedClasses: 0,
          absentClasses: 0,
          lateClasses: 0,
          excusedClasses: 0,
          percentage: 0
        };
      }

      summary[cId].totalClasses += 1;
      const studentRecord = sess.records.find(r => r.student.toString() === studentId.toString());
      if (studentRecord) {
        if (studentRecord.status === ATTENDANCE_STATUS.PRESENT) {
          summary[cId].attendedClasses += 1;
        } else if (studentRecord.status === ATTENDANCE_STATUS.LATE) {
          summary[cId].attendedClasses += 1; // Late counts towards attendance
          summary[cId].lateClasses += 1;
        } else if (studentRecord.status === ATTENDANCE_STATUS.ABSENT) {
          summary[cId].absentClasses += 1;
        } else if (studentRecord.status === ATTENDANCE_STATUS.EXCUSED) {
          summary[cId].excusedClasses += 1;
        }
      }
    });

    Object.values(summary).forEach(item => {
      item.percentage = item.totalClasses > 0
        ? Number(((item.attendedClasses / item.totalClasses) * 100).toFixed(2))
        : 0;
    });

    return ApiResponse.success(res, 'Student attendance records retrieved successfully', {
      studentId,
      summaries: Object.values(summary),
      detailedSessions: sessions.map(s => {
        const myRecord = s.records.find(r => r.student.toString() === studentId.toString());
        return {
          attendanceId: s._id,
          course: s.course,
          section: s.section,
          faculty: s.faculty,
          date: s.date,
          sessionNumber: s.sessionNumber,
          topicCovered: s.topicCovered,
          myStatus: myRecord ? myRecord.status : 'not_recorded',
          remarks: myRecord ? myRecord.remarks : ''
        };
      })
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  updateAttendance,
  getSectionAttendance,
  getStudentAttendance
};
