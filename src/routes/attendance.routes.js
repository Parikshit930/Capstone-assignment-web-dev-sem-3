const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const {
  markAttendanceValidator,
  updateAttendanceValidator,
  idParamValidator
} = require('../utils/validators');

router.use(authenticate);

// Mark attendance (Faculty or Admin)
router.post('/mark', authorize(ROLES.FACULTY, ROLES.ADMIN), markAttendanceValidator, validate, attendanceController.markAttendance);

// Update/audit attendance (Faculty or Admin)
router.patch('/:id', authorize(ROLES.FACULTY, ROLES.ADMIN), updateAttendanceValidator, validate, attendanceController.updateAttendance);

// Section attendance history (Faculty or Admin)
router.get('/section/:sectionId', authorize(ROLES.FACULTY, ROLES.ADMIN), attendanceController.getSectionAttendance);

// Student attendance summary & detail (Student views own; Faculty/Admin can view any)
router.get('/student/:studentId?', attendanceController.getStudentAttendance);

module.exports = router;
