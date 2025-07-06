const db = require('./models');

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models
    await db.sequelize.sync({ 
      force: process.env.NODE_ENV === 'development' && process.env.DB_FORCE_SYNC === 'true',
      alter: process.env.NODE_ENV === 'development'
    });
    
    console.log('✅ All models synchronized successfully.');
    console.log('📊 Database tables created/updated:');
    console.log('   - users');
    console.log('   - umkm_profiles');
    console.log('   - student_profiles');
    console.log('   - products');
    console.log('   - projects');
    console.log('   - applications');
    console.log('   - chats');
    console.log('   - reviews');
    console.log('   - notifications');
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('Migration completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateDatabase;