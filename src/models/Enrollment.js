const mongoose = require('mongoose');
const { ENROLLMENT_STATUS } = require('../config/constants');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required']
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section reference is required']
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.ENROLLED
    },
    grade: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: A student can only enroll in a course once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
// Index for quick lookups by section and student
enrollmentSchema.index({ section: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
