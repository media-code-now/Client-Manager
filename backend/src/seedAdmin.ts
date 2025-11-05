#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { pool, testConnection, closeDatabase } from './config/database';
import { UserService } from './services/userService';
import { AuthUtils } from './utils/authUtils';

// Load environment variables
dotenv.config();

/**
 * Seed Admin User Script
 * 
 * Creates an admin user in the auth_users table using environment variables:
 * - ADMIN_NAME: Full name of the admin user
 * - ADMIN_EMAIL: Email address (must be unique)
 * - ADMIN_PASSWORD: Plain text password (will be hashed with bcrypt)
 * 
 * Usage: npm run seed:admin
 */

interface AdminConfig {
  name: string;
  email: string;
  password: string;
}

/**
 * Validate and get admin configuration from environment variables
 */
function getAdminConfig(): AdminConfig {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name) {
    throw new Error('ADMIN_NAME environment variable is required');
  }

  if (!email) {
    throw new Error('ADMIN_EMAIL environment variable is required');
  }

  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is required');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }

  // Basic password validation
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
  }

  return { name, email, password };
}

/**
 * Create admin user if it doesn't exist
 */
async function createAdminUser(): Promise<void> {
  try {
    console.log('🌱 Starting admin user seed process...\n');

    // Test database connection
    await testConnection();

    // Get admin configuration
    const adminConfig = getAdminConfig();
    console.log(`📧 Admin Email: ${adminConfig.email}`);
    console.log(`👤 Admin Name: ${adminConfig.name}`);
    console.log(`🔐 Password Length: ${adminConfig.password.length} characters\n`);

    // Check if user already exists
    console.log('🔍 Checking if admin user already exists...');
    const existingUser = await UserService.findByEmail(adminConfig.email);

    if (existingUser) {
      console.log('✅ Admin user already exists');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   UUID: ${existingUser.uuid}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Active: ${existingUser.is_active}`);
      console.log(`   Created: ${existingUser.created_at}`);
      return;
    }

    // Hash the password
    console.log('🔐 Hashing admin password...');
    const passwordHash = await AuthUtils.hashPassword(adminConfig.password);
    console.log('✅ Password hashed successfully');

    // Create the admin user
    console.log('👤 Creating admin user...');
    const newUser = await UserService.createUser(
      adminConfig.name,
      adminConfig.email,
      passwordHash
    );

    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   UUID: ${newUser.uuid}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Active: ${newUser.is_active}`);
    console.log(`   Created: ${newUser.created_at}`);

  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Email already exists')) {
      console.error('   The admin email is already in use. Use a different email or check existing users.');
    } else if (error.message.includes('environment variable')) {
      console.error('   Please set the required environment variables in your .env file:');
      console.error('   ADMIN_NAME=John Doe');
      console.error('   ADMIN_EMAIL=admin@yourcompany.com');
      console.error('   ADMIN_PASSWORD=your_secure_password');
    } else if (error.message.includes('Database')) {
      console.error('   Database connection failed. Make sure PostgreSQL is running and configured correctly.');
    }
    
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await createAdminUser();
    console.log('\n🎉 Admin seed process completed successfully!');
  } catch (error: any) {
    console.error('\n💥 Admin seed process failed:', error.message);
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

export { createAdminUser, getAdminConfig };