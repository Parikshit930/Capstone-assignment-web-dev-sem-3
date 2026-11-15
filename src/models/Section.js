const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      uppercase: true
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
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true
    },
    term: {
      type: String,
      default: 'Current'
    },
    roomNumber: {
      type: String,
      trim: true
    },
    schedule: {
      type: String,
      trim: true
    },
    maxCapacity: {
      type: Number,
      default: 60,
      min: [1, 'Capacity must be at least 1']
    },
    currentEnrolled: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness of a section within a course and academic year
sectionSchema.index({ course: 1, sectionName: 1, academicYear: 1 }, { unique: true });
sectionSchema.index({ faculty: 1 });

module.exports = mongoose.model('Section', sectionSchema);
