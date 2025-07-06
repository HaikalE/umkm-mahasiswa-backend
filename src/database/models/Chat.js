module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define('chats', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    conversation_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Generated ID for conversation between two users'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'audio', 'video', 'location'),
      defaultValue: 'text'
    },
    file_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL for file/image/media messages'
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reply_to_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'chats',
        key: 'id'
      },
      comment: 'ID of message being replied to'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata like location coordinates, etc.'
    }
  }, {
    indexes: [
      {
        fields: ['sender_id']
      },
      {
        fields: ['receiver_id']
      },
      {
        fields: ['conversation_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['is_deleted']
      },
      {
        fields: ['conversation_id', 'created_at']
      }
    ]
  });

  return Chat;
};