#!/usr/bin/env node
/**
 * Script to clean up demo users, tasks, and credentials from the database
 * This removes all sample data to start with a clean slate
 */

const { Client } = require('pg');

async function cleanupDemoData() {
  // Use DATABASE_URL from environment or default to the one in .env.local
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://neondb_owner:npg_lzaeXiGZc6R0@ep-falling-block-afb3zmcn-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    console.error('Please set DATABASE_URL environment variable');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');
    console.log('');

    // Count existing records before cleanup
    console.log('📊 Current database state:');
    
    const clientsCount = await client.query('SELECT COUNT(*) FROM clients WHERE id IS NOT NULL');
    console.log(`   - Clients: ${clientsCount.rows[0].count}`);
    
    const tasksCount = await client.query('SELECT COUNT(*) FROM tasks WHERE id IS NOT NULL');
    console.log(`   - Tasks: ${tasksCount.rows[0].count}`);
    
    const usersCount = await client.query('SELECT COUNT(*) FROM users WHERE id IS NOT NULL');
    console.log(`   - Users: ${usersCount.rows[0].count}`);
    
    console.log('');
    console.log('🧹 Starting cleanup...');
    console.log('');

    // Delete tasks first (due to foreign key constraints)
    const deletedTasks = await client.query('DELETE FROM tasks WHERE id IS NOT NULL RETURNING id');
    console.log(`✓ Deleted ${deletedTasks.rowCount} tasks`);

    // Delete credentials if table exists
    try {
      const deletedCreds = await client.query('DELETE FROM credentials WHERE id IS NOT NULL RETURNING id');
      console.log(`✓ Deleted ${deletedCreds.rowCount} credentials`);
    } catch (err) {
      if (err.code === '42P01') {
        console.log('ℹ️  Credentials table does not exist (skipping)');
      } else {
        throw err;
      }
    }

    // Delete clients
    const deletedClients = await client.query('DELETE FROM clients WHERE id IS NOT NULL RETURNING id');
    console.log(`✓ Deleted ${deletedClients.rowCount} clients`);

    // Optional: Delete demo users (but keep the admin user you created)
    // Uncomment if you want to remove ALL users:
    // const deletedUsers = await client.query('DELETE FROM users WHERE email != $1 RETURNING email', ['noam@nsmprime.com']);
    // console.log(`✓ Deleted ${deletedUsers.rowCount} demo users (kept admin)`);

    console.log('');
    console.log('✨ Cleanup complete!');
    console.log('');
    console.log('📊 Final database state:');
    
    const finalClientsCount = await client.query('SELECT COUNT(*) FROM clients');
    console.log(`   - Clients: ${finalClientsCount.rows[0].count}`);
    
    const finalTasksCount = await client.query('SELECT COUNT(*) FROM tasks');
    console.log(`   - Tasks: ${finalTasksCount.rows[0].count}`);
    
    console.log('');
    console.log('🎉 Database is now clean and ready for real data!');

  } catch (error) {
    console.error('');
    console.error('❌ Error during cleanup:', error.message);
    
    if (error.code === '42P01') {
      console.error('');
      console.error('Table does not exist. This is normal if you haven\'t created tables yet.');
      console.error('The tables will be created automatically when you use the app.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('');
    console.log('🔌 Disconnected from database');
  }
}

// Run the cleanup
cleanupDemoData();
