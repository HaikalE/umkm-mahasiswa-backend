const db = require('./models');

/**
 * Manual migration script to add missing columns to existing tables
 * This script safely adds new columns without losing existing data
 */
async function migrateProjectColumns() {
  try {
    console.log('🔄 Starting manual migration for Project table...');
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    const queryInterface = db.sequelize.getQueryInterface();
    
    // Check if started_at column exists
    const tableDescription = await queryInterface.describeTable('projects');
    
    const columnsToAdd = [];
    
    // Check for missing columns and add them to the list
    if (!tableDescription.started_at) {
      columnsToAdd.push({
        column: 'started_at',
        definition: {
          type: db.Sequelize.DATE,
          allowNull: true,
          comment: 'When project actually started (when student was selected)'
        }
      });
    }
    
    if (!tableDescription.estimated_completion_date) {
      columnsToAdd.push({
        column: 'estimated_completion_date',
        definition: {
          type: db.Sequelize.DATE,
          allowNull: true,
          comment: 'Estimated completion date based on duration'
        }
      });
    }
    
    if (!tableDescription.actual_budget) {
      columnsToAdd.push({
        column: 'actual_budget',
        definition: {
          type: db.Sequelize.DECIMAL(15, 2),
          allowNull: true,
          comment: 'Final agreed budget from accepted application'
        }
      });
    }
    
    if (!tableDescription.progress_percentage) {
      columnsToAdd.push({
        column: 'progress_percentage',
        definition: {
          type: db.Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Overall project progress percentage'
        }
      });
    }
    
    if (!tableDescription.deliverables) {
      columnsToAdd.push({
        column: 'deliverables',
        definition: {
          type: db.Sequelize.JSON,
          allowNull: true,
          comment: 'Array of project deliverables uploaded by student'
        }
      });
    }
    
    if (!tableDescription.completion_notes) {
      columnsToAdd.push({
        column: 'completion_notes',
        definition: {
          type: db.Sequelize.TEXT,
          allowNull: true,
          comment: 'Student notes when requesting completion'
        }
      });
    }
    
    if (!tableDescription.umkm_completion_notes) {
      columnsToAdd.push({
        column: 'umkm_completion_notes',
        definition: {
          type: db.Sequelize.TEXT,
          allowNull: true,
          comment: 'UMKM notes when approving completion'
        }
      });
    }
    
    if (!tableDescription.completion_requested_at) {
      columnsToAdd.push({
        column: 'completion_requested_at',
        definition: {
          type: db.Sequelize.DATE,
          allowNull: true,
          comment: 'When student requested project completion'
        }
      });
    }
    
    if (!tableDescription.completed_at) {
      columnsToAdd.push({
        column: 'completed_at',
        definition: {
          type: db.Sequelize.DATE,
          allowNull: true,
          comment: 'When project was marked as completed'
        }
      });
    }
    
    // Add missing columns
    if (columnsToAdd.length > 0) {
      console.log(`📊 Adding ${columnsToAdd.length} missing columns to projects table:`);
      
      for (const { column, definition } of columnsToAdd) {
        console.log(`   - Adding column: ${column}`);
        await queryInterface.addColumn('projects', column, definition);
      }
      
      console.log('✅ All missing columns added successfully.');
    } else {
      console.log('✅ All required columns already exist in projects table.');
    }
    
    // Create missing indexes
    console.log('🔍 Checking and creating missing indexes...');
    
    const indexes = await queryInterface.showIndex('projects');
    const existingIndexNames = indexes.map(idx => idx.name);
    
    const indexesToCreate = [
      {
        name: 'projects_started_at',
        fields: ['started_at']
      },
      {
        name: 'projects_completed_at',
        fields: ['completed_at']
      },
      {
        name: 'projects_selected_student_id',
        fields: ['selected_student_id']
      },
      {
        name: 'projects_status_selected_student_id',
        fields: ['status', 'selected_student_id']
      }
    ];
    
    for (const index of indexesToCreate) {
      if (!existingIndexNames.includes(index.name)) {
        try {
          console.log(`   - Creating index: ${index.name}`);
          await queryInterface.addIndex('projects', index.fields, {
            name: index.name
          });
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`   - Index ${index.name} already exists, skipping...`);
          } else {
            console.warn(`   - Warning: Could not create index ${index.name}:`, error.message);
          }
        }
      } else {
        console.log(`   - Index ${index.name} already exists, skipping...`);
      }
    }
    
    console.log('🎉 Manual migration completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Columns added: ${columnsToAdd.length}`);
    console.log(`   - Indexes verified/created`);
    console.log('   - Data preserved: ✅');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateProjectColumns()
    .then(() => {
      console.log('Migration completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateProjectColumns;