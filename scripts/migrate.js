#!/usr/bin/env node

/**
 * Database Migration Runner
 * Run with: node scripts/migrate.js or npm run migrate
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

async function runMigration() {
  try {
    // Load environment variables
    loadEnv();

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL environment variable is not set');
      console.log('Please set it in your .env.local file');
      process.exit(1);
    }

    // Import neon library
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL, { fullResults: true });

    // Read the migration file
    const migrationPath = path.join(__dirname, '../docs/database/migrations/004_create_user_profiles.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running migration: 004_create_user_profiles.sql...');
    
    // Execute the migration using unsafe query for raw SQL
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.fetchOptions = {
      mode: 'no-cors',
    };
    
    // Split and execute each statement
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        // Use template literal with the statement as is
        await sql([statement]);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          throw err;
        }
        console.log(`ℹ️  Skipping: ${err.message.split('\n')[0]}`);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('\nThe user_profiles table has been created.');
    console.log('You can now use the Profile & Account settings in the app.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
