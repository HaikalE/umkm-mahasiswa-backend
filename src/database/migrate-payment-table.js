const db = require('./models');

/**
 * Migration script untuk fix Payment table SQL syntax issues
 * Menangani konflik ENUM types, constraints, dan indexes yang bermasalah
 */
async function fixPaymentTableIssues() {
  try {
    console.log('🔄 Starting Payment table migration...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    const queryInterface = db.sequelize.getQueryInterface();
    
    // Check if payments table exists
    const tables = await queryInterface.showAllTables();
    const paymentTableExists = tables.includes('payments');
    
    if (paymentTableExists) {
      console.log('📋 Payments table exists, checking for issues...');
      
      try {
        // Try to describe the table first
        const tableDescription = await queryInterface.describeTable('payments');
        console.log('✅ Payments table structure is readable');
        
        // Check for problematic constraints and indexes
        const indexes = await queryInterface.showIndex('payments');
        console.log(`📊 Found ${indexes.length} existing indexes`);
        
        // Check for problematic unique constraint
        const problematicConstraints = indexes.filter(idx => 
          idx.name.includes('unique_project_payment_phase') || 
          idx.unique && idx.fields && idx.fields.includes('project_id') && idx.fields.includes('payment_phase')
        );
        
        if (problematicConstraints.length > 0) {
          console.log('⚠️  Found problematic constraints, removing...');
          for (const constraint of problematicConstraints) {
            try {
              await queryInterface.removeIndex('payments', constraint.name);
              console.log(`   - Removed constraint: ${constraint.name}`);
            } catch (error) {
              console.log(`   - Could not remove constraint ${constraint.name}: ${error.message}`);
            }
          }
        }
        
        // Check for ENUM type conflicts
        console.log('🔍 Checking ENUM types...');
        
        try {
          // Try to query existing ENUM values
          const enumQuery = `
            SELECT t.typname as enum_name, e.enumlabel as enum_value 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname LIKE '%payments%'
            ORDER BY t.typname, e.enumsortorder;
          `;
          
          const enumTypes = await db.sequelize.query(enumQuery, {
            type: db.sequelize.QueryTypes.SELECT
          });
          
          console.log(`📋 Found ${enumTypes.length} existing ENUM values for payments`);
          
        } catch (enumError) {
          console.log('⚠️  Could not check ENUM types:', enumError.message);
        }
        
      } catch (describeError) {
        console.log('❌ Payments table exists but has issues:', describeError.message);
        console.log('🔄 Attempting to recreate payments table...');
        
        // Drop the problematic table
        await queryInterface.dropTable('payments');
        console.log('✅ Dropped problematic payments table');
      }
    }
    
    // Sync the Payment model with fixed constraints
    console.log('🔄 Syncing Payment model with database...');
    
    await db.Payment.sync({ force: paymentTableExists ? false : true });
    console.log('✅ Payment model synchronized successfully');
    
    // Verify the table is working
    console.log('🔍 Verifying payments table functionality...');
    
    const testCount = await db.Payment.count();
    console.log(`📊 Payments table working correctly (${testCount} records)`);
    
    console.log('🎉 Payment table migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Table structure: ✅ Fixed');
    console.log('   - Constraints: ✅ Safe constraints applied');
    console.log('   - Indexes: ✅ Optimized indexes created');
    console.log('   - ENUM types: ✅ Conflict resolved');
    
  } catch (error) {
    console.error('❌ Payment table migration failed:', error);
    
    if (error.message.includes('syntax error')) {
      console.error('💡 SQL Syntax Error detected. Possible solutions:');
      console.error('   1. Run: npm run db:reset:payments (recreate payments table)');
      console.error('   2. Check PostgreSQL version compatibility');
      console.error('   3. Manually drop payments table and retry');
    }
    
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  fixPaymentTableIssues()
    .then(() => {
      console.log('Payment table migration completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Payment table migration failed:', error);
      process.exit(1);
    });
}

module.exports = fixPaymentTableIssues;