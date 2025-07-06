const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const dbName = process.env.DB_NAME || 'umkm_mahasiswa_db';
  
  // Connect to PostgreSQL without specifying database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: 'postgres' // Connect to default postgres database
  });
  
  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL server');
    
    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (result.rows.length === 0) {
      // Create database
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`📋 Database '${dbName}' already exists`);
    }
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure PostgreSQL is running on your system');
      console.log('   - Windows: Check PostgreSQL service in services.msc');
      console.log('   - macOS: brew services start postgresql');
      console.log('   - Linux: sudo systemctl start postgresql');
    } else if (error.code === '28P01') {
      console.log('💡 Check your PostgreSQL credentials in .env file');
    }
    
    throw error;
  } finally {
    await client.end();
  }
}

// Run database creation if called directly
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log('Database creation completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database creation failed:', error);
      process.exit(1);
    });
}

module.exports = createDatabase;