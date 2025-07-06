const db = require('../database/models');
const { Chat, User, UmkmProfile, StudentProfile } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { generateConversationId } = require('../socket/socketHandler');

// @desc    Get conversations
// @route   GET /api/chats
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  // Get latest message for each conversation
  const conversations = await db.sequelize.query(`
    SELECT DISTINCT ON (conversation_id) 
      conversation_id,
      sender_id,
      receiver_id,
      message,
      message_type,
      created_at,
      is_read,
      CASE 
        WHEN sender_id = :userId THEN receiver_id 
        ELSE sender_id 
      END as other_user_id
    FROM chats 
    WHERE (sender_id = :userId OR receiver_id = :userId) 
      AND is_deleted = false
    ORDER BY conversation_id, created_at DESC
    LIMIT :limit OFFSET :offset
  `, {
    replacements: { userId, limit: parseInt(limit), offset: parseInt(offset) },
    type: db.sequelize.QueryTypes.SELECT
  });
  
  // Get user details for each conversation
  const conversationsWithUsers = await Promise.all(
    conversations.map(async (conv) => {
      const otherUser = await User.findByPk(conv.other_user_id, {
        attributes: ['id', 'full_name', 'user_type', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type']
          },
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: ['university', 'major']
          }
        ]
      });
      
      // Count unread messages
      const unreadCount = await Chat.count({
        where: {
          conversation_id: conv.conversation_id,
          receiver_id: userId,
          is_read: false,
          is_deleted: false
        }
      });
      
      return {
        conversation_id: conv.conversation_id,
        other_user: otherUser,
        last_message: {
          message: conv.message,
          message_type: conv.message_type,
          created_at: conv.created_at,
          is_read: conv.is_read,
          sender_id: conv.sender_id
        },
        unread_count: unreadCount
      };
    })
  );
  
  res.json({
    success: true,
    data: {
      conversations: conversationsWithUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    }
  });
});

// @desc    Get messages in a conversation
// @route   GET /api/chats/:conversationId/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  // Verify user is part of this conversation
  const conversationCheck = await Chat.findOne({
    where: {
      conversation_id: conversationId,
      [Op.or]: [
        { sender_id: userId },
        { receiver_id: userId }
      ]
    }
  });
  
  if (!conversationCheck) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this conversation'
    });
  }
  
  const { count, rows } = await Chat.findAndCountAll({
    where: {
      conversation_id: conversationId,
      is_deleted: false
    },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'full_name', 'avatar_url']
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'full_name', 'avatar_url']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      messages: rows.reverse(), // Reverse to get chronological order
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Send message
// @route   POST /api/chats/:conversationId/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { message, message_type = 'text', file_url, file_name, file_size, reply_to_id } = req.body;
  const senderId = req.user.id;
  
  // Extract receiver ID from conversation ID
  const [userId1, userId2] = conversationId.split('_');
  const receiverId = userId1 === senderId ? userId2 : userId1;
  
  // Verify receiver exists
  const receiver = await User.findByPk(receiverId);
  if (!receiver) {
    return res.status(404).json({
      success: false,
      message: 'Receiver not found'
    });
  }
  
  // Create message
  const chatMessage = await Chat.create({
    sender_id: senderId,
    receiver_id: receiverId,
    conversation_id: conversationId,
    message,
    message_type,
    file_url,
    file_name,
    file_size,
    reply_to_id
  });
  
  // Get complete message with user info
  const completeMessage = await Chat.findByPk(chatMessage.id, {
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'full_name', 'avatar_url']
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'full_name', 'avatar_url']
      }
    ]
  });
  
  // Emit to socket (handled by socket middleware)
  if (req.io) {
    req.io.to(conversationId).emit('new_message', completeMessage);
  }
  
  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: completeMessage
  });
});

// @desc    Upload chat file
// @route   POST /api/chats/upload
// @access  Private
const uploadChatFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      file_url: req.file.path,
      file_name: req.file.originalname,
      file_size: req.file.size
    }
  });
});

// @desc    Mark message as read
// @route   PATCH /api/chats/messages/:messageId/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  
  const message = await Chat.findOne({
    where: {
      id: messageId,
      receiver_id: userId
    }
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }
  
  if (!message.is_read) {
    await message.update({
      is_read: true,
      read_at: new Date()
    });
    
    // Emit to socket
    if (req.io) {
      req.io.to(`user_${message.sender_id}`).emit('message_read', {
        messageId: messageId,
        readAt: message.read_at
      });
    }
  }
  
  res.json({
    success: true,
    message: 'Message marked as read'
  });
});

// @desc    Delete message
// @route   DELETE /api/chats/messages/:messageId
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  
  const message = await Chat.findOne({
    where: {
      id: messageId,
      sender_id: userId
    }
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found or unauthorized'
    });
  }
  
  await message.update({
    is_deleted: true,
    deleted_at: new Date()
  });
  
  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

// @desc    Create conversation
// @route   POST /api/chats/conversations
// @access  Private
const createConversation = asyncHandler(async (req, res) => {
  const { receiver_id } = req.body;
  const senderId = req.user.id;
  
  if (!receiver_id) {
    return res.status(400).json({
      success: false,
      message: 'Receiver ID is required'
    });
  }
  
  // Check if receiver exists
  const receiver = await User.findByPk(receiver_id);
  if (!receiver) {
    return res.status(404).json({
      success: false,
      message: 'Receiver not found'
    });
  }
  
  const conversationId = generateConversationId(senderId, receiver_id);
  
  res.json({
    success: true,
    message: 'Conversation created successfully',
    data: {
      conversation_id: conversationId,
      receiver: {
        id: receiver.id,
        full_name: receiver.full_name,
        avatar_url: receiver.avatar_url
      }
    }
  });
});

// @desc    Delete conversation
// @route   DELETE /api/chats/conversations/:conversationId
// @access  Private
const deleteConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  
  // Soft delete all messages in conversation for this user
  await Chat.update(
    { is_deleted: true, deleted_at: new Date() },
    {
      where: {
        conversation_id: conversationId,
        [Op.or]: [
          { sender_id: userId },
          { receiver_id: userId }
        ]
      }
    }
  );
  
  res.json({
    success: true,
    message: 'Conversation deleted successfully'
  });
});

// @desc    Search chats
// @route   GET /api/chats/search
// @access  Private
const searchChats = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }
  
  const { count, rows } = await Chat.findAndCountAll({
    where: {
      [Op.or]: [
        { sender_id: userId },
        { receiver_id: userId }
      ],
      message: { [Op.iLike]: `%${q}%` },
      is_deleted: false
    },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'full_name', 'avatar_url']
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'full_name', 'avatar_url']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    success: true,
    data: {
      messages: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  uploadChatFile,
  markAsRead,
  deleteMessage,
  createConversation,
  deleteConversation,
  searchChats
};