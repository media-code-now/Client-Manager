#!/usr/bin/env node
/**
 * Test script to verify adding clients works via the API
 * This will help debug any issues with client creation
 */

async function testAddClient() {
  console.log('🧪 Testing client creation API...\n');

  // You'll need to get your actual token from localStorage after logging in
  // For now, let's test with a mock structure
  const API_URL = 'http://localhost:3000/api/clients';
  
  // Test data
  const testClient = {
    name: 'Test Client',
    company: 'Test Company Inc',
    status: 'Active',
    email: 'test@example.com',
    phone: '+1 (555) 123-4567',
    notes: 'This is a test client created via API test script'
  };

  console.log('📋 Test client data:');
  console.log(JSON.stringify(testClient, null, 2));
  console.log('\n');

  // Instructions for the user
  console.log('⚠️  To run this test:');
  console.log('1. Log in to http://localhost:3000');
  console.log('2. Open browser console (F12)');
  console.log('3. Run this command to get your token:');
  console.log('   localStorage.getItem("crm_access_token")');
  console.log('4. Then test with curl:');
  console.log('\n');
  console.log('curl -X POST http://localhost:3000/api/clients \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\');
  console.log(`  -d '${JSON.stringify(testClient)}'`);
  console.log('\n');
  console.log('💡 Or try adding a client through the UI:');
  console.log('   1. Go to http://localhost:3000/dashboard');
  console.log('   2. Click "Clients" in the sidebar');
  console.log('   3. Click "+ Add New Client" button');
  console.log('   4. Fill in the form');
  console.log('   5. Check the browser console (F12) for detailed logs');
  console.log('   6. Check the terminal running npm run dev for server logs');
}

testAddClient();
