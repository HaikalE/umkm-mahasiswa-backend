/**
 * Standardized API response utilities
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const successResponse = (res, data = null, message = 'Operation successful', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Detailed errors
 */
const errorResponse = (res, message = 'Operation failed', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.message = 'Internal server error';
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Data items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginatedResponse = (res, items, pagination, message = 'Data retrieved successfully') => {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} validationErrors - Validation errors array
 */
const validationErrorResponse = (res, validationErrors) => {
  const errors = validationErrors.map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Authentication error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const authErrorResponse = (res, message = 'Authentication failed') => {
  return res.status(401).json({
    success: false,
    message,
    code: 'AUTHENTICATION_ERROR',
    timestamp: new Date().toISOString()
  });
};

/**
 * Authorization error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const authorizationErrorResponse = (res, message = 'Insufficient permissions') => {
  return res.status(403).json({
    success: false,
    message,
    code: 'AUTHORIZATION_ERROR',
    timestamp: new Date().toISOString()
  });
};

/**
 * Not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
};

/**
 * Rate limit error response
 * @param {Object} res - Express response object
 */
const rateLimitResponse = (res) => {
  return res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  });
};

/**
 * File upload error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const fileUploadErrorResponse = (res, message = 'File upload failed') => {
  return res.status(400).json({
    success: false,
    message,
    code: 'FILE_UPLOAD_ERROR',
    timestamp: new Date().toISOString()
  });
};

/**
 * Database error response
 * @param {Object} res - Express response object
 * @param {Error} error - Database error
 */
const databaseErrorResponse = (res, error) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  // Handle specific database errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(error.fields)[0];
    message = `${field} already exists`;
    statusCode = 400;
  } else if (error.name === 'SequelizeValidationError') {
    message = 'Validation failed';
    statusCode = 400;
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    message = 'Invalid reference to related resource';
    statusCode = 400;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    code: 'DATABASE_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  authErrorResponse,
  authorizationErrorResponse,
  notFoundResponse,
  rateLimitResponse,
  fileUploadErrorResponse,
  databaseErrorResponse
};