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
      type: DataTypes.STRING(20),  // Changed from ENUM to STRING to avoid conflicts
      allowNull: false,
      defaultValue: 'initial',
      comment: '50% awal atau 50% akhir - values: initial, final'
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
      type: DataTypes.STRING(50),  // Changed from ENUM to STRING
      allowNull: false,
      defaultValue: 'bank_transfer',
      comment: 'bank_transfer, e_wallet, credit_card, virtual_account, qris, cash'
    },
    payment_gateway: {
      type: DataTypes.STRING(50),  // Changed from ENUM to STRING
      defaultValue: 'midtrans',
      comment: 'midtrans, xendit, doku, manual'
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
      type: DataTypes.STRING(50),  // Changed from ENUM to STRING
      defaultValue: 'pending',
      comment: 'pending, processing, completed, failed, cancelled, refunded'
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
      allowNull: true,  // Made nullable to avoid calculation issues
      comment: 'Amount setelah dipotong fee'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    // Minimal indexes only - no complex constraints
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
      }
    ],
    // Removed all problematic validations and hooks
    // We'll handle uniqueness at application level if needed
    hooks: {
      beforeCreate: async (payment) => {
        // Simple net_amount calculation
        if (!payment.net_amount && payment.amount) {
          const feeAmount = payment.admin_fee ? (payment.amount * payment.admin_fee) / 100 : 0;
          payment.net_amount = payment.amount - feeAmount;
        }
      },
      beforeUpdate: async (payment) => {
        // Simple net_amount recalculation
        if (payment.changed('amount') || payment.changed('admin_fee')) {
          const feeAmount = payment.admin_fee ? (payment.amount * payment.admin_fee) / 100 : 0;
          payment.net_amount = payment.amount - feeAmount;
        }
      }
    }
  });

  return Payment;
};