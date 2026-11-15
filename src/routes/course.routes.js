const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const {
  createCourseValidator,
  updateCourseValidator,
  idParamValidator
} = require('../utils/validators');

// Public or Authenticated read
router.get('/', authenticate, courseController.getAllCourses);
router.get('/:id', authenticate, idParamValidator, validate, courseController.getCourseById);

// Admin only write
router.post('/', authenticate, authorize(ROLES.ADMIN), createCourseValidator, validate, courseController.createCourse);
router.patch('/:id', authenticate, authorize(ROLES.ADMIN), updateCourseValidator, validate, courseController.updateCourse);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), idParamValidator, validate, courseController.deleteCourse);

module.exports = router;
