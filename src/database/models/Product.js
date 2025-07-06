module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('products', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM(
        'kuliner', 'fashion', 'teknologi', 'kerajinan', 
        'jasa', 'perdagangan', 'pertanian', 'lainnya'
      ),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount_price: {
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
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of image URLs'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of tags for search'
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Product specifications object'
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    min_order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Weight in grams'
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Length, width, height in cm'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'out_of_stock', 'discontinued'),
      defaultValue: 'active'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    total_sold: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
        fields: ['price']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['is_featured']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return Product;
};