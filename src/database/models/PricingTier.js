module.exports = (sequelize, DataTypes) => {
  const PricingTier = sequelize.define('pricing_tiers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    category: {
      type: DataTypes.ENUM(
        'web_development', 'mobile_development', 'ui_ux_design', 
        'graphic_design', 'digital_marketing', 'content_writing',
        'data_analysis', 'video_editing', 'photography', 'consulting'
      ),
      allowNull: false
    },
    skill_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      allowNull: false
    },
    min_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Harga minimum untuk kategori dan level ini'
    },
    max_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Harga maksimum untuk kategori dan level ini'
    },
    recommended_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Harga yang direkomendasikan'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'IDR'
    },
    price_per: {
      type: DataTypes.ENUM('project', 'hour', 'day', 'week', 'month'),
      defaultValue: 'project'
    },
    complexity_factors: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Faktor yang mempengaruhi kompleksitas'
    },
    market_rate_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Data rate pasar untuk referensi'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    examples: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Contoh project untuk tier ini'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    effective_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin yang membuat pricing tier'
    }
  }, {
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['skill_level']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['effective_date']
      },
      {
        unique: true,
        fields: ['category', 'skill_level'],
        name: 'unique_category_skill_level'
      }
    ]
  });

  return PricingTier;
};