const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/section.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const {
  createSectionValidator,
  updateSectionValidator,
  idParamValidator
} = require('../utils/validators');

router.use(authenticate);

// Faculty view assigned sections
router.get('/my-assigned', authorize(ROLES.FACULTY), sectionController.getMyAssignedSections);

// General Section routes
router.get('/', sectionController.getAllSections);
router.get('/:id', idParamValidator, validate, sectionController.getSectionById);

// Admin-only management
router.post('/', authorize(ROLES.ADMIN), createSectionValidator, validate, sectionController.createSection);
router.patch('/:id', authorize(ROLES.ADMIN), updateSectionValidator, validate, sectionController.updateSection);
router.delete('/:id', authorize(ROLES.ADMIN), idParamValidator, validate, sectionController.deleteSection);

module.exports = router;
