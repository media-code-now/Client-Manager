#!/usr/bin/env node

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

async function createUserProfilesTable() {
  try {
    loadEnv();

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      process.exit(1);
    }

    console.log('🔄 Creating user_profiles table...');

    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        avatar TEXT,
        company VARCHAR(255),
        role VARCHAR(255),
        timezone VARCHAR(100) DEFAULT 'America/New_York',
        language VARCHAR(10) DEFAULT 'en',
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT TRUE,
        marketing_emails BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Table created successfully');

    // Create the index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email)
    `;

    console.log('✅ Index created successfully');

    // Verify the table exists
    const result = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'user_profiles'
    `;

    if (result.length > 0) {
      console.log('✅ Verified: user_profiles table exists');
      
      // Get column info
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles'
        ORDER BY ordinal_position
      `;
      
      console.log('\n📊 Columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Table creation failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createUserProfilesTable();
