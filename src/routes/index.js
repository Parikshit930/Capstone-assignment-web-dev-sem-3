const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const courseRoutes = require('./course.routes');
const sectionRoutes = require('./section.routes');
const enrollmentRoutes = require('./enrollment.routes');
const attendanceRoutes = require('./attendance.routes');
const announcementRoutes = require('./announcement.routes');
const reportRoutes = require('./report.routes');

// System Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'University Campus Management API'
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/sections', sectionRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/announcements', announcementRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
