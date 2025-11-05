"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const userService_1 = require("../services/userService");
const authUtils_1 = require("../utils/authUtils");
const router = (0, express_1.Router)();
// Rate limiting for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Validation rules
const registerValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ max: 255 })
        .withMessage('Email must not exceed 255 characters'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];
const loginValidation = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
];
/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', authLimiter, registerValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        const { name, email, password } = req.body;
        // Additional password validation
        const passwordValidation = authUtils_1.AuthUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
            res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
            return;
        }
        // Check if email already exists
        const existingUser = await userService_1.UserService.findByEmail(email);
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
            return;
        }
        // Hash password
        const passwordHash = await authUtils_1.AuthUtils.hashPassword(password);
        // Create user
        const user = await userService_1.UserService.createUser(name, email, passwordHash);
        // Generate JWT token
        const token = authUtils_1.AuthUtils.generateToken(user.id, user.email);
        const response = {
            success: true,
            message: 'User registered successfully',
            user,
            token
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
});
/**
 * POST /auth/login
 * Login user
 */
router.post('/login', authLimiter, loginValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        const { email, password } = req.body;
        // Find user by email
        const user = await userService_1.UserService.findByEmail(email);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        // Verify password
        const isPasswordValid = await authUtils_1.AuthUtils.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        // Update last login
        await userService_1.UserService.updateLastLogin(user.id);
        // Generate JWT token
        const token = authUtils_1.AuthUtils.generateToken(user.id, user.email);
        // Prepare user response (without password hash)
        const userResponse = {
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
        const response = {
            success: true,
            message: 'Login successful',
            user: userResponse,
            token
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
});
/**
 * POST /auth/verify
 * Verify JWT token (optional route for frontend)
 */
router.post('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authUtils_1.AuthUtils.extractTokenFromHeader(authHeader);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'No token provided'
            });
            return;
        }
        // Verify token
        const payload = authUtils_1.AuthUtils.verifyToken(token);
        // Get user info
        const user = await userService_1.UserService.findById(payload.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Token is valid',
            user
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});
/**
 * GET /auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', async (req, res) => {
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
        const payload = authUtils_1.AuthUtils.verifyToken(token);
        const user = await userService_1.UserService.findById(payload.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User info retrieved successfully',
            user
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map