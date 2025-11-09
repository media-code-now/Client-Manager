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

async function checkTables() {
  try {
    loadEnv();

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      process.exit(1);
    }

    console.log('🔍 Checking database tables...');
    console.log('Database:', process.env.DATABASE_URL.split('@')[1].split('/')[0]);

    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    const result = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log('\n📋 Tables in database:');
    if (result.length === 0) {
      console.log('  (no tables found)');
    } else {
      result.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    }

    // Check specifically for user_profiles
    const userProfilesExists = result.some(row => row.tablename === 'user_profiles');
    if (userProfilesExists) {
      console.log('\n✅ user_profiles table EXISTS');
      
      // Get column info
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles'
        ORDER BY ordinal_position
      `;
      
      console.log('\n📊 Columns in user_profiles:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('\n❌ user_profiles table DOES NOT EXIST');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
