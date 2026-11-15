const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const studentAttendanceItemSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const auditLogSchema = new mongoose.Schema(
  {
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    changedRecords: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        oldStatus: String,
        newStatus: String
      }
    ]
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section reference is required']
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required']
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    sessionNumber: {
      type: Number,
      required: [true, 'Session/lecture number is required'],
      min: 1
    },
    topicCovered: {
      type: String,
      trim: true
    },
    records: [studentAttendanceItemSchema],
    auditLog: [auditLogSchema]
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate attendance entry for same section, date, and session
attendanceSchema.index({ section: 1, date: 1, sessionNumber: 1 }, { unique: true });
// Index for fast query of student records in aggregations
attendanceSchema.index({ 'records.student': 1 });
attendanceSchema.index({ course: 1, date: 1 });
attendanceSchema.index({ faculty: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
