module.exports = (sequelize, DataTypes) => {
  const StudentProfile = sequelize.define('student_profiles', {
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
    nim: {
      type: DataTypes.STRING,
      allowNull: true
    },
    university: {
      type: DataTypes.STRING,
      allowNull: false
    },
    faculty: {
      type: DataTypes.STRING,
      allowNull: true
    },
    major: {
      type: DataTypes.STRING,
      allowNull: false
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 14
      }
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of skill objects with name and level'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    portfolio_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    github_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    linkedin_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cv_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    portfolio_files: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of portfolio file objects'
    },
    interests: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of interest categories'
    },
    experience_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
      defaultValue: 'beginner'
    },
    availability: {
      type: DataTypes.ENUM('available', 'busy', 'not_available'),
      defaultValue: 'available'
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
    total_projects_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Hourly rate in IDR'
    }
  }, {
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['university']
      },
      {
        fields: ['major']
      },
      {
        fields: ['experience_level']
      },
      {
        fields: ['availability']
      },
      {
        fields: ['rating']
      }
    ]
  });

  return StudentProfile;
};