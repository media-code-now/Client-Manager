#!/usr/bin/env node

/**
 * Database Migration Runner
 * Run with: node scripts/migrate.js
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL environment variable is not set');
      console.log('Please set it in your .env.local file');
      process.exit(1);
    }

    // Dynamically import the neon library
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    // Read the migration file
    const migrationPath = path.join(__dirname, '../docs/database/migrations/004_create_user_profiles.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running migration: 004_create_user_profiles.sql...');
    
    // Execute the migration
    await sql(migration);
    
    console.log('✅ Migration completed successfully!');
    console.log('\nThe user_profiles table has been created.');
    console.log('You can now use the Profile & Account settings in the app.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
