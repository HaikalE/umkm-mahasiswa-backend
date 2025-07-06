module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('reviews', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reviewer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    reviewed_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    review_type: {
      type: DataTypes.ENUM('product', 'service', 'collaboration'),
      allowNull: false
    },
    criteria_ratings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Detailed ratings for different criteria'
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of image URLs for review'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether review is from verified transaction'
    },
    helpful_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Response from reviewed party'
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'reported', 'deleted'),
      defaultValue: 'active'
    }
  }, {
    indexes: [
      {
        fields: ['reviewer_id']
      },
      {
        fields: ['reviewed_id']
      },
      {
        fields: ['product_id']
      },
      {
        fields: ['project_id']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['review_type']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['status']
      }
    ],
    validate: {
      eitherProductOrProject() {
        if (!this.product_id && !this.project_id) {
          throw new Error('Review must be associated with either a product or project');
        }
        if (this.product_id && this.project_id) {
          throw new Error('Review cannot be associated with both product and project');
        }
      }
    }
  });

  return Review;
};