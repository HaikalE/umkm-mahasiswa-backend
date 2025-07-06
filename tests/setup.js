// Jest setup file
const db = require('../src/database/models');

// Global setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Test database connected successfully');
    
    // Sync database
    await db.sequelize.sync({ force: true });
    console.log('Test database synced successfully');
  } catch (error) {
    console.error('Test database setup failed:', error);
    process.exit(1);
  }
});

// Global teardown after all tests
afterAll(async () => {
  try {
    // Close database connection
    await db.sequelize.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Test teardown failed:', error);
  }
});

// Setup before each test
beforeEach(async () => {
  // Clear all tables before each test
  try {
    await db.sequelize.truncate({ cascade: true, restartIdentity: true });
  } catch (error) {
    console.error('Failed to truncate tables:', error);
  }
});

// Global test utilities
global.testUtils = {
  // Helper to create test user
  createTestUser: async (userData = {}) => {
    const bcrypt = require('bcryptjs');
    const { User } = db;
    
    const defaultUser = {
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      full_name: 'Test User',
      user_type: 'student',
      is_verified: true
    };
    
    return await User.create({ ...defaultUser, ...userData });
  },
  
  // Helper to generate JWT token
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  // Helper to create test UMKM with profile
  createTestUmkm: async (userData = {}, profileData = {}) => {
    const user = await global.testUtils.createTestUser({
      user_type: 'umkm',
      ...userData
    });
    
    const { UmkmProfile } = db;
    const profile = await UmkmProfile.create({
      user_id: user.id,
      business_name: 'Test Business',
      business_type: 'teknologi',
      ...profileData
    });
    
    return { user, profile };
  },
  
  // Helper to create test student with profile
  createTestStudent: async (userData = {}, profileData = {}) => {
    const user = await global.testUtils.createTestUser({
      user_type: 'student',
      ...userData
    });
    
    const { StudentProfile } = db;
    const profile = await StudentProfile.create({
      user_id: user.id,
      university: 'Test University',
      major: 'Computer Science',
      ...profileData
    });
    
    return { user, profile };
  }
};