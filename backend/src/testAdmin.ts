#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { testConnection, closeDatabase } from './config/database';
import { UserService } from './services/userService';
import { AuthUtils } from './utils/authUtils';

// Load environment variables
dotenv.config();

/**
 * Test Admin Login Script
 * 
 * Verifies that the admin user can be authenticated with the credentials
 * from environment variables.
 * 
 * Usage: npm run test:admin
 */

async function testAdminLogin(): Promise<void> {
  try {
    console.log('🧪 Testing admin user login...\n');

    // Test database connection
    await testConnection();

    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
    }

    console.log(`📧 Testing login for: ${adminEmail}`);

    // Find user by email
    const user = await UserService.findByEmail(adminEmail);
    
    if (!user) {
      console.log('❌ Admin user not found in database');
      console.log('   Run: npm run seed:admin to create the admin user');
      return;
    }

    console.log('✅ Admin user found in database');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);

    // Test password authentication
    console.log('\n🔐 Testing password authentication...');
    const isPasswordValid = await AuthUtils.comparePassword(adminPassword, user.password_hash);

    if (isPasswordValid) {
      console.log('✅ Password authentication successful!');
      
      // Generate JWT token to verify complete auth flow
      console.log('\n🎫 Generating JWT token...');
      const token = AuthUtils.generateToken(user.id, user.email);
      console.log('✅ JWT token generated successfully');
      console.log(`   Token preview: ${token.substring(0, 50)}...`);
      
      // Verify the token
      console.log('\n🔍 Verifying JWT token...');
      const payload = AuthUtils.verifyToken(token);
      console.log('✅ JWT token verified successfully');
      console.log(`   User ID: ${payload.userId}`);
      console.log(`   Email: ${payload.email}`);
      
    } else {
      console.log('❌ Password authentication failed');
      console.log('   The password in ADMIN_PASSWORD does not match the stored hash');
    }

  } catch (error: any) {
    console.error('❌ Error testing admin login:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await testAdminLogin();
    console.log('\n🎉 Admin login test completed successfully!');
  } catch (error: any) {
    console.error('\n💥 Admin login test failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    console.log('\n🔌 Closing database connection...');
    await closeDatabase();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Execute the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { testAdminLogin };