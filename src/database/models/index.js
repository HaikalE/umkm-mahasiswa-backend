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

// Import all models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const UmkmProfile = require('./UmkmProfile')(sequelize, Sequelize.DataTypes);
const StudentProfile = require('./StudentProfile')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const Project = require('./Project')(sequelize, Sequelize.DataTypes);
const Application = require('./Application')(sequelize, Sequelize.DataTypes);
const Chat = require('./Chat')(sequelize, Sequelize.DataTypes);
const Review = require('./Review')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);

// Import missing models
const Payment = require('./Payment')(sequelize, Sequelize.DataTypes);
const PricingTier = require('./PricingTier')(sequelize, Sequelize.DataTypes);
const ProjectCheckpoint = require('./ProjectCheckpoint')(sequelize, Sequelize.DataTypes);
const Verification = require('./Verification')(sequelize, Sequelize.DataTypes);
const AIMatching = require('./AIMatching')(sequelize, Sequelize.DataTypes);

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
User.hasMany(Payment, { foreignKey: 'from_user_id', as: 'sentPayments' });
User.hasMany(Payment, { foreignKey: 'to_user_id', as: 'receivedPayments' });
User.hasMany(Verification, { foreignKey: 'user_id', as: 'verifications' });

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
Project.hasMany(ProjectCheckpoint, { foreignKey: 'project_id', as: 'checkpoints' });
Project.hasMany(Payment, { foreignKey: 'project_id', as: 'payments' });
Project.belongsTo(PricingTier, { foreignKey: 'pricing_tier_id', as: 'pricingTier' });

// ENHANCED: Selected Student Association
Project.belongsTo(User, { 
  foreignKey: 'selected_student_id', 
  as: 'selectedStudent',
  constraints: false // This allows null values
});

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

// Payment associations
Payment.belongsTo(User, { foreignKey: 'from_user_id', as: 'fromUser' });
Payment.belongsTo(User, { foreignKey: 'to_user_id', as: 'toUser' });
Payment.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// PricingTier associations
PricingTier.hasMany(Project, { foreignKey: 'pricing_tier_id', as: 'projects' });

// ProjectCheckpoint associations
ProjectCheckpoint.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Verification associations
Verification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// AIMatching associations
AIMatching.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
AIMatching.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

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
  Notification,
  Payment,
  PricingTier,
  ProjectCheckpoint,
  Verification,
  AIMatching
};

module.exports = db;
