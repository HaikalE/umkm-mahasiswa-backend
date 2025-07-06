const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const PaymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Payment initiation validation
const paymentInitiationValidation = [
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('paymentPhase').isIn(['initial', 'final']).withMessage('Payment phase must be initial or final'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').isIn(['bank_transfer', 'e_wallet', 'credit_card', 'virtual_account', 'qris']).withMessage('Invalid payment method')
];

// Payment verification validation
const paymentVerificationValidation = [
  body('transaction_id').notEmpty().withMessage('Transaction ID is required'),
  body('order_id').isUUID().withMessage('Valid order ID is required')
];

// Refund request validation
const refundRequestValidation = [
  body('reason').isLength({ min: 10, max: 500 }).withMessage('Refund reason must be between 10-500 characters')
];

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate payment for project (50% initial or 100% final)
 * @access  Private (UMKM only)
 */
router.post('/initiate', 
  authenticate, 
  requireRole(['umkm']),
  paymentInitiationValidation,
  PaymentController.initiatePayment
);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment from payment gateway callback
 * @access  Public (Payment Gateway Webhook)
 */
router.post('/verify',
  paymentVerificationValidation,
  PaymentController.verifyPayment
);

/**
 * @route   GET /api/payments/project/:projectId
 * @desc    Get payment status for a project
 * @access  Private (Project participants only)
 */
router.get('/project/:projectId',
  authenticate,
  param('projectId').isUUID().withMessage('Valid project ID is required'),
  PaymentController.getProjectPayments
);

/**
 * @route   GET /api/payments/history
 * @desc    Get user's payment history
 * @access  Private
 */
router.get('/history',
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1-50'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status'),
  query('payment_phase').optional().isIn(['initial', 'final']).withMessage('Invalid payment phase'),
  PaymentController.getPaymentHistory
);

/**
 * @route   POST /api/payments/:paymentId/refund
 * @desc    Request refund for a payment
 * @access  Private
 */
router.post('/:paymentId/refund',
  authenticate,
  param('paymentId').isUUID().withMessage('Valid payment ID is required'),
  refundRequestValidation,
  PaymentController.requestRefund
);

module.exports = router;