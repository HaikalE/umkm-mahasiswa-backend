const db = require('../database/models');
const { Notification, User } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');

// @desc    Get notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, is_read } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  const whereClause = {
    user_id: userId,
    [Op.or]: [
      { expires_at: null },
      { expires_at: { [Op.gt]: new Date() } }
    ]
  };
  
  if (type) {
    whereClause.type = type;
  }
  
  if (is_read !== undefined) {
    whereClause.is_read = is_read === 'true';
  }
  
  const { count, rows } = await Notification.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      notifications: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const count = await Notification.count({
    where: {
      user_id: userId,
      is_read: false,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    }
  });
  
  res.json({
    success: true,
    data: { unread_count: count }
  });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const notification = await Notification.findOne({
    where: { id, user_id: userId }
  });
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  if (!notification.is_read) {
    await notification.update({
      is_read: true,
      read_at: new Date()
    });
  }
  
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  await Notification.update(
    {
      is_read: true,
      read_at: new Date()
    },
    {
      where: {
        user_id: userId,
        is_read: false
      }
    }
  );
  
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  const notification = await Notification.findOne({
    where: { id, user_id: userId }
  });
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  await notification.destroy();
  
  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
const clearAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  await Notification.destroy({
    where: { user_id: userId }
  });
  
  res.json({
    success: true,
    message: 'All notifications cleared successfully'
  });
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res) => {
  // TODO: Implement notification preferences
  res.json({
    success: true,
    message: 'Notification preferences will be implemented soon',
    data: {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      notification_types: {
        new_message: true,
        new_application: true,
        application_update: true,
        project_update: true,
        review_received: true,
        system_announcement: true
      }
    }
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  // TODO: Implement notification preferences update
  res.json({
    success: true,
    message: 'Notification preferences updated successfully'
  });
});

// @desc    Update push notification token
// @route   POST /api/notifications/push-token
// @access  Private
const updatePushToken = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Push token is required'
    });
  }
  
  // TODO: Store push token for user
  // This would typically be stored in a separate table or user field
  
  res.json({
    success: true,
    message: 'Push token updated successfully'
  });
});

// Helper function to create notification
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // TODO: Send push notification if user has enabled it
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to send push notification
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // TODO: Implement Firebase FCM push notification
    console.log(`Sending push notification to user ${userId}: ${title}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  updatePreferences,
  updatePushToken,
  createNotification,
  sendPushNotification
};