import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// JWT payload interface
interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * JWT Authentication Middleware
 * 
 * Reads JWT from Authorization: Bearer <token> header
 * Verifies using JWT_SECRET
 * If valid, attaches req.user = { id, email }
 * If missing or invalid, returns 401 JSON { error: "Unauthorized" }
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract token from header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get JWT secret from environment
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Attach user info to request object
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    // Continue to next middleware/handler
    next();
    
  } catch (error) {
    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (error instanceof jwt.NotBeforeError) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Generic error
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Optional middleware to require authentication
 * Use this when you want to make authentication optional on some routes
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET || !token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};