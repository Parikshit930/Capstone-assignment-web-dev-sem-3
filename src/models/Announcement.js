const mongoose = require('mongoose');
const { ANNOUNCEMENT_TARGET, ANNOUNCEMENT_PRIORITY } = require('../config/constants');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_PRIORITY),
      default: ANNOUNCEMENT_PRIORITY.MEDIUM
    },
    targetAudience: {
      type: String,
      enum: Object.values(ANNOUNCEMENT_TARGET),
      required: [true, 'Target audience is required'],
      default: ANNOUNCEMENT_TARGET.ALL
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required']
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
announcementSchema.index({ targetAudience: 1, course: 1, section: 1, createdAt: -1 });
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
