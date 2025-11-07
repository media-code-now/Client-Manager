#!/usr/bin/env node
/**
 * Script to fix the clients table schema issue
 * The existing table has an incompatible schema - we need to drop and recreate it
 */

const { Client } = require('pg');

async function fixClientsTable() {
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_lzaeXiGZc6R0@ep-falling-block-afb3zmcn-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check existing table structure
    console.log('📊 Checking existing clients table...');
    const checkTable = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clients'
      ORDER BY ordinal_position;
    `);

    if (checkTable.rows.length > 0) {
      console.log('Current table structure:');
      checkTable.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
      });
      console.log('');
    }

    // Drop the existing table
    console.log('🗑️  Dropping existing clients table...');
    await client.query('DROP TABLE IF EXISTS clients CASCADE;');
    console.log('✓ Table dropped\n');

    // Create the correct table structure
    console.log('🔨 Creating new clients table with correct schema...');
    await client.query(`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        status TEXT DEFAULT 'Active',
        email TEXT,
        phone TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ Table created successfully\n');

    // Verify the new structure
    const verifyTable = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clients'
      ORDER BY ordinal_position;
    `);

    console.log('✅ New table structure:');
    verifyTable.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

    console.log('');
    console.log('🎉 Table fixed successfully!');
    console.log('');
    console.log('You can now add clients through the UI.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixClientsTable();
