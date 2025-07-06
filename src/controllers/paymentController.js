const { Payment, Project, User, UmkmProfile, StudentProfile, Notification } = require('../database/models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const moment = require('moment');

// Mock payment gateway - replace with actual Midtrans/Xendit implementation
const paymentGateway = {
  midtrans: {
    createTransaction: async (params) => {
      // Mock Midtrans API call
      return {
        transaction_id: `TXN-${Date.now()}`,
        redirect_url: `https://app.midtrans.com/snap/v1/transactions/${params.orderId}`,
        status: 'pending'
      };
    },
    verifyTransaction: async (transactionId) => {
      // Mock verification
      return {
        transaction_status: 'settlement',
        fraud_status: 'accept',
        settlement_time: new Date().toISOString()
      };
    }
  }
};

class PaymentController {
  /**
   * Initiate payment (50% initial or 100% final)
   * POST /api/payments/initiate
   */
  static async initiatePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { projectId, paymentPhase, amount, paymentMethod } = req.body;
      const umkmId = req.user.id;

      // Validate project ownership
      const project = await Project.findOne({
        where: { id: projectId, umkm_id: umkmId },
        include: [
          {
            model: User,
            as: 'selectedStudent',
            include: [{ model: StudentProfile, as: 'studentProfile' }]
          }
        ]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or not authorized'
        });
      }

      if (!project.selected_student_id) {
        return res.status(400).json({
          success: false,
          message: 'No student selected for this project'
        });
      }

      // Check if payment already exists for this phase
      const existingPayment = await Payment.findOne({
        where: {
          project_id: projectId,
          payment_phase: paymentPhase
        }
      });

      if (existingPayment && existingPayment.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: `Payment for ${paymentPhase} phase already completed`
        });
      }

      // Calculate amounts and fees
      const adminFeePercentage = 0.05; // 5% platform fee
      const adminFee = amount * adminFeePercentage;
      const netAmount = amount - adminFee;

      // Create payment record
      const payment = await Payment.create({
        project_id: projectId,
        umkm_id: umkmId,
        student_id: project.selected_student_id,
        payment_phase: paymentPhase,
        amount: amount,
        currency: 'IDR',
        payment_method: paymentMethod,
        payment_gateway: 'midtrans',
        status: 'pending',
        admin_fee: adminFee,
        net_amount: netAmount,
        due_date: moment().add(7, 'days').toDate() // 7 days to complete payment
      });

      // Create payment gateway transaction
      const gatewayResponse = await paymentGateway.midtrans.createTransaction({
        orderId: payment.id,
        amount: amount,
        customerDetails: {
          first_name: req.user.full_name,
          email: req.user.email,
          phone: req.user.phone
        },
        itemDetails: {
          id: projectId,
          price: amount,
          quantity: 1,
          name: `Project Payment - ${paymentPhase} phase`
        }
      });

      // Update payment with gateway response
      await payment.update({
        transaction_id: gatewayResponse.transaction_id,
        payment_gateway_response: gatewayResponse
      });

      // Create notification for student
      await Notification.create({
        user_id: project.selected_student_id,
        title: 'Payment Initiated',
        message: `UMKM has initiated ${paymentPhase} payment for project: ${project.title}`,
        type: 'payment_initiated',
        related_id: payment.id,
        related_type: 'payment'
      });

      logger.info('Payment initiated', {
        paymentId: payment.id,
        projectId: projectId,
        umkmId: umkmId,
        amount: amount,
        phase: paymentPhase
      });

      res.status(201).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          payment: {
            id: payment.id,
            amount: payment.amount,
            phase: payment.payment_phase,
            status: payment.status,
            due_date: payment.due_date
          },
          payment_url: gatewayResponse.redirect_url,
          transaction_id: gatewayResponse.transaction_id
        }
      });

    } catch (error) {
      logger.error('Error initiating payment', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Verify payment callback from payment gateway
   * POST /api/payments/verify
   */
  static async verifyPayment(req, res) {
    try {
      const { transaction_id, order_id } = req.body;

      // Find payment record
      const payment = await Payment.findOne({
        where: { 
          id: order_id,
          transaction_id: transaction_id 
        },
        include: [
          {
            model: Project,
            as: 'project',
            include: [
              { model: User, as: 'umkm' },
              { model: User, as: 'selectedStudent' }
            ]
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Verify with payment gateway
      const gatewayVerification = await paymentGateway.midtrans.verifyTransaction(transaction_id);

      if (gatewayVerification.transaction_status === 'settlement' && 
          gatewayVerification.fraud_status === 'accept') {
        
        // Update payment status
        await payment.update({
          status: 'completed',
          paid_at: new Date(),
          payment_gateway_response: {
            ...payment.payment_gateway_response,
            verification: gatewayVerification
          }
        });

        // Update project status based on payment phase
        if (payment.payment_phase === 'initial') {
          await payment.project.update({ status: 'in_progress' });
        } else if (payment.payment_phase === 'final') {
          await payment.project.update({ status: 'completed' });
        }

        // Create notifications
        await Promise.all([
          // Notify student
          Notification.create({
            user_id: payment.student_id,
            title: 'Payment Completed',
            message: `Payment received for ${payment.payment_phase} phase of project: ${payment.project.title}`,
            type: 'payment_completed',
            related_id: payment.id,
            related_type: 'payment'
          }),
          // Notify UMKM
          Notification.create({
            user_id: payment.umkm_id,
            title: 'Payment Processed',
            message: `Your ${payment.payment_phase} payment has been processed successfully`,
            type: 'payment_processed',
            related_id: payment.id,
            related_type: 'payment'
          })
        ]);

        logger.info('Payment verified and completed', {
          paymentId: payment.id,
          transactionId: transaction_id,
          amount: payment.amount
        });

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            payment_id: payment.id,
            status: payment.status,
            amount: payment.amount,
            phase: payment.payment_phase
          }
        });

      } else {
        // Payment failed
        await payment.update({
          status: 'failed',
          payment_gateway_response: {
            ...payment.payment_gateway_response,
            verification: gatewayVerification
          }
        });

        res.json({
          success: false,
          message: 'Payment verification failed',
          data: {
            payment_id: payment.id,
            status: payment.status
          }
        });
      }

    } catch (error) {
      logger.error('Error verifying payment', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get payment status for a project
   * GET /api/payments/project/:projectId
   */
  static async getProjectPayments(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Verify user has access to this project
      const project = await Project.findOne({
        where: { 
          id: projectId,
          [Op.or]: [
            { umkm_id: userId },
            { selected_student_id: userId }
          ]
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      const payments = await Payment.findAll({
        where: { project_id: projectId },
        order: [['created_at', 'ASC']],
        attributes: [
          'id', 'payment_phase', 'amount', 'currency', 'status', 
          'due_date', 'paid_at', 'admin_fee', 'net_amount', 'created_at'
        ]
      });

      const paymentSummary = {
        total_project_value: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        total_paid: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount), 0),
        initial_payment: payments.find(p => p.payment_phase === 'initial'),
        final_payment: payments.find(p => p.payment_phase === 'final'),
        payment_status: {
          initial_completed: payments.some(p => p.payment_phase === 'initial' && p.status === 'completed'),
          final_completed: payments.some(p => p.payment_phase === 'final' && p.status === 'completed'),
          all_completed: payments.every(p => p.status === 'completed')
        }
      };

      res.json({
        success: true,
        data: {
          payments,
          summary: paymentSummary
        }
      });

    } catch (error) {
      logger.error('Error fetching project payments', {
        error: error.message,
        projectId: req.params.projectId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment information',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user's payment history
   * GET /api/payments/history
   */
  static async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, payment_phase } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        [Op.or]: [
          { umkm_id: userId },
          { student_id: userId }
        ]
      };

      if (status) whereClause.status = status;
      if (payment_phase) whereClause.payment_phase = payment_phase;

      const { count, rows: payments } = await Payment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'category'],
            include: [
              {
                model: User,
                as: 'umkm',
                attributes: ['id', 'full_name'],
                include: [{ model: UmkmProfile, as: 'umkmProfile', attributes: ['business_name'] }]
              },
              {
                model: User,
                as: 'selectedStudent', 
                attributes: ['id', 'full_name'],
                include: [{ model: StudentProfile, as: 'studentProfile', attributes: ['university'] }]
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_records: count,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching payment history', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Request refund for a payment
   * POST /api/payments/:paymentId/refund
   */
  static async requestRefund(req, res) {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const payment = await Payment.findOne({
        where: { 
          id: paymentId,
          [Op.or]: [
            { umkm_id: userId },
            { student_id: userId }
          ]
        },
        include: [{ model: Project, as: 'project' }]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found or access denied'
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only refund completed payments'
        });
      }

      // Update payment status to refund requested
      await payment.update({
        status: 'refund_requested',
        notes: reason
      });

      // Create notification for admin
      await Notification.create({
        user_id: null, // Admin notification
        title: 'Refund Request',
        message: `Refund requested for payment ${payment.id} - Reason: ${reason}`,
        type: 'refund_request',
        related_id: payment.id,
        related_type: 'payment'
      });

      logger.info('Refund requested', {
        paymentId: payment.id,
        userId: userId,
        reason: reason
      });

      res.json({
        success: true,
        message: 'Refund request submitted successfully',
        data: {
          payment_id: payment.id,
          status: payment.status,
          refund_reason: reason
        }
      });

    } catch (error) {
      logger.error('Error requesting refund', {
        error: error.message,
        paymentId: req.params.paymentId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to process refund request',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = PaymentController;