const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource ID format: ${err.value}`;
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate resource error: A record with the given ${fields} already exists.`;
    errors = err.keyValue;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Log server errors for debugging in development
  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error('[Error Middleware]', err);
  }

  return ApiResponse.error(res, message, statusCode, errors);
};

// 404 Route Not Found Middleware
const notFoundHandler = (req, res, next) => {
  return ApiResponse.error(res, `Cannot ${req.method} ${req.originalUrl} - Route not found`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
