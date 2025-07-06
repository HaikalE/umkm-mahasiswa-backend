module.exports = (sequelize, DataTypes) => {
  const UmkmProfile = sequelize.define('umkm_profiles', {
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
    business_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    business_type: {
      type: DataTypes.ENUM(
        'kuliner', 'fashion', 'teknologi', 'kerajinan', 
        'jasa', 'perdagangan', 'pertanian', 'lainnya'
      ),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    province: {
      type: DataTypes.STRING,
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facebook: {
      type: DataTypes.STRING,
      allowNull: true
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    banner_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      }
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_products: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_projects: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    premium_until: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['business_type']
      },
      {
        fields: ['city']
      },
      {
        fields: ['rating']
      }
    ]
  });

  return UmkmProfile;
};