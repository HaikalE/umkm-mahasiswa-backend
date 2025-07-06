module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('applications', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    cover_letter: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    proposed_budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    proposed_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Proposed duration in days'
    },
    portfolio_links: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of relevant portfolio links'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of attachment file URLs'
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'),
      defaultValue: 'pending'
    },
    umkm_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes from UMKM about the application'
    },
    student_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes from student'
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['project_id', 'student_id'],
        name: 'unique_project_student_application'
      }
    ]
  });

  return Application;
};