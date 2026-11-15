const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const {
  createAnnouncementValidator,
  idParamValidator
} = require('../utils/validators');

router.use(authenticate);

// Get announcements accessible to current user
router.get('/', announcementController.getAnnouncements);
router.get('/:id', idParamValidator, validate, announcementController.getAnnouncementById);

// Create announcement (Faculty or Admin)
router.post(
  '/',
  authorize(ROLES.FACULTY, ROLES.ADMIN),
  createAnnouncementValidator,
  validate,
  announcementController.createAnnouncement
);

// Delete announcement
router.delete('/:id', idParamValidator, validate, announcementController.deleteAnnouncement);

module.exports = router;
