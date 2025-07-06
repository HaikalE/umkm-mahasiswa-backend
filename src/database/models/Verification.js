module.exports = (sequelize, DataTypes) => {
  const Verification = sequelize.define('verifications', {
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
    verification_type: {
      type: DataTypes.ENUM('student_auto', 'umkm_manual', 'identity', 'business', 'skill'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'pending', 'in_review', 'approved', 
        'rejected', 'expired', 'cancelled'
      ),
      defaultValue: 'pending'
    },
    verification_method: {
      type: DataTypes.ENUM(
        'system_auto', 'admin_manual', 'ai_verification', 
        'document_check', 'video_call', 'third_party'
      ),
      allowNull: false
    },
    submitted_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of document URLs and types'
    },
    verification_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Data spesifik untuk verifikasi'
    },
    ai_confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Skor kepercayaan AI (0-1)'
    },
    reviewer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin yang melakukan review'
    },
    reviewer_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Kapan verifikasi ini expired'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verification_badge: {
      type: DataTypes.ENUM(
        'verified', 'premium_verified', 'expert_verified', 
        'business_verified', 'identity_verified'
      ),
      allowNull: true
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Berapa kali user mencoba verifikasi'
    },
    max_retries: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    }
  }, {
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['verification_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['verification_method']
      },
      {
        fields: ['reviewer_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  return Verification;
};