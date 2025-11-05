import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/authUtils';
import { UserService } from '../services/userService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Verify token
    const payload = AuthUtils.verifyToken(token);
    
    // Verify user still exists and is active
    const user = await UserService.findById(payload.userId);
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
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user is admin (optional - for future use)
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

/**
 * Middleware for error handling
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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