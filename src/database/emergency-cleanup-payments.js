const db = require('./models');

/**
 * EMERGENCY SCRIPT - Complete Payments Table Reset
 * 
 * Script ini akan BENAR-BENAR MENGHAPUS SEMUA yang terkait payments:
 * - Table payments
 * - Semua ENUM types payments
 * - Semua constraints dan indexes
 * - Semua foreign key dependencies
 * 
 * PERINGATAN: INI AKAN MENGHAPUS SEMUA DATA PAYMENTS!
 */

async function emergencyPaymentsCleanup() {
  let connection;
  
  try {
    console.log('🚨 EMERGENCY PAYMENTS CLEANUP');
    console.log('⚠️  WARNING: This will PERMANENTLY DELETE all payments data!');
    console.log('=====================================');
    
    // Get raw database connection
    connection = await db.sequelize.connectionManager.getConnection();
    
    console.log('✅ Database connection established');
    
    // 1. Drop all dependent foreign keys first
    console.log('🔄 Step 1: Removing foreign key constraints...');
    
    const dropForeignKeys = [
      `ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_project_id_fkey CASCADE;`,
      `ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_umkm_id_fkey CASCADE;`,
      `ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_student_id_fkey CASCADE;`,
      `ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_pkey CASCADE;`
    ];
    
    for (const sql of dropForeignKeys) {
      try {
        await db.sequelize.query(sql);
        console.log(`   ✅ Executed: ${sql.split(' ')[0]} ${sql.split(' ')[1]} ${sql.split(' ')[2]}`);
      } catch (error) {
        console.log(`   ⚠️  Skipped (not found): ${sql.split(' ')[0]} ${sql.split(' ')[1]} ${sql.split(' ')[2]}`);
      }
    }
    
    // 2. Drop all indexes related to payments
    console.log('🔄 Step 2: Removing all payments indexes...');
    
    const dropIndexes = [
      `DROP INDEX IF EXISTS payments_project_id_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_umkm_id_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_student_id_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_status_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_payment_phase_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_due_date_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_created_at_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_payment_method_idx CASCADE;`,
      `DROP INDEX IF EXISTS payments_payment_gateway_idx CASCADE;`,
      `DROP INDEX IF EXISTS unique_project_payment_phase CASCADE;`
    ];
    
    for (const sql of dropIndexes) {
      try {
        await db.sequelize.query(sql);
        console.log(`   ✅ Dropped index: ${sql.match(/payments_\w+/)?.[0] || 'unknown'}`);
      } catch (error) {
        console.log(`   ⚠️  Index not found: ${sql.match(/payments_\w+/)?.[0] || 'unknown'}`);
      }
    }
    
    // 3. Drop the payments table completely
    console.log('🔄 Step 3: Dropping payments table...');
    
    try {
      await db.sequelize.query('DROP TABLE IF EXISTS payments CASCADE;');
      console.log('   ✅ Payments table dropped successfully');
    } catch (error) {
      console.log('   ⚠️  Payments table was not found or already dropped');
    }
    
    // 4. Drop all ENUM types related to payments
    console.log('🔄 Step 4: Cleaning up ENUM types...');
    
    const dropEnums = [
      `DROP TYPE IF EXISTS "enum_payments_payment_phase" CASCADE;`,
      `DROP TYPE IF EXISTS "enum_payments_payment_method" CASCADE;`,
      `DROP TYPE IF EXISTS "enum_payments_payment_gateway" CASCADE;`,
      `DROP TYPE IF EXISTS "enum_payments_status" CASCADE;`,
      // Also clean up any other possible variations
      `DROP TYPE IF EXISTS enum_payments_payment_phase CASCADE;`,
      `DROP TYPE IF EXISTS enum_payments_payment_method CASCADE;`,
      `DROP TYPE IF EXISTS enum_payments_payment_gateway CASCADE;`,
      `DROP TYPE IF EXISTS enum_payments_status CASCADE;`
    ];
    
    for (const sql of dropEnums) {
      try {
        await db.sequelize.query(sql);
        const enumName = sql.match(/"?enum_payments_\w+"?/)?.[0] || 'unknown';
        console.log(`   ✅ Dropped ENUM: ${enumName}`);
      } catch (error) {
        const enumName = sql.match(/"?enum_payments_\w+"?/)?.[0] || 'unknown';
        console.log(`   ⚠️  ENUM not found: ${enumName}`);
      }
    }
    
    // 5. Clear any cached schema information
    console.log('🔄 Step 5: Clearing schema cache...');
    
    try {
      // Clear Sequelize's internal cache
      if (db.sequelize.modelManager && db.sequelize.modelManager.models) {
        delete db.sequelize.modelManager.models.payments;
      }
      
      // Clear query interface cache
      if (db.sequelize.queryInterface && db.sequelize.queryInterface.describeTableCache) {
        delete db.sequelize.queryInterface.describeTableCache.payments;
      }
      
      console.log('   ✅ Schema cache cleared');
    } catch (error) {
      console.log('   ⚠️  Could not clear schema cache:', error.message);
    }
    
    console.log('=====================================');
    console.log('🎉 EMERGENCY CLEANUP COMPLETED!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Foreign key constraints: REMOVED');
    console.log('   ✅ Indexes: REMOVED');
    console.log('   ✅ Payments table: DROPPED');
    console.log('   ✅ ENUM types: CLEANED');
    console.log('   ✅ Schema cache: CLEARED');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Run: npm start');
    console.log('   2. Server will create fresh payments table');
    console.log('   3. Test with: curl http://localhost:3000/health');
    console.log('');
    console.log('⚠️  Note: All payment data has been permanently deleted!');
    
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error);
    console.error('📍 Stack trace:', error.stack);
    
    console.error('');
    console.error('🆘 Manual recovery steps:');
    console.error('   1. Connect to PostgreSQL:');
    console.error('      psql -d your_database_name');
    console.error('');
    console.error('   2. Run these commands manually:');
    console.error('      DROP TABLE IF EXISTS payments CASCADE;');
    console.error('      DROP TYPE IF EXISTS "enum_payments_payment_phase" CASCADE;');
    console.error('      DROP TYPE IF EXISTS "enum_payments_payment_method" CASCADE;');
    console.error('      DROP TYPE IF EXISTS "enum_payments_payment_gateway" CASCADE;');
    console.error('      DROP TYPE IF EXISTS "enum_payments_status" CASCADE;');
    console.error('');
    console.error('   3. Exit PostgreSQL and run: npm start');
    
    throw error;
  } finally {
    if (connection) {
      try {
        await db.sequelize.connectionManager.releaseConnection(connection);
      } catch (releaseError) {
        console.log('⚠️  Could not release connection:', releaseError.message);
      }
    }
    
    try {
      await db.sequelize.close();
    } catch (closeError) {
      console.log('⚠️  Could not close sequelize:', closeError.message);
    }
  }
}

// Show warning and delay execution
if (require.main === module) {
  console.log('⚠️  ==========================================');
  console.log('⚠️  EMERGENCY PAYMENTS TABLE CLEANUP');
  console.log('⚠️  THIS WILL DELETE ALL PAYMENT DATA!');
  console.log('⚠️  ==========================================');
  console.log('');
  console.log('Starting in 3 seconds...');
  console.log('Press Ctrl+C to cancel');
  console.log('');
  
  setTimeout(() => {
    emergencyPaymentsCleanup()
      .then(() => {
        console.log('Emergency cleanup completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Emergency cleanup failed:', error.message);
        process.exit(1);
      });
  }, 3000);
}

module.exports = emergencyPaymentsCleanup;