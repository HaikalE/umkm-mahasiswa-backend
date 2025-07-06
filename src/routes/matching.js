const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const AIMatchingController = require('../controllers/aiMatchingController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// AI Matching calculation validation
const matchingCalculationValidation = [
  body('studentId').isUUID().withMessage('Valid student ID is required'),
  body('projectId').isUUID().withMessage('Valid project ID is required')
];

/**
 * @route   POST /api/matching/calculate
 * @desc    Calculate matching score between student and project
 * @access  Private (Admin or involved parties)
 */
router.post('/calculate',
  authenticate,
  matchingCalculationValidation,
  AIMatchingController.calculateMatching
);

/**
 * @route   GET /api/matching/recommendations/:studentId
 * @desc    Get project recommendations for student based on AI matching
 * @access  Private (Student or Admin)
 */
router.get('/recommendations/:studentId',
  authenticate,
  param('studentId').isUUID().withMessage('Valid student ID is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  query('min_score').optional().isFloat({ min: 0, max: 1 }).withMessage('Min score must be between 0-1'),
  AIMatchingController.getRecommendations
);

/**
 * @route   GET /api/matching/candidates/:projectId
 * @desc    Get best candidate students for a project
 * @access  Private (UMKM or Admin)
 */
router.get('/candidates/:projectId',
  authenticate,
  requireRole(['umkm', 'admin']),
  param('projectId').isUUID().withMessage('Valid project ID is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('min_score').optional().isFloat({ min: 0, max: 1 }).withMessage('Min score must be between 0-1'),
  AIMatchingController.getCandidates
);

module.exports = router;