module.exports = (sequelize, DataTypes) => {
  const ProjectCheckpoint = sequelize.define('project_checkpoints', {
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
    checkpoint_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Urutan checkpoint (1, 2, 3, dst)'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deliverables: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of expected deliverables'
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    completion_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending', 'in_progress', 'submitted', 
        'under_review', 'approved', 'rejected', 'completed'
      ),
      defaultValue: 'pending'
    },
    student_submission: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Laporan/hasil kerja dari student'
    },
    submission_files: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of file URLs'
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    umkm_feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    umkm_rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Rating UMKM untuk checkpoint ini'
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_mandatory: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Apakah checkpoint ini wajib'
    },
    weight_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Bobot checkpoint terhadap total project'
    }
  }, {
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['due_date']
      },
      {
        fields: ['checkpoint_number']
      },
      {
        unique: true,
        fields: ['project_id', 'checkpoint_number'],
        name: 'unique_project_checkpoint_number'
      }
    ]
  });

  return ProjectCheckpoint;
};