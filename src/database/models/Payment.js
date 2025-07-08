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
        fields: ['project_id'],
        name: 'payments_project_id_idx'
      },
      {
        fields: ['umkm_id'],
        name: 'payments_umkm_id_idx'
      },
      {
        fields: ['student_id'],
        name: 'payments_student_id_idx'
      },
      {
        fields: ['status'],
        name: 'payments_status_idx'
      },
      {
        fields: ['payment_phase'],
        name: 'payments_payment_phase_idx'
      },
      {
        fields: ['due_date'],
        name: 'payments_due_date_idx'
      },
      {
        fields: ['created_at'],
        name: 'payments_created_at_idx'
      },
      {
        fields: ['payment_method'],
        name: 'payments_payment_method_idx'
      },
      {
        fields: ['payment_gateway'],
        name: 'payments_payment_gateway_idx'
      }
    ],
    // Move unique constraint to model level validation instead of index
    validate: {
      // Ensure only one payment per phase per project
      uniqueProjectPaymentPhase() {
        return sequelize.models.payments.findOne({
          where: {
            project_id: this.project_id,
            payment_phase: this.payment_phase,
            id: { [sequelize.Sequelize.Op.ne]: this.id }
          }
        }).then(payment => {
          if (payment) {
            throw new Error(`Payment for ${this.payment_phase} phase already exists for this project`);
          }
        });
      }
    },
    hooks: {
      beforeCreate: async (payment) => {
        // Calculate net_amount if not provided
        if (!payment.net_amount && payment.amount && payment.admin_fee) {
          const feeAmount = (payment.amount * payment.admin_fee) / 100;
          payment.net_amount = payment.amount - feeAmount;
        } else if (!payment.net_amount) {
          payment.net_amount = payment.amount;
        }
      },
      beforeUpdate: async (payment) => {
        // Recalculate net_amount if amount or admin_fee changed
        if (payment.changed('amount') || payment.changed('admin_fee')) {
          const feeAmount = (payment.amount * payment.admin_fee) / 100;
          payment.net_amount = payment.amount - feeAmount;
        }
      }
    }
  });

  return Payment;
};