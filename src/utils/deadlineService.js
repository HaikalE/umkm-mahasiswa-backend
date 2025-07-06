const cron = require('node-cron');
const { Project, ProjectCheckpoint, Payment, User, Notification } = require('../database/models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const moment = require('moment');

class DeadlineService {
  /**
   * Initialize all cron jobs for deadline enforcement
   */
  static initializeCronJobs() {
    logger.info('Initializing deadline enforcement cron jobs');

    // Check project deadlines every hour
    cron.schedule('0 * * * *', () => {
      DeadlineService.checkProjectDeadlines();
    });

    // Check checkpoint deadlines every 2 hours
    cron.schedule('0 */2 * * *', () => {
      DeadlineService.checkCheckpointDeadlines();
    });

    // Check payment deadlines every 6 hours
    cron.schedule('0 */6 * * *', () => {
      DeadlineService.checkPaymentDeadlines();
    });

    // Send deadline reminders daily at 9 AM
    cron.schedule('0 9 * * *', () => {
      DeadlineService.sendDeadlineReminders();
    });

    // Cleanup expired projects weekly on Sunday at 2 AM
    cron.schedule('0 2 * * 0', () => {
      DeadlineService.cleanupExpiredProjects();
    });

    logger.info('All deadline enforcement cron jobs initialized successfully');
  }

  /**
   * Check and handle overdue projects
   */
  static async checkProjectDeadlines() {
    try {
      const now = new Date();
      
      // Find projects that are past deadline
      const overdueProjects = await Project.findAll({
        where: {
          deadline: { [Op.lt]: now },
          status: { [Op.in]: ['open', 'in_progress'] }
        },
        include: [
          {
            model: User,
            as: 'umkm',
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: User,
            as: 'selectedStudent',
            attributes: ['id', 'full_name', 'email']
          }
        ]
      });

      logger.info(`Found ${overdueProjects.length} overdue projects`);

      for (const project of overdueProjects) {
        await DeadlineService.handleOverdueProject(project);
      }

    } catch (error) {
      logger.error('Error checking project deadlines', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle a single overdue project
   */
  static async handleOverdueProject(project) {
    try {
      const daysPastDeadline = moment().diff(moment(project.deadline), 'days');
      
      if (daysPastDeadline >= 7) {
        // Auto-cancel projects 7 days past deadline
        await project.update({
          status: 'cancelled',
          notes: `Auto-cancelled: ${daysPastDeadline} days past deadline`
        });

        // Notify participants
        const notifications = [];
        
        if (project.umkm) {
          notifications.push({
            user_id: project.umkm.id,
            title: 'Project Auto-Cancelled',
            message: `Project "${project.title}" has been automatically cancelled due to deadline expiry`,
            type: 'project_cancelled',
            related_id: project.id,
            related_type: 'project'
          });
        }

        if (project.selectedStudent) {
          notifications.push({
            user_id: project.selectedStudent.id,
            title: 'Project Auto-Cancelled',
            message: `Project "${project.title}" has been automatically cancelled due to deadline expiry`,
            type: 'project_cancelled',
            related_id: project.id,
            related_type: 'project'
          });
        }

        await Notification.bulkCreate(notifications);

        logger.info('Project auto-cancelled due to deadline', {
          projectId: project.id,
          daysPastDeadline: daysPastDeadline
        });
      } else {
        // Just update status to overdue
        if (project.status !== 'overdue') {
          await project.update({ status: 'overdue' });
          
          // Send overdue notifications
          await DeadlineService.sendOverdueNotifications(project, daysPastDeadline);
        }
      }

    } catch (error) {
      logger.error('Error handling overdue project', {
        projectId: project.id,
        error: error.message
      });
    }
  }

  /**
   * Check checkpoint deadlines
   */
  static async checkCheckpointDeadlines() {
    try {
      const now = new Date();
      
      const overdueCheckpoints = await ProjectCheckpoint.findAll({
        where: {
          due_date: { [Op.lt]: now },
          status: { [Op.in]: ['pending', 'in_progress'] }
        },
        include: [
          {
            model: Project,
            as: 'project',
            include: [
              { model: User, as: 'umkm', attributes: ['id', 'full_name'] },
              { model: User, as: 'selectedStudent', attributes: ['id', 'full_name'] }
            ]
          }
        ]
      });

      logger.info(`Found ${overdueCheckpoints.length} overdue checkpoints`);

      for (const checkpoint of overdueCheckpoints) {
        await DeadlineService.handleOverdueCheckpoint(checkpoint);
      }

    } catch (error) {
      logger.error('Error checking checkpoint deadlines', {
        error: error.message
      });
    }
  }

  /**
   * Handle overdue checkpoint
   */
  static async handleOverdueCheckpoint(checkpoint) {
    try {
      const daysPastDeadline = moment().diff(moment(checkpoint.due_date), 'days');
      
      // Update checkpoint status
      await checkpoint.update({ 
        status: 'overdue',
        notes: `Overdue by ${daysPastDeadline} days`
      });

      // Notify UMKM and student
      const notifications = [];

      if (checkpoint.project.umkm) {
        notifications.push({
          user_id: checkpoint.project.umkm.id,
          title: 'Checkpoint Overdue',
          message: `Checkpoint "${checkpoint.title}" is ${daysPastDeadline} days overdue`,
          type: 'checkpoint_overdue',
          related_id: checkpoint.id,
          related_type: 'checkpoint',
          priority: 'high'
        });
      }

      if (checkpoint.project.selectedStudent) {
        notifications.push({
          user_id: checkpoint.project.selectedStudent.id,
          title: 'Checkpoint Overdue',
          message: `You have an overdue checkpoint: "${checkpoint.title}" (${daysPastDeadline} days late)`,
          type: 'checkpoint_overdue',
          related_id: checkpoint.id,
          related_type: 'checkpoint',
          priority: 'high'
        });
      }

      await Notification.bulkCreate(notifications);

      logger.info('Checkpoint marked as overdue', {
        checkpointId: checkpoint.id,
        daysPastDeadline: daysPastDeadline
      });

    } catch (error) {
      logger.error('Error handling overdue checkpoint', {
        checkpointId: checkpoint.id,
        error: error.message
      });
    }
  }

  /**
   * Check payment deadlines
   */
  static async checkPaymentDeadlines() {
    try {
      const now = new Date();
      
      const overduePayments = await Payment.findAll({
        where: {
          due_date: { [Op.lt]: now },
          status: 'pending'
        },
        include: [
          {
            model: Project,
            as: 'project',
            include: [
              { model: User, as: 'umkm', attributes: ['id', 'full_name'] },
              { model: User, as: 'selectedStudent', attributes: ['id', 'full_name'] }
            ]
          }
        ]
      });

      logger.info(`Found ${overduePayments.length} overdue payments`);

      for (const payment of overduePayments) {
        await DeadlineService.handleOverduePayment(payment);
      }

    } catch (error) {
      logger.error('Error checking payment deadlines', {
        error: error.message
      });
    }
  }

  /**
   * Handle overdue payment
   */
  static async handleOverduePayment(payment) {
    try {
      const daysPastDeadline = moment().diff(moment(payment.due_date), 'days');
      
      if (daysPastDeadline >= 3) {
        // Cancel payment after 3 days
        await payment.update({
          status: 'cancelled',
          notes: `Auto-cancelled: ${daysPastDeadline} days past due date`
        });

        // If it's initial payment, cancel the project
        if (payment.payment_phase === 'initial') {
          await payment.project.update({ status: 'cancelled' });
        }
      } else {
        // Send reminder notifications
        await Notification.create({
          user_id: payment.umkm_id,
          title: 'Payment Overdue',
          message: `Payment for project "${payment.project.title}" is ${daysPastDeadline} days overdue`,
          type: 'payment_overdue',
          related_id: payment.id,
          related_type: 'payment',
          priority: 'urgent'
        });
      }

      logger.info('Overdue payment handled', {
        paymentId: payment.id,
        daysPastDeadline: daysPastDeadline
      });

    } catch (error) {
      logger.error('Error handling overdue payment', {
        paymentId: payment.id,
        error: error.message
      });
    }
  }

  /**
   * Send deadline reminders for upcoming deadlines
   */
  static async sendDeadlineReminders() {
    try {
      const reminderDays = [1, 3, 7]; // Send reminders 1, 3, and 7 days before deadline
      
      for (const days of reminderDays) {
        await DeadlineService.sendProjectDeadlineReminders(days);
        await DeadlineService.sendCheckpointDeadlineReminders(days);
        await DeadlineService.sendPaymentDeadlineReminders(days);
      }

    } catch (error) {
      logger.error('Error sending deadline reminders', {
        error: error.message
      });
    }
  }

  /**
   * Send project deadline reminders
   */
  static async sendProjectDeadlineReminders(days) {
    const reminderDate = moment().add(days, 'days').startOf('day');
    const endOfDay = moment(reminderDate).endOf('day');

    const upcomingProjects = await Project.findAll({
      where: {
        deadline: {
          [Op.between]: [reminderDate.toDate(), endOfDay.toDate()]
        },
        status: { [Op.in]: ['open', 'in_progress'] }
      },
      include: [
        { model: User, as: 'umkm', attributes: ['id'] },
        { model: User, as: 'selectedStudent', attributes: ['id'] }
      ]
    });

    for (const project of upcomingProjects) {
      const notifications = [];

      if (project.umkm) {
        notifications.push({
          user_id: project.umkm.id,
          title: `Project Deadline Reminder - ${days} day(s)`,
          message: `Project "${project.title}" deadline is in ${days} day(s)`,
          type: 'deadline_reminder',
          related_id: project.id,
          related_type: 'project'
        });
      }

      if (project.selectedStudent) {
        notifications.push({
          user_id: project.selectedStudent.id,
          title: `Project Deadline Reminder - ${days} day(s)`,
          message: `Project "${project.title}" deadline is in ${days} day(s)`,
          type: 'deadline_reminder',
          related_id: project.id,
          related_type: 'project'
        });
      }

      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
    }
  }

  /**
   * Send checkpoint deadline reminders
   */
  static async sendCheckpointDeadlineReminders(days) {
    const reminderDate = moment().add(days, 'days').startOf('day');
    const endOfDay = moment(reminderDate).endOf('day');

    const upcomingCheckpoints = await ProjectCheckpoint.findAll({
      where: {
        due_date: {
          [Op.between]: [reminderDate.toDate(), endOfDay.toDate()]
        },
        status: { [Op.in]: ['pending', 'in_progress'] }
      },
      include: [
        {
          model: Project,
          as: 'project',
          include: [
            { model: User, as: 'umkm', attributes: ['id'] },
            { model: User, as: 'selectedStudent', attributes: ['id'] }
          ]
        }
      ]
    });

    for (const checkpoint of upcomingCheckpoints) {
      const notifications = [];

      if (checkpoint.project.selectedStudent) {
        notifications.push({
          user_id: checkpoint.project.selectedStudent.id,
          title: `Checkpoint Deadline Reminder - ${days} day(s)`,
          message: `Checkpoint "${checkpoint.title}" is due in ${days} day(s)`,
          type: 'deadline_reminder',
          related_id: checkpoint.id,
          related_type: 'checkpoint'
        });
      }

      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
    }
  }

  /**
   * Send payment deadline reminders
   */
  static async sendPaymentDeadlineReminders(days) {
    const reminderDate = moment().add(days, 'days').startOf('day');
    const endOfDay = moment(reminderDate).endOf('day');

    const upcomingPayments = await Payment.findAll({
      where: {
        due_date: {
          [Op.between]: [reminderDate.toDate(), endOfDay.toDate()]
        },
        status: 'pending'
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['title']
        }
      ]
    });

    for (const payment of upcomingPayments) {
      await Notification.create({
        user_id: payment.umkm_id,
        title: `Payment Deadline Reminder - ${days} day(s)`,
        message: `Payment for project "${payment.project.title}" is due in ${days} day(s)`,
        type: 'deadline_reminder',
        related_id: payment.id,
        related_type: 'payment'
      });
    }
  }

  /**
   * Send overdue notifications
   */
  static async sendOverdueNotifications(project, daysPastDeadline) {
    const notifications = [];

    if (project.umkm) {
      notifications.push({
        user_id: project.umkm.id,
        title: 'Project Overdue',
        message: `Project "${project.title}" is ${daysPastDeadline} days past deadline`,
        type: 'project_overdue',
        related_id: project.id,
        related_type: 'project',
        priority: 'high'
      });
    }

    if (project.selectedStudent) {
      notifications.push({
        user_id: project.selectedStudent.id,
        title: 'Project Overdue',
        message: `Project "${project.title}" is ${daysPastDeadline} days past deadline`,
        type: 'project_overdue',
        related_id: project.id,
        related_type: 'project',
        priority: 'high'
      });
    }

    await Notification.bulkCreate(notifications);
  }

  /**
   * Cleanup expired projects and related data
   */
  static async cleanupExpiredProjects() {
    try {
      const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
      
      // Find projects that have been cancelled/completed for more than 30 days
      const expiredProjects = await Project.findAll({
        where: {
          status: { [Op.in]: ['cancelled', 'completed'] },
          updated_at: { [Op.lt]: thirtyDaysAgo }
        }
      });

      logger.info(`Found ${expiredProjects.length} expired projects for cleanup`);

      // Archive or cleanup logic would go here
      // For now, just log the count

    } catch (error) {
      logger.error('Error during cleanup', {
        error: error.message
      });
    }
  }

  /**
   * Manual trigger for testing deadline checks
   */
  static async triggerDeadlineCheck() {
    logger.info('Manually triggering deadline checks');
    
    await Promise.all([
      DeadlineService.checkProjectDeadlines(),
      DeadlineService.checkCheckpointDeadlines(),
      DeadlineService.checkPaymentDeadlines()
    ]);
    
    logger.info('Manual deadline check completed');
  }
}

module.exports = DeadlineService;