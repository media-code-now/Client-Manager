"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUtils = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthUtils {
    /**
     * Hash password using bcrypt
     */
    static async hashPassword(password) {
        try {
            return await bcrypt_1.default.hash(password, this.BCRYPT_ROUNDS);
        }
        catch (error) {
            throw new Error('Failed to hash password');
        }
    }
    /**
     * Compare password with hash
     */
    static async comparePassword(password, hash) {
        try {
            return await bcrypt_1.default.compare(password, hash);
        }
        catch (error) {
            throw new Error('Failed to compare password');
        }
    }
    /**
     * Generate JWT token
     */
    static generateToken(userId, email) {
        try {
            const payload = {
                userId,
                email
            };
            return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
                expiresIn: this.JWT_EXPIRES_IN,
                issuer: 'crm-auth',
                audience: 'crm-users'
            });
        }
        catch (error) {
            throw new Error('Failed to generate token');
        }
    }
    /**
     * Verify JWT token
     */
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET, {
                issuer: 'crm-auth',
                audience: 'crm-users'
            });
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    /**
     * Extract token from Authorization header
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    /**
     * Validate password strength
     */
    static validatePassword(password) {
        if (!password || password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!/(?=.*\d)/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one number' };
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
        }
        return { isValid: true };
    }
    /**
     * Validate email format
     */
    static validateEmail(email) {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    }
    /**
     * Sanitize user input
     */
    static sanitizeString(input) {
        return input.trim().toLowerCase();
    }
    /**
     * Generate secure random string (for additional security features)
     */
    static generateSecureRandom(length = 32) {
        return require('crypto').randomBytes(length).toString('hex');
    }
}
exports.AuthUtils = AuthUtils;
AuthUtils.BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
AuthUtils.JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
AuthUtils.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
//# sourceMappingURL=authUtils.js.map