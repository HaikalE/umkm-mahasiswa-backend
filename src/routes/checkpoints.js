const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const CheckpointController = require('../controllers/checkpointController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Checkpoint creation validation
const checkpointCreationValidation = [
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('checkpoints').isArray({ min: 1 }).withMessage('At least one checkpoint is required'),
  body('checkpoints.*.title').isLength({ min: 3, max: 100 }).withMessage('Checkpoint title must be 3-100 characters'),
  body('checkpoints.*.description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('checkpoints.*.weight_percentage').isInt({ min: 1, max: 100 }).withMessage('Weight percentage must be 1-100'),
  body('checkpoints.*.due_date').optional().isISO8601().withMessage('Due date must be valid ISO date'),
  body('checkpoints.*.deliverables').optional().isArray().withMessage('Deliverables must be an array'),
  body('checkpoints.*.is_mandatory').optional().isBoolean().withMessage('is_mandatory must be boolean')
];

// Checkpoint submission validation
const checkpointSubmissionValidation = [
  body('submission').isLength({ min: 10, max: 2000 }).withMessage('Submission must be 10-2000 characters'),
  body('submissionFiles').optional().isArray().withMessage('Submission files must be an array'),
  body('completionPercentage').optional().isInt({ min: 0, max: 100 }).withMessage('Completion percentage must be 0-100')
];

// Checkpoint review validation
const checkpointReviewValidation = [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('feedback').isLength({ min: 5, max: 1000 }).withMessage('Feedback must be 5-1000 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5')
];

// Checkpoint update validation
const checkpointUpdateValidation = [
  body('title').optional().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description max 1000 characters'),
  body('deliverables').optional().isArray().withMessage('Deliverables must be an array'),
  body('due_date').optional().isISO8601().withMessage('Due date must be valid ISO date'),
  body('weight_percentage').optional().isInt({ min: 1, max: 100 }).withMessage('Weight percentage must be 1-100'),
  body('is_mandatory').optional().isBoolean().withMessage('is_mandatory must be boolean')
];

/**
 * @route   POST /api/checkpoints/create
 * @desc    Create project checkpoints
 * @access  Private (UMKM only)
 */
router.post('/create',
  authenticate,
  requireRole(['umkm']),
  checkpointCreationValidation,
  CheckpointController.createCheckpoints
);

/**
 * @route   GET /api/checkpoints/project/:projectId
 * @desc    Get all checkpoints for a project
 * @access  Private (Project participants only)
 */
router.get('/project/:projectId',
  authenticate,
  param('projectId').isUUID().withMessage('Valid project ID is required'),
  CheckpointController.getProjectCheckpoints
);

/**
 * @route   POST /api/checkpoints/:checkpointId/submit
 * @desc    Submit checkpoint by student
 * @access  Private (Student only)
 */
router.post('/:checkpointId/submit',
  authenticate,
  requireRole(['student']),
  param('checkpointId').isUUID().withMessage('Valid checkpoint ID is required'),
  checkpointSubmissionValidation,
  CheckpointController.submitCheckpoint
);

/**
 * @route   POST /api/checkpoints/:checkpointId/review
 * @desc    Review and approve/reject checkpoint by UMKM
 * @access  Private (UMKM only)
 */
router.post('/:checkpointId/review',
  authenticate,
  requireRole(['umkm']),
  param('checkpointId').isUUID().withMessage('Valid checkpoint ID is required'),
  checkpointReviewValidation,
  CheckpointController.reviewCheckpoint
);

/**
 * @route   PUT /api/checkpoints/:checkpointId
 * @desc    Update checkpoint details (UMKM only)
 * @access  Private (UMKM only)
 */
router.put('/:checkpointId',
  authenticate,
  requireRole(['umkm']),
  param('checkpointId').isUUID().withMessage('Valid checkpoint ID is required'),
  checkpointUpdateValidation,
  CheckpointController.updateCheckpoint
);

/**
 * @route   GET /api/checkpoints/dashboard
 * @desc    Get checkpoint dashboard analytics
 * @access  Private
 */
router.get('/dashboard',
  authenticate,
  CheckpointController.getDashboard
);

module.exports = router;