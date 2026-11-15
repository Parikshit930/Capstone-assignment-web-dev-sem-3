/**
 * Standardized API Response Helper
 */
class ApiResponse {
  static success(res, message = 'Success', data = null, statusCode = 200, meta = null) {
    const payload = {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    if (meta) {
      payload.meta = meta;
    }
    return res.status(statusCode).json(payload);
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return ApiResponse.success(res, message, data, 201);
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const payload = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString()
    };
    if (errors) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  }

  static paginate(res, message = 'Data retrieved successfully', data = [], total = 0, page = 1, limit = 10) {
    const totalPages = Math.ceil(total / limit) || 1;
    return ApiResponse.success(res, message, data, 200, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  }
}

module.exports = ApiResponse;
