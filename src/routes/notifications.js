const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/auth');
const { validatePagination, validateUUID } = require('../middleware/validation');

// Protected routes (require authentication)
router.use(authenticateJWT);

// Notification management
router.get('/', validatePagination, notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', validateUUID('id'), notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:id', validateUUID('id'), notificationController.deleteNotification);
router.delete('/clear-all', notificationController.clearAllNotifications);

// Notification preferences
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

// Push notification token management
router.post('/push-token', notificationController.updatePushToken);

module.exports = router;