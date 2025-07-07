const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('user_type')
    .isIn(['umkm', 'student'])
    .withMessage('User type must be either umkm or student'),
  body('phone')
    .optional()
    .isMobilePhone('id-ID')
    .withMessage('Valid Indonesian phone number is required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateRefreshToken = [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors
];

// UMKM profile validation
const validateUmkmProfile = [
  body('business_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('business_type')
    .isIn(['kuliner', 'fashion', 'teknologi', 'kerajinan', 'jasa', 'perdagangan', 'pertanian', 'lainnya'])
    .withMessage('Invalid business type'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Valid website URL is required'),
  handleValidationErrors
];

// Student profile validation
const validateStudentProfile = [
  body('university')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('University name must be between 2 and 100 characters'),
  body('major')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Major must be between 2 and 100 characters'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 14 })
    .withMessage('Semester must be between 1 and 14'),
  body('graduation_year')
    .optional()
    .isInt({ min: 2020, max: 2035 })
    .withMessage('Graduation year must be between 2020 and 2035'),
  body('experience_level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid experience level'),
  handleValidationErrors
];

// Product validation
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('category')
    .isIn(['kuliner', 'fashion', 'teknologi', 'kerajinan', 'jasa', 'perdagangan', 'pertanian', 'lainnya'])
    .withMessage('Invalid category'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('discount_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number'),
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  handleValidationErrors
];

// Project validation
const validateProject = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Project title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Project description must be between 20 and 5000 characters'),
  body('category')
    .isIn([
      'web_development', 'mobile_development', 'ui_ux_design', 
      'graphic_design', 'digital_marketing', 'content_writing',
      'data_analysis', 'video_editing', 'photography', 'consulting', 'lainnya'
    ])
    .withMessage('Invalid project category'),
  body('budget_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('experience_level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid experience level'),
  body('location_type')
    .optional()
    .isIn(['remote', 'onsite', 'hybrid'])
    .withMessage('Invalid location type'),
  handleValidationErrors
];

// Application validation
const validateApplication = [
  body('cover_letter')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Cover letter must be between 50 and 2000 characters'),
  body('proposed_budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Proposed budget must be a positive number'),
  body('proposed_duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Proposed duration must be a positive integer'),
  handleValidationErrors
];

// Review validation
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),
  body('review_type')
    .isIn(['product', 'service', 'collaboration'])
    .withMessage('Invalid review type'),
  handleValidationErrors
];

// Chat message validation
const validateChatMessage = [
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('message_type')
    .optional()
    .isIn(['text', 'image', 'file', 'audio', 'video', 'location'])
    .withMessage('Invalid message type'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateRefreshToken,
  validateUmkmProfile,
  validateStudentProfile,
  validateProduct,
  validateProject,
  validateApplication,
  validateReview,
  validateChatMessage,
  validatePagination,
  validateUUID
};