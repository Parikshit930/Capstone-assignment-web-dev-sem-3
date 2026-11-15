const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { ROLES } = require('../config/constants');
const { idParamValidator } = require('../utils/validators');

// All user management routes require Admin privileges
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', userController.getAllUsers);
router.get('/:id', idParamValidator, validate, userController.getUserById);
router.post('/', userController.createUser);
router.patch('/:id', idParamValidator, validate, userController.updateUser);
router.delete('/:id', idParamValidator, validate, userController.deleteUser);

module.exports = router;
