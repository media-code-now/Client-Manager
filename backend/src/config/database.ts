import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mini_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create PostgreSQL connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  console.log('Closing database pool...');
  await pool.end();
};

// process.on('SIGTERM', async () => {
//   console.log('SIGTERM received, shutting down gracefully');
//   await closeDatabase();
//   process.exit(0);
// });