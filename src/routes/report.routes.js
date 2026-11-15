const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.FACULTY));

// Aggregation 1: Subject-wise attendance calculation & defaulter list
router.get('/attendance-analytics', reportController.getAttendanceAnalytics);

// Aggregation 2: Course & section enrolment capacity analytics
router.get('/enrollment-capacity', reportController.getEnrollmentCapacityAnalytics);

// Aggregation 3: Department academic overview
router.get('/department-summary', reportController.getDepartmentSummary);

module.exports = router;
