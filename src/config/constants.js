/**
 * Application Constants
 */
module.exports = {
  ROLES: {
    ADMIN: 'admin',
    FACULTY: 'faculty',
    STUDENT: 'student'
  },
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused'
  },
  ENROLLMENT_STATUS: {
    ENROLLED: 'enrolled',
    DROPPED: 'dropped',
    COMPLETED: 'completed'
  },
  ANNOUNCEMENT_TARGET: {
    ALL: 'all',
    COURSE: 'course',
    SECTION: 'section'
  },
  ANNOUNCEMENT_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },
  DEFAULT_ATTENDANCE_THRESHOLD: 75 // 75% minimum attendance rule
};
