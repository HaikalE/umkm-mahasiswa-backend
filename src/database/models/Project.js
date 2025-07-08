module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('projects', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    umkm_id: {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'web_development', 'mobile_development', 'ui_ux_design', 
        'graphic_design', 'digital_marketing', 'content_writing',
        'data_analysis', 'video_editing', 'photography', 'consulting', 'lainnya'
      ),
      allowNull: false
    },
    budget_min: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    budget_max: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'IDR'
    },
    payment_type: {
      type: DataTypes.ENUM('fixed', 'hourly', 'negotiable'),
      defaultValue: 'fixed'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in days'
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    required_skills: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of required skills'
    },
    experience_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      defaultValue: 'beginner'
    },
    location_type: {
      type: DataTypes.ENUM('remote', 'onsite', 'hybrid'),
      defaultValue: 'remote'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of attachment file URLs'
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'completion_requested', 'completed', 'cancelled', 'closed'),
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    max_applicants: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: 1,
        max: 100
      }
    },
    total_applicants: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    selected_student_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of tags for search'
    },
    // ENHANCED: Active Project Management Fields
    deliverables: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of project deliverables uploaded by student'
    },
    completion_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Student notes when requesting completion'
    },
    umkm_completion_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'UMKM notes when approving completion'
    },
    completion_requested_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When student requested project completion'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When project was marked as completed'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When project actually started (when student was selected)'
    },
    estimated_completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Estimated completion date based on duration'
    },
    actual_budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Final agreed budget from accepted application'
    },
    progress_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Overall project progress percentage'
    }
  }, {
    indexes: [
      {
        fields: ['umkm_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['experience_level']
      },
      {
        fields: ['location_type']
      },
      {
        fields: ['budget_min', 'budget_max']
      },
      {
        fields: ['deadline']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_featured']
      },
      // ENHANCED: New indexes for active project management
      {
        fields: ['selected_student_id']
      },
      {
        fields: ['started_at']
      },
      {
        fields: ['completed_at']
      },
      {
        fields: ['status', 'selected_student_id']
      }
    ],
    hooks: {
      // Auto-calculate estimated completion date when project starts
      beforeUpdate: (project, options) => {
        if (project.changed('selected_student_id') && project.selected_student_id) {
          project.started_at = new Date();
          if (project.duration) {
            const estimatedDate = new Date();
            estimatedDate.setDate(estimatedDate.getDate() + project.duration);
            project.estimated_completion_date = estimatedDate;
          }
        }
      }
    }
  });

  return Project;
};
