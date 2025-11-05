"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.requireAdmin = exports.authenticateToken = void 0;
const authUtils_1 = require("../utils/authUtils");
const userService_1 = require("../services/userService");
/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authUtils_1.AuthUtils.extractTokenFromHeader(authHeader);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        // Verify token
        const payload = authUtils_1.AuthUtils.verifyToken(token);
        // Verify user still exists and is active
        const user = await userService_1.UserService.findById(payload.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
            return;
        }
        // Add user info to request
        req.user = {
            userId: payload.userId,
            email: payload.email
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to check if user is admin (optional - for future use)
 */
const requireAdmin = async (req, res, next) => {
    // For now, we'll just check if user exists
    // In future, you can add role-based checks
    if (!req.user) {
        res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware for error handling
 */
const errorHandler = (error, req, res, next) => {
    console.error('Auth Error:', error);
    // Handle specific error types
    if (error.message.includes('JWT')) {
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
        return;
    }
    if (error.message.includes('Database')) {
        res.status(500).json({
            success: false,
            message: 'Database error occurred'
        });
        return;
    }
    // Generic error response
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=auth.js.map