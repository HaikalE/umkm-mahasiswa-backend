module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Nullable for Firebase auth users
    },
    user_type: {
      type: DataTypes.ENUM('umkm', 'student'),
      allowNull: false
    },
    firebase_uid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isNumeric: true
      }
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['firebase_uid']
      },
      {
        fields: ['user_type']
      }
    ]
  });

  return User;
};