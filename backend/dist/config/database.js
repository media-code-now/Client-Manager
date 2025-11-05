"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.testConnection = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
exports.pool = new pg_1.Pool(dbConfig);
// Test database connection
const testConnection = async () => {
    try {
        const client = await exports.pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};
exports.testConnection = testConnection;
// Graceful shutdown
const closeDatabase = async () => {
    console.log('Closing database pool...');
    await exports.pool.end();
};
exports.closeDatabase = closeDatabase;
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM received, shutting down gracefully');
//   await closeDatabase();
//   process.exit(0);
// });
//# sourceMappingURL=database.js.map