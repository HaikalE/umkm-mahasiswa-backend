module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('payments', {
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
    umkm_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    payment_phase: {
      type: DataTypes.ENUM('initial', 'final'),
      allowNull: false,
      comment: '50% awal atau 50% akhir'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'IDR'
    },
    payment_method: {
      type: DataTypes.ENUM(
        'bank_transfer', 'e_wallet', 'credit_card', 
        'virtual_account', 'qris', 'cash'
      ),
      allowNull: false
    },
    payment_gateway: {
      type: DataTypes.ENUM('midtrans', 'xendit', 'doku', 'manual'),
      defaultValue: 'midtrans'
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID dari payment gateway'
    },
    payment_proof: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL bukti pembayaran'
    },
    status: {
      type: DataTypes.ENUM(
        'pending', 'processing', 'completed', 
        'failed', 'cancelled', 'refunded'
      ),
      defaultValue: 'pending'
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payment_gateway_response: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Response dari payment gateway'
    },
    admin_fee: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'Fee platform (%)'
    },
    net_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Amount setelah dipotong fee'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['umkm_id']
      },
      {
        fields: ['student_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['payment_phase']
      },
      {
        fields: ['due_date']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['project_id', 'payment_phase'],
        name: 'unique_project_payment_phase'
      }
    ]
  });

  return Payment;
};