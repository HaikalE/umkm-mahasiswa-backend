const { ProjectCheckpoint, Project, User, UmkmProfile, StudentProfile, Notification } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const moment = require('moment');

class CheckpointController {
  /**
   * Create project checkpoints
   * POST /api/checkpoints/create
   */
  static async createCheckpoints(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { projectId, checkpoints } = req.body;
      const umkmId = req.user.id;

      // Validate project ownership
      const project = await Project.findOne({
        where: { id: projectId, umkm_id: umkmId }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or not authorized'
        });
      }

      if (project.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Can only create checkpoints for projects in progress'
        });
      }

      // Validate total weight percentage
      const totalWeight = checkpoints.reduce((sum, cp) => sum + (cp.weight_percentage || 0), 0);
      if (totalWeight !== 100) {
        return res.status(400).json({
          success: false,
          message: 'Total weight percentage must equal 100%'
        });
      }

      // Create checkpoints
      const createdCheckpoints = await Promise.all(
        checkpoints.map(async (checkpoint, index) => {
          const dueDate = moment(project.deadline)
            .subtract((checkpoints.length - index - 1) * 7, 'days') // Distribute across project timeline
            .toDate();

          return await ProjectCheckpoint.create({
            project_id: projectId,
            checkpoint_number: index + 1,
            title: checkpoint.title,
            description: checkpoint.description,
            deliverables: checkpoint.deliverables || [],
            due_date: checkpoint.due_date || dueDate,
            weight_percentage: checkpoint.weight_percentage || Math.floor(100 / checkpoints.length),
            is_mandatory: checkpoint.is_mandatory !== false // Default to true
          });
        })
      );

      // Notify student about new checkpoints
      if (project.selected_student_id) {
        await Notification.create({
          user_id: project.selected_student_id,
          title: 'Project Checkpoints Created',
          message: `${checkpoints.length} checkpoints have been created for project: ${project.title}`,
          type: 'checkpoints_created',
          related_id: projectId,
          related_type: 'project'
        });
      }

      logger.info('Project checkpoints created', {
        projectId: projectId,
        umkmId: umkmId,
        checkpointCount: checkpoints.length
      });

      res.status(201).json({
        success: true,
        message: 'Checkpoints created successfully',
        data: {
          checkpoints: createdCheckpoints.map(cp => ({
            id: cp.id,
            checkpoint_number: cp.checkpoint_number,
            title: cp.title,
            due_date: cp.due_date,
            weight_percentage: cp.weight_percentage,
            status: cp.status
          }))
        }
      });

    } catch (error) {
      logger.error('Error creating checkpoints', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create checkpoints',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get project checkpoints
   * GET /api/checkpoints/project/:projectId
   */
  static async getProjectCheckpoints(req, res) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Verify user has access to project
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

      const checkpoints = await ProjectCheckpoint.findAll({
        where: { project_id: projectId },
        order: [['checkpoint_number', 'ASC']],
        attributes: [
          'id', 'checkpoint_number', 'title', 'description', 'deliverables',
          'due_date', 'completion_percentage', 'status', 'student_submission',
          'submission_files', 'submitted_at', 'umkm_feedback', 'umkm_rating',
          'reviewed_at', 'approved_at', 'is_mandatory', 'weight_percentage',
          'created_at', 'updated_at'
        ]
      });

      // Calculate overall project progress
      const totalWeight = checkpoints.reduce((sum, cp) => sum + cp.weight_percentage, 0);
      const weightedProgress = checkpoints.reduce((sum, cp) => {
        const progress = cp.status === 'completed' ? 100 : cp.completion_percentage;
        return sum + (progress * cp.weight_percentage / 100);
      }, 0);
      const overallProgress = totalWeight > 0 ? (weightedProgress / totalWeight * 100) : 0;

      // Get checkpoint statistics
      const stats = {
        total_checkpoints: checkpoints.length,
        completed: checkpoints.filter(cp => cp.status === 'completed').length,
        in_progress: checkpoints.filter(cp => cp.status === 'in_progress').length,
        pending: checkpoints.filter(cp => cp.status === 'pending').length,
        overdue: checkpoints.filter(cp => 
          ['pending', 'in_progress'].includes(cp.status) && 
          moment(cp.due_date).isBefore(moment())
        ).length,
        overall_progress: Math.round(overallProgress),
        average_rating: checkpoints.filter(cp => cp.umkm_rating).length > 0 
          ? checkpoints.reduce((sum, cp) => sum + (cp.umkm_rating || 0), 0) / 
            checkpoints.filter(cp => cp.umkm_rating).length 
          : null
      };

      res.json({
        success: true,
        data: {
          checkpoints,
          statistics: stats,
          project_info: {
            id: project.id,
            title: project.title,
            deadline: project.deadline,
            status: project.status
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching project checkpoints', {
        error: error.message,
        projectId: req.params.projectId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch checkpoints',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Submit checkpoint by student
   * POST /api/checkpoints/:checkpointId/submit
   */
  static async submitCheckpoint(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { checkpointId } = req.params;
      const { submission, submissionFiles, completionPercentage = 100 } = req.body;
      const studentId = req.user.id;

      const checkpoint = await ProjectCheckpoint.findOne({
        where: { id: checkpointId },
        include: [
          {
            model: Project,
            as: 'project',
            where: { selected_student_id: studentId },
            include: [
              { model: User, as: 'umkm', attributes: ['id', 'full_name'] }
            ]
          }
        ]
      });

      if (!checkpoint) {
        return res.status(404).json({
          success: false,
          message: 'Checkpoint not found or not authorized'
        });
      }

      if (checkpoint.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Checkpoint already completed'
        });
      }

      // Update checkpoint with submission
      await checkpoint.update({
        student_submission: submission,
        submission_files: submissionFiles || [],
        completion_percentage: Math.min(completionPercentage, 100),
        status: 'submitted',
        submitted_at: new Date()
      });

      // Create notification for UMKM
      await Notification.create({
        user_id: checkpoint.project.umkm_id,
        title: 'Checkpoint Submitted',
        message: `Student has submitted checkpoint: ${checkpoint.title} for project: ${checkpoint.project.title}`,
        type: 'checkpoint_submission',
        related_id: checkpoint.id,
        related_type: 'checkpoint'
      });

      logger.info('Checkpoint submitted', {
        checkpointId: checkpoint.id,
        studentId: studentId,
        projectId: checkpoint.project_id,
        completionPercentage: completionPercentage
      });

      res.json({
        success: true,
        message: 'Checkpoint submitted successfully',
        data: {
          checkpoint: {
            id: checkpoint.id,
            title: checkpoint.title,
            status: checkpoint.status,
            completion_percentage: checkpoint.completion_percentage,
            submitted_at: checkpoint.submitted_at
          }
        }
      });

    } catch (error) {
      logger.error('Error submitting checkpoint', {
        error: error.message,
        checkpointId: req.params.checkpointId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to submit checkpoint',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Review and approve/reject checkpoint by UMKM
   * POST /api/checkpoints/:checkpointId/review
   */
  static async reviewCheckpoint(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { checkpointId } = req.params;
      const { action, feedback, rating } = req.body; // action: 'approve' or 'reject'
      const umkmId = req.user.id;

      const checkpoint = await ProjectCheckpoint.findOne({
        where: { id: checkpointId },
        include: [
          {
            model: Project,
            as: 'project',
            where: { umkm_id: umkmId },
            include: [
              { model: User, as: 'selectedStudent', attributes: ['id', 'full_name'] }
            ]
          }
        ]
      });

      if (!checkpoint) {
        return res.status(404).json({
          success: false,
          message: 'Checkpoint not found or not authorized'
        });
      }

      if (checkpoint.status !== 'submitted') {
        return res.status(400).json({
          success: false,
          message: 'Can only review submitted checkpoints'
        });
      }

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const updateData = {
        umkm_feedback: feedback,
        umkm_rating: rating,
        reviewed_at: new Date()
      };

      if (action === 'approve') {
        updateData.status = 'completed';
        updateData.approved_at = new Date();
        updateData.completion_percentage = 100;
      } else if (action === 'reject') {
        updateData.status = 'rejected';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Action must be either "approve" or "reject"'
        });
      }

      await checkpoint.update(updateData);

      // Create notification for student
      const notificationMessage = action === 'approve' 
        ? `Your checkpoint "${checkpoint.title}" has been approved!`
        : `Your checkpoint "${checkpoint.title}" needs revision. Please check the feedback.`;

      await Notification.create({
        user_id: checkpoint.project.selected_student_id,
        title: `Checkpoint ${action === 'approve' ? 'Approved' : 'Needs Revision'}`,
        message: notificationMessage,
        type: `checkpoint_${action}d`,
        related_id: checkpoint.id,
        related_type: 'checkpoint'
      });

      // If approved, check if all checkpoints are completed
      if (action === 'approve') {
        const allCheckpoints = await ProjectCheckpoint.findAll({
          where: { project_id: checkpoint.project_id }
        });

        const allCompleted = allCheckpoints.every(cp => cp.status === 'completed');
        
        if (allCompleted) {
          // All checkpoints completed, update project status
          await checkpoint.project.update({ status: 'ready_for_final_payment' });
          
          // Notify UMKM that project is ready for final payment
          await Notification.create({
            user_id: umkmId,
            title: 'Project Ready for Final Payment',
            message: `All checkpoints completed for project: ${checkpoint.project.title}. Ready for final payment.`,
            type: 'project_ready_final_payment',
            related_id: checkpoint.project_id,
            related_type: 'project'
          });
        }
      }

      logger.info('Checkpoint reviewed', {
        checkpointId: checkpoint.id,
        umkmId: umkmId,
        action: action,
        rating: rating
      });

      res.json({
        success: true,
        message: `Checkpoint ${action}d successfully`,
        data: {
          checkpoint: {
            id: checkpoint.id,
            title: checkpoint.title,
            status: checkpoint.status,
            umkm_rating: checkpoint.umkm_rating,
            reviewed_at: checkpoint.reviewed_at,
            approved_at: checkpoint.approved_at
          }
        }
      });

    } catch (error) {
      logger.error('Error reviewing checkpoint', {
        error: error.message,
        checkpointId: req.params.checkpointId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to review checkpoint',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update checkpoint details (UMKM only)
   * PUT /api/checkpoints/:checkpointId
   */
  static async updateCheckpoint(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { checkpointId } = req.params;
      const { title, description, deliverables, due_date, weight_percentage, is_mandatory } = req.body;
      const umkmId = req.user.id;

      const checkpoint = await ProjectCheckpoint.findOne({
        where: { id: checkpointId },
        include: [
          {
            model: Project,
            as: 'project',
            where: { umkm_id: umkmId }
          }
        ]
      });

      if (!checkpoint) {
        return res.status(404).json({
          success: false,
          message: 'Checkpoint not found or not authorized'
        });
      }

      if (checkpoint.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update completed checkpoint'
        });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (deliverables) updateData.deliverables = deliverables;
      if (due_date) updateData.due_date = due_date;
      if (weight_percentage) updateData.weight_percentage = weight_percentage;
      if (is_mandatory !== undefined) updateData.is_mandatory = is_mandatory;

      await checkpoint.update(updateData);

      // Notify student about checkpoint update
      if (checkpoint.project.selected_student_id) {
        await Notification.create({
          user_id: checkpoint.project.selected_student_id,
          title: 'Checkpoint Updated',
          message: `Checkpoint "${checkpoint.title}" has been updated. Please review the changes.`,
          type: 'checkpoint_updated',
          related_id: checkpoint.id,
          related_type: 'checkpoint'
        });
      }

      logger.info('Checkpoint updated', {
        checkpointId: checkpoint.id,
        umkmId: umkmId,
        updates: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Checkpoint updated successfully',
        data: {
          checkpoint: {
            id: checkpoint.id,
            title: checkpoint.title,
            description: checkpoint.description,
            due_date: checkpoint.due_date,
            weight_percentage: checkpoint.weight_percentage,
            status: checkpoint.status
          }
        }
      });

    } catch (error) {
      logger.error('Error updating checkpoint', {
        error: error.message,
        checkpointId: req.params.checkpointId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update checkpoint',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get checkpoint dashboard analytics
   * GET /api/checkpoints/dashboard
   */
  static async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.user_type;

      let whereClause = {};
      if (userType === 'umkm') {
        whereClause = { '$project.umkm_id$': userId };
      } else {
        whereClause = { '$project.selected_student_id$': userId };
      }

      const checkpoints = await ProjectCheckpoint.findAll({
        where: whereClause,
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'status', 'deadline']
          }
        ],
        order: [['due_date', 'ASC']]
      });

      const now = moment();
      const analytics = {
        total_checkpoints: checkpoints.length,
        completed: checkpoints.filter(cp => cp.status === 'completed').length,
        in_progress: checkpoints.filter(cp => cp.status === 'in_progress').length,
        pending: checkpoints.filter(cp => cp.status === 'pending').length,
        submitted: checkpoints.filter(cp => cp.status === 'submitted').length,
        overdue: checkpoints.filter(cp => 
          ['pending', 'in_progress'].includes(cp.status) && 
          moment(cp.due_date).isBefore(now)
        ).length,
        upcoming_deadlines: checkpoints.filter(cp => 
          ['pending', 'in_progress'].includes(cp.status) && 
          moment(cp.due_date).isBetween(now, now.clone().add(7, 'days'))
        ).length,
        average_completion_time: null, // Calculate if needed
        performance_rating: checkpoints.filter(cp => cp.umkm_rating).length > 0
          ? checkpoints.reduce((sum, cp) => sum + (cp.umkm_rating || 0), 0) / 
            checkpoints.filter(cp => cp.umkm_rating).length 
          : null
      };

      // Get recent activity
      const recentActivity = checkpoints
        .filter(cp => cp.updated_at && moment(cp.updated_at).isAfter(moment().subtract(7, 'days')))
        .slice(0, 10)
        .map(cp => ({
          checkpoint_id: cp.id,
          title: cp.title,
          project_title: cp.project.title,
          status: cp.status,
          updated_at: cp.updated_at
        }));

      res.json({
        success: true,
        data: {
          analytics,
          recent_activity: recentActivity,
          user_type: userType
        }
      });

    } catch (error) {
      logger.error('Error fetching checkpoint dashboard', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = CheckpointController;