module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('notifications', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'new_message', 'new_application', 'application_update', 
        'project_update', 'product_update', 'review_received',
        'payment_received', 'system_announcement', 'reminder'
      ),
      allowNull: false
    },
    related_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of related entity (project, product, etc.)'
    },
    related_type: {
      type: DataTypes.ENUM(
        'project', 'product', 'application', 'chat', 'review', 'user'
      ),
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data for the notification'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    action_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Deep link or URL for notification action'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_push_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    push_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['related_id', 'related_type']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['priority']
      }
    ]
  });

  return Notification;
};