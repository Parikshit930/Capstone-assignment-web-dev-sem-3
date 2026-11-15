const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const {
  createEnrollmentValidator,
  idParamValidator
} = require('../utils/validators');

router.use(authenticate);

// Student views own enrollments
router.get('/my-courses', authorize(ROLES.STUDENT), enrollmentController.getMyEnrollments);

// Enroll in a course (Student self-enroll, or Admin)
router.post('/enroll', authorize(ROLES.STUDENT, ROLES.ADMIN), createEnrollmentValidator, validate, enrollmentController.enrollStudent);

// Drop enrollment (Student or Admin)
router.delete('/:id/drop', idParamValidator, validate, enrollmentController.dropEnrollment);

// Section enrollment roster (Faculty or Admin)
router.get('/section/:sectionId', authorize(ROLES.FACULTY, ROLES.ADMIN), enrollmentController.getSectionEnrollments);

module.exports = router;
