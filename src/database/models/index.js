const { Sequelize } = require('sequelize');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions || {},
    define: {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      freezeTableName: true
    }
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const UmkmProfile = require('./UmkmProfile')(sequelize, Sequelize.DataTypes);
const StudentProfile = require('./StudentProfile')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const Project = require('./Project')(sequelize, Sequelize.DataTypes);
const Application = require('./Application')(sequelize, Sequelize.DataTypes);
const Chat = require('./Chat')(sequelize, Sequelize.DataTypes);
const Review = require('./Review')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);

// Define associations
// User associations
User.hasOne(UmkmProfile, { foreignKey: 'user_id', as: 'umkmProfile' });
User.hasOne(StudentProfile, { foreignKey: 'user_id', as: 'studentProfile' });
User.hasMany(Product, { foreignKey: 'umkm_id', as: 'products' });
User.hasMany(Project, { foreignKey: 'umkm_id', as: 'projects' });
User.hasMany(Application, { foreignKey: 'student_id', as: 'applications' });
User.hasMany(Chat, { foreignKey: 'sender_id', as: 'sentChats' });
User.hasMany(Chat, { foreignKey: 'receiver_id', as: 'receivedChats' });
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
User.hasMany(Review, { foreignKey: 'reviewed_id', as: 'receivedReviews' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// UMKM Profile associations
UmkmProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Student Profile associations
StudentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Product associations
Product.belongsTo(User, { foreignKey: 'umkm_id', as: 'umkm' });
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });

// Project associations
Project.belongsTo(User, { foreignKey: 'umkm_id', as: 'umkm' });
Project.hasMany(Application, { foreignKey: 'project_id', as: 'applications' });

// Application associations
Application.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Application.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Chat associations
Chat.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Chat.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// Review associations
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'reviewed_id', as: 'reviewed' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Review.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = {
  sequelize,
  Sequelize,
  User,
  UmkmProfile,
  StudentProfile,
  Product,
  Project,
  Application,
  Chat,
  Review,
  Notification
};

module.exports = db;