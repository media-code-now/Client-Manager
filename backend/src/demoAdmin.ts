#!/usr/bin/env ts-node

/**
 * Example: Using Admin User for API Testing
 * 
 * This script demonstrates how to use the seeded admin user
 * to test protected API endpoints.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5001';

async function demonstrateAdminUsage() {
  try {
    console.log('🚀 Admin User API Demo\n');

    // Step 1: Login with admin credentials
    console.log('1️⃣ Logging in with admin credentials...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    console.log('✅ Admin login successful!');
    console.log(`   User: ${loginData.data.user.name}`);
    console.log(`   Email: ${loginData.data.user.email}`);
    
    const token = loginData.data.token;
    console.log(`   Token: ${token.substring(0, 50)}...\n`);

    // Step 2: Access protected endpoints
    console.log('2️⃣ Testing protected endpoints with admin token...\n');

    // Test clients endpoint
    console.log('📋 GET /clients');
    const clientsResponse = await fetch(`${API_BASE}/clients`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const clientsData = await clientsResponse.json();
    console.log(`   Status: ${clientsResponse.status}`);
    console.log(`   Clients found: ${clientsData.data?.length || 0}\n`);

    // Test tasks endpoint
    console.log('📝 GET /tasks');
    const tasksResponse = await fetch(`${API_BASE}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasksData = await tasksResponse.json();
    console.log(`   Status: ${tasksResponse.status}`);
    console.log(`   Tasks found: ${tasksData.data?.length || 0}\n`);

    // Test credentials endpoint
    console.log('🔐 GET /credentials');
    const credentialsResponse = await fetch(`${API_BASE}/credentials`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const credentialsData = await credentialsResponse.json();
    console.log(`   Status: ${credentialsResponse.status}`);
    console.log(`   Credentials found: ${credentialsData.data?.length || 0}\n`);

    // Step 3: Create sample data
    console.log('3️⃣ Creating sample data with admin privileges...\n');

    // Create a client
    console.log('👤 Creating sample client...');
    const createClientResponse = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Demo Client Corp',
        email: 'demo@client.com',
        phone: '+1-555-DEMO',
        address: '123 Demo Street, Demo City'
      })
    });
    const newClient = await createClientResponse.json();
    console.log(`   Status: ${createClientResponse.status}`);
    console.log(`   Client ID: ${newClient.data?.id}\n`);

    // Create a task
    console.log('📝 Creating sample task...');
    const createTaskResponse = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Admin Demo Task',
        description: 'This task was created by the admin user',
        priority: 'high',
        status: 'pending',
        dueDate: '2024-12-31',
        clientId: newClient.data?.id
      })
    });
    const newTask = await createTaskResponse.json();
    console.log(`   Status: ${createTaskResponse.status}`);
    console.log(`   Task ID: ${newTask.data?.id}\n`);

    console.log('🎉 Admin user demo completed successfully!');
    console.log('\nThe admin user can:');
    console.log('✅ Authenticate and receive JWT tokens');
    console.log('✅ Access all protected endpoints');
    console.log('✅ Create, read, update, and delete resources');
    console.log('✅ Manage clients, tasks, and credentials');

  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend server is running (npm run dev)');
    console.log('2. Verify admin user exists (npm run seed:admin)');
    console.log('3. Check environment variables are set correctly');
  }
}

// Run the demo
if (require.main === module) {
  demonstrateAdminUsage();
}

export { demonstrateAdminUsage };