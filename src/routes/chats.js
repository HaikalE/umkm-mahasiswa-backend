const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateJWT } = require('../middleware/auth');
const { validateChatMessage, validatePagination, validateUUID } = require('../middleware/validation');
const { chatUpload } = require('../config/cloudinary');

// Protected routes (require authentication)
router.use(authenticateJWT);

// Chat management
router.get('/', validatePagination, chatController.getConversations);
router.get('/:conversationId/messages', validatePagination, chatController.getMessages);
router.post('/:conversationId/messages', validateChatMessage, chatController.sendMessage);

// File upload for chat
router.post('/upload', chatUpload.single('file'), chatController.uploadChatFile);

// Message management
router.patch('/messages/:messageId/read', validateUUID('messageId'), chatController.markAsRead);
router.delete('/messages/:messageId', validateUUID('messageId'), chatController.deleteMessage);

// Conversation management
router.post('/conversations', chatController.createConversation);
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Search conversations and messages
router.get('/search', validatePagination, chatController.searchChats);

module.exports = router;