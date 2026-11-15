const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {}

const appEvents = new AppEventEmitter();

// Predefined application event constants
const EVENT_NAMES = {
  ATTENDANCE_MARKED: 'attendance.marked',
  ATTENDANCE_UPDATED: 'attendance.updated',
  ANNOUNCEMENT_CREATED: 'announcement.created',
  ENROLLMENT_CREATED: 'enrollment.created',
  LOW_ATTENDANCE_ALERT: 'attendance.low_alert'
};

module.exports = {
  appEvents,
  EVENT_NAMES
};
