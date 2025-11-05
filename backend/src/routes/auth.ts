import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { UserService } from '../services/userService';
import { RefreshTokenService } from '../services/RefreshTokenService';
import { AuthUtils } from '../utils/authUtils';
import { RegisterRequest, LoginRequest, AuthResponse, EnhancedAuthResponse, RefreshTokenRequest } from '../types/auth';

// Initialize with database pool - this should be passed in from the main app
let refreshTokenService: RefreshTokenService;

const router = Router();

// Function to initialize the refresh token service
export const initializeRefreshTokenService = (pool: Pool) => {
  refreshTokenService = new RefreshTokenService(pool);
};

// Rate limiting for auth routes
const authLimiter = rateLimit({
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
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', authLimiter, registerValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { name, email, password }: RegisterRequest = req.body;

    // Additional password validation
    const passwordValidation = AuthUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
      return;
    }

    // Check if email already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
      return;
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

    // Create user
    const user = await UserService.createUser(name, email, passwordHash);

    // Generate JWT token
    const token = AuthUtils.generateToken(user.id, user.email);

    const response: AuthResponse = {
      success: true,
      message: 'User registered successfully',
      user,
      token
    };

    res.status(201).json(response);
  } catch (error: any) {
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
router.post('/login', authLimiter, loginValidation, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await UserService.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await AuthUtils.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Update last login
    await UserService.updateLastLogin(user.id);

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

    let response: AuthResponse | EnhancedAuthResponse;

    // Check if refresh token service is available for enhanced auth
    if (refreshTokenService) {
      // Generate both access and refresh tokens
      const deviceInfo = {
        userAgent: req.headers['user-agent'],
        acceptLanguage: req.headers['accept-language']
      };
      const ipAddress = req.ip || req.connection.remoteAddress;

      const tokens = await AuthUtils.generateTokenPair(
        user.id,
        user.email,
        1, // Default token version
        refreshTokenService,
        deviceInfo,
        ipAddress
      );

      response = {
        success: true,
        message: 'Login successful',
        user: userResponse,
        tokens
      };
    } else {
      // Fallback to legacy single token
      const token = AuthUtils.generateToken(user.id, user.email);
      
      response = {
        success: true,
        message: 'Login successful',
        user: userResponse,
        token
      };
    }

    res.status(200).json(response);
  } catch (error: any) {
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
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    // Verify token
    const payload = AuthUtils.verifyToken(token);
    
    // Get user info
    const user = await UserService.findById(payload.userId);
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
  } catch (error) {
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
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const payload = AuthUtils.verifyToken(token);
    const user = await UserService.findById(payload.userId);

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
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    if (!refreshTokenService) {
      res.status(503).json({
        success: false,
        message: 'Refresh token service not available'
      });
      return;
    }

    const { refreshToken } = req.body as RefreshTokenRequest;

    // Validate refresh token
    const tokenData = await refreshTokenService.validateToken(refreshToken);
    if (!tokenData) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
      return;
    }

    // Get user info
    const user = await UserService.findById(tokenData.token.user_id);
    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    // Revoke the used refresh token (token rotation)
    await refreshTokenService.revokeToken(refreshToken, 'used_for_refresh');

    // Generate new token pair
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      acceptLanguage: req.headers['accept-language']
    };
    const ipAddress = req.ip || req.connection.remoteAddress;

    const tokens = await AuthUtils.generateTokenPair(
      user.id,
      user.email,
      tokenData.userTokenVersion,
      refreshTokenService,
      deviceInfo,
      ipAddress
    );

    const userResponse = {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      user: userResponse,
      tokens
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Token refresh failed'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and revoke refresh token
 */
router.post('/logout', [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshTokenService && refreshToken) {
      // Revoke the refresh token
      await refreshTokenService.revokeToken(refreshToken, 'logout');
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

/**
 * POST /auth/logout-all
 * Logout from all devices (revoke all refresh tokens)
 */
router.post('/logout-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const payload = AuthUtils.verifyToken(token);
    
    if (refreshTokenService) {
      // Revoke all refresh tokens for the user
      const revokedCount = await refreshTokenService.revokeAllUserTokens(payload.userId, 'logout_all');
      
      // Increment token version to invalidate all existing access tokens
      await refreshTokenService.incrementUserTokenVersion(payload.userId);

      res.status(200).json({
        success: true,
        message: `Logged out from all devices (${revokedCount} sessions terminated)`
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  } catch (error: any) {
    console.error('Logout all error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

export default router;