"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("../config/database");
class UserService {
    /**
     * Create a new user
     */
    static async createUser(name, email, passwordHash) {
        const query = `
      INSERT INTO auth_users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, uuid, name, email, is_active, created_at, updated_at
    `;
        try {
            const result = await database_1.pool.query(query, [name, email, passwordHash]);
            return result.rows[0];
        }
        catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Email already exists');
            }
            throw new Error('Failed to create user');
        }
    }
    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const query = `
      SELECT id, uuid, name, email, password_hash, is_active, created_at, updated_at
      FROM auth_users
      WHERE email = $1 AND is_active = true
    `;
        try {
            const result = await database_1.pool.query(query, [email]);
            return result.rows[0] || null;
        }
        catch (error) {
            throw new Error('Failed to find user');
        }
    }
    /**
     * Find user by ID
     */
    static async findById(id) {
        const query = `
      SELECT id, uuid, name, email, is_active, created_at, updated_at
      FROM auth_users
      WHERE id = $1 AND is_active = true
    `;
        try {
            const result = await database_1.pool.query(query, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            throw new Error('Failed to find user');
        }
    }
    /**
     * Update user's last login timestamp
     */
    static async updateLastLogin(id) {
        const query = `
      UPDATE auth_users 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
        try {
            await database_1.pool.query(query, [id]);
        }
        catch (error) {
            // Non-critical error, just log it
            console.error('Failed to update last login:', error);
        }
    }
    /**
     * Check if email exists
     */
    static async emailExists(email) {
        const query = `
      SELECT 1 FROM auth_users WHERE email = $1 LIMIT 1
    `;
        try {
            const result = await database_1.pool.query(query, [email]);
            return result.rows.length > 0;
        }
        catch (error) {
            throw new Error('Failed to check email existence');
        }
    }
    /**
     * Get user count (for admin purposes)
     */
    static async getUserCount() {
        const query = `SELECT COUNT(*) as count FROM auth_users WHERE is_active = true`;
        try {
            const result = await database_1.pool.query(query);
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            throw new Error('Failed to get user count');
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map