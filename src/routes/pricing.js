const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const PricingController = require('../controllers/pricingController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Price suggestion validation
const priceSuggestionValidation = [
  body('category').isIn([
    'web_development', 'mobile_development', 'ui_ux_design', 
    'graphic_design', 'digital_marketing', 'content_writing',
    'data_analysis', 'video_editing', 'photography', 'consulting'
  ]).withMessage('Invalid category'),
  body('required_skills').optional().isArray().withMessage('Required skills must be an array'),
  body('experience_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid experience level'),
  body('duration').optional().isInt({ min: 1, max: 365 }).withMessage('Duration must be 1-365 days'),
  body('project_scope').optional().isIn(['small', 'medium', 'large', 'enterprise']).withMessage('Invalid project scope'),
  body('complexity_factors').optional().isObject().withMessage('Complexity factors must be an object')
];

// Pricing tier creation validation (Admin only)
const pricingTierValidation = [
  body('category').isIn([
    'web_development', 'mobile_development', 'ui_ux_design', 
    'graphic_design', 'digital_marketing', 'content_writing',
    'data_analysis', 'video_editing', 'photography', 'consulting'
  ]).withMessage('Invalid category'),
  body('skill_level').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid skill level'),
  body('min_price').isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  body('max_price').isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  body('recommended_price').isFloat({ min: 0 }).withMessage('Recommended price must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('price_per').optional().isIn(['project', 'hour', 'day', 'week', 'month']).withMessage('Invalid price_per value'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('examples').optional().isArray().withMessage('Examples must be an array')
];

/**
 * @route   GET /api/pricing/categories
 * @desc    Get pricing tiers by category and skill level
 * @access  Public
 */
router.get('/categories',
  query('category').optional().isIn([
    'web_development', 'mobile_development', 'ui_ux_design', 
    'graphic_design', 'digital_marketing', 'content_writing',
    'data_analysis', 'video_editing', 'photography', 'consulting'
  ]).withMessage('Invalid category'),
  query('skill_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid skill level'),
  PricingController.getPricingByCategory
);

/**
 * @route   POST /api/pricing/suggest
 * @desc    Get smart price suggestion for a project
 * @access  Private
 */
router.post('/suggest',
  authenticate,
  priceSuggestionValidation,
  PricingController.suggestPrice
);

/**
 * @route   GET /api/pricing/analytics
 * @desc    Get pricing analytics and market trends
 * @access  Private (UMKM and Admin)
 */
router.get('/analytics',
  authenticate,
  requireRole(['umkm', 'admin']),
  query('category').optional().isIn([
    'web_development', 'mobile_development', 'ui_ux_design', 
    'graphic_design', 'digital_marketing', 'content_writing',
    'data_analysis', 'video_editing', 'photography', 'consulting'
  ]).withMessage('Invalid category'),
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be 1-365 days'),
  PricingController.getPricingAnalytics
);

/**
 * @route   POST /api/pricing/admin/tiers
 * @desc    Create or update pricing tier (Admin only)
 * @access  Private (Admin only)
 */
router.post('/admin/tiers',
  authenticate,
  requireRole(['admin']),
  pricingTierValidation,
  PricingController.createPricingTier
);

module.exports = router;