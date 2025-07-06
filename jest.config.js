module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test files location
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/database/migrate.js',
    '!src/database/seed.js',
    '!src/database/createdb.js'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Clear mocks
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Environment variables for testing
  setupFiles: ['<rootDir>/tests/env.js']
};