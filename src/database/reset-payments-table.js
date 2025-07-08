const db = require('./models');

/**
 * Emergency script untuk force reset payments table
 * PERINGATAN: Script ini akan menghapus semua data payments
 */
async function forceResetPaymentsTable() {
  try {
    console.log('⚠️  WARNING: This will PERMANENTLY DELETE all payments data!');
    console.log('🔄 Starting force reset of payments table...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    const queryInterface = db.sequelize.getQueryInterface();
    
    // Check if payments table exists
    const tables = await queryInterface.showAllTables();
    const paymentTableExists = tables.includes('payments');
    
    if (paymentTableExists) {
      console.log('📋 Payments table found, preparing to reset...');
      
      try {
        // Drop all dependent objects first
        console.log('🔄 Dropping all payments table constraints and indexes...');
        
        // Get all indexes
        const indexes = await queryInterface.showIndex('payments');
        console.log(`📊 Found ${indexes.length} indexes to remove`);
        
        // Drop all non-primary indexes
        for (const index of indexes) {
          if (!index.primary) {
            try {
              await queryInterface.removeIndex('payments', index.name);
              console.log(`   ✅ Removed index: ${index.name}`);
            } catch (error) {
              console.log(`   ⚠️  Could not remove index ${index.name}: ${error.message}`);
            }
          }
        }
        
        // Drop the table completely
        console.log('🗑️  Dropping payments table...');
        await queryInterface.dropTable('payments');
        console.log('✅ Payments table dropped successfully');
        
      } catch (dropError) {
        console.log('⚠️  Error during table drop:', dropError.message);
        console.log('🔄 Attempting alternative drop method...');
        
        // Alternative: Use raw SQL to force drop
        await db.sequelize.query('DROP TABLE IF EXISTS payments CASCADE;');
        console.log('✅ Payments table force dropped with CASCADE');
      }
      
      // Clean up ENUM types if they exist
      console.log('🧹 Cleaning up ENUM types...');
      
      try {
        await db.sequelize.query('DROP TYPE IF EXISTS "enum_payments_payment_phase" CASCADE;');
        await db.sequelize.query('DROP TYPE IF EXISTS "enum_payments_payment_method" CASCADE;');
        await db.sequelize.query('DROP TYPE IF EXISTS "enum_payments_payment_gateway" CASCADE;');
        await db.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status" CASCADE;');
        console.log('✅ ENUM types cleaned up');
      } catch (enumError) {
        console.log('⚠️  ENUM cleanup warning:', enumError.message);
      }
    } else {
      console.log('📋 Payments table does not exist, skipping drop...');
    }
    
    // Recreate payments table from model
    console.log('🔄 Creating fresh payments table from model...');
    
    await db.Payment.sync({ force: true });
    console.log('✅ Fresh payments table created successfully');
    
    // Verify the table is working
    console.log('🔍 Verifying payments table functionality...');
    
    const testCount = await db.Payment.count();
    console.log(`📊 Payments table working correctly (${testCount} records)`);
    
    // Show table structure
    const tableDescription = await queryInterface.describeTable('payments');
    const columnCount = Object.keys(tableDescription).length;
    console.log(`📋 Table structure: ${columnCount} columns created`);
    
    const indexes = await queryInterface.showIndex('payments');
    console.log(`📊 Indexes created: ${indexes.length} indexes`);
    
    console.log('🎉 Payments table force reset completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - Old table: ✅ Completely removed');
    console.log('   - ENUM types: ✅ Cleaned up');
    console.log('   - New table: ✅ Created from fresh model');
    console.log('   - Functionality: ✅ Verified working');
    console.log('   - Data: ⚠️  ALL PREVIOUS DATA LOST (as expected)');
    console.log('');
    console.log('💡 You can now start the server with: npm start');
    
  } catch (error) {
    console.error('❌ Force reset failed:', error);
    console.error('📍 Stack trace:', error.stack);
    
    console.error('');
    console.error('💡 Manual recovery options:');
    console.error('   1. Connect to PostgreSQL directly:');
    console.error('      psql -d your_database_name');
    console.error('   2. Drop table manually:');
    console.error('      DROP TABLE IF EXISTS payments CASCADE;');
    console.error('   3. Drop ENUM types manually:');
    console.error('      DROP TYPE IF EXISTS "enum_payments_payment_phase" CASCADE;');
    console.error('      DROP TYPE IF EXISTS "enum_payments_payment_method" CASCADE;');
    console.error('      DROP TYPE IF EXISTS "enum_payments_payment_gateway" CASCADE;');
    console.error('      DROP TYPE IF EXISTS "enum_payments_status" CASCADE;');
    console.error('   4. Then run: npm start');
    
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run reset if called directly
if (require.main === module) {
  console.log('⚠️  ========================================');
  console.log('⚠️  PAYMENTS TABLE FORCE RESET');
  console.log('⚠️  THIS WILL DELETE ALL PAYMENT DATA!');
  console.log('⚠️  ========================================');
  console.log('');
  
  // Add a delay to let user read the warning
  setTimeout(() => {
    forceResetPaymentsTable()
      .then(() => {
        console.log('Force reset completed, exiting...');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Force reset failed:', error);
        process.exit(1);
      });
  }, 2000);
} else {
  module.exports = forceResetPaymentsTable;
}