const ApiResponse = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required before checking permissions.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Access forbidden: User with role '${req.user.role}' is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

module.exports = authorize;
