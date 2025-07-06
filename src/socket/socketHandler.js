const jwt = require('jsonwebtoken');
const db = require('../database/models');
const { User, Chat } = db;

// Store connected users
const connectedUsers = new Map();

// Helper function to generate conversation ID
const generateConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

const socketHandler = (io, socket) => {
  console.log(`User connected: ${socket.id}`);

  // Authentication middleware for socket
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      
      if (!token) {
        socket.emit('auth_error', { message: 'Authentication token required' });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'full_name', 'user_type', 'avatar_url']
      });

      if (!user) {
        socket.emit('auth_error', { message: 'User not found' });
        return;
      }

      // Store user info in socket
      socket.userId = user.id;
      socket.userInfo = user;
      
      // Store in connected users map
      connectedUsers.set(user.id, {
        socketId: socket.id,
        user: user,
        lastSeen: new Date()
      });

      // Join user to their personal room
      socket.join(`user_${user.id}`);
      
      // Emit authentication success
      socket.emit('authenticated', {
        user: user,
        message: 'Authentication successful'
      });

      // Broadcast user online status to relevant users
      socket.broadcast.emit('user_online', {
        userId: user.id,
        user: user
      });

      console.log(`User authenticated: ${user.full_name} (${user.id})`);
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth_error', { message: 'Invalid token' });
    }
  });

  // Join conversation room
  socket.on('join_conversation', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { receiverId } = data;
      
      if (!receiverId) {
        socket.emit('error', { message: 'Receiver ID required' });
        return;
      }

      const conversationId = generateConversationId(socket.userId, receiverId);
      socket.join(conversationId);
      
      // Get recent messages for this conversation
      const messages = await Chat.findAll({
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
        order: [['created_at', 'DESC']],
        limit: 50
      });

      socket.emit('conversation_joined', {
        conversationId,
        messages: messages.reverse()
      });

      console.log(`User ${socket.userId} joined conversation: ${conversationId}`);
    } catch (error) {
      console.error('Join conversation error:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { 
        receiverId, 
        message, 
        messageType = 'text', 
        fileUrl = null, 
        fileName = null,
        fileSize = null,
        replyToId = null
      } = data;

      if (!receiverId) {
        socket.emit('error', { message: 'Receiver ID required' });
        return;
      }

      if (!message && !fileUrl) {
        socket.emit('error', { message: 'Message content or file required' });
        return;
      }

      // Check if receiver exists
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        socket.emit('error', { message: 'Receiver not found' });
        return;
      }

      const conversationId = generateConversationId(socket.userId, receiverId);

      // Create chat message
      const chatMessage = await Chat.create({
        sender_id: socket.userId,
        receiver_id: receiverId,
        conversation_id: conversationId,
        message: message,
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        reply_to_id: replyToId
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

      // Emit to conversation room
      io.to(conversationId).emit('new_message', completeMessage);

      // Send push notification to receiver if they're offline
      const receiverSocket = connectedUsers.get(receiverId);
      if (!receiverSocket) {
        // TODO: Send push notification
        console.log(`User ${receiverId} is offline, should send push notification`);
      }

      console.log(`Message sent from ${socket.userId} to ${receiverId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('mark_as_read', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { messageId } = data;
      
      if (!messageId) {
        socket.emit('error', { message: 'Message ID required' });
        return;
      }

      // Update message as read
      const message = await Chat.findOne({
        where: {
          id: messageId,
          receiver_id: socket.userId
        }
      });

      if (message && !message.is_read) {
        await message.update({
          is_read: true,
          read_at: new Date()
        });

        // Notify sender that message was read
        const senderSocket = connectedUsers.get(message.sender_id);
        if (senderSocket) {
          io.to(senderSocket.socketId).emit('message_read', {
            messageId: messageId,
            readAt: message.read_at
          });
        }
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  // User typing indicator
  socket.on('typing_start', (data) => {
    if (!socket.userId) return;
    
    const { receiverId } = data;
    if (!receiverId) return;

    const conversationId = generateConversationId(socket.userId, receiverId);
    socket.to(conversationId).emit('user_typing', {
      userId: socket.userId,
      user: socket.userInfo
    });
  });

  socket.on('typing_stop', (data) => {
    if (!socket.userId) return;
    
    const { receiverId } = data;
    if (!receiverId) return;

    const conversationId = generateConversationId(socket.userId, receiverId);
    socket.to(conversationId).emit('user_stopped_typing', {
      userId: socket.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        lastSeen: new Date()
      });
      
      console.log(`User disconnected: ${socket.userId}`);
    }
    
    console.log(`Socket disconnected: ${socket.id}`);
  });

  // Get online users
  socket.on('get_online_users', () => {
    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const onlineUsers = Array.from(connectedUsers.values()).map(({ user, lastSeen }) => ({
      user,
      lastSeen
    }));

    socket.emit('online_users', onlineUsers);
  });
};

module.exports = socketHandler;

// Export connected users for use in other parts of the app
module.exports.connectedUsers = connectedUsers;
module.exports.generateConversationId = generateConversationId;