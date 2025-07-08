/**
 * Enhanced API Response Formatter
 * Provides consistent response structure across all endpoints
 * 
 * @author UMKM Mahasiswa Platform Team
 * @version 1.1.0
 */

const logger = require('./logger');

/**
 * Success response format
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || generateRequestId(),
      ...meta
    }
  };

  // Log successful operations
  logger.info('API Success Response', {
    statusCode,
    endpoint: res.req.originalUrl,
    method: res.req.method,
    requestId: response.meta.requestId,
    userId: res.locals.user?.id,
    userType: res.locals.user?.user_type
  });

  return res.status(statusCode).json(response);
};

/**
 * Error response format
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} errors - Detailed error information
 * @param {string} errorCode - Custom error code
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null, errorCode = null) => {
  const response = {
    success: false,
    message,
    errors,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || generateRequestId(),
      errorCode: errorCode || `ERR_${statusCode}`,
      endpoint: res.req.originalUrl,
      method: res.req.method
    }
  };

  // Log error responses
  logger.error('API Error Response', {
    statusCode,
    message,
    errors,
    endpoint: res.req.originalUrl,
    method: res.req.method,
    requestId: response.meta.requestId,
    userId: res.locals.user?.id,
    stack: errors?.stack
  });

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} validationErrors - Array of validation errors
 */
const validationErrorResponse = (res, validationErrors) => {
  const errors = validationErrors.map(error => ({
    field: error.path || error.param,
    message: error.msg || error.message,
    value: error.value,
    location: error.location
  }));

  return errorResponse(res, 'Validation failed', 422, errors, 'VALIDATION_ERROR');
};

/**
 * Pagination response format
 * @param {Object} res - Express response object
 * @param {Array} data - Data array
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const paginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  const meta = {
    pagination: {
      currentPage: parseInt(pagination.page) || 1,
      perPage: parseInt(pagination.limit) || 10,
      totalItems: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (pagination.limit