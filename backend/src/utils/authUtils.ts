import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWTPayload, TokenPair } from '../types/auth';
import { RefreshTokenService } from '../services/RefreshTokenService';

export class AuthUtils {
  private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '30m';
  private static readonly REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30');

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Generate access JWT token (short-lived)
   */
  static generateAccessToken(userId: number, email: string, tokenVersion: number = 1): string {
    try {
      const payload: JWTPayload = {
        userId,
        email,
        tokenVersion
      };

      return jwt.sign(payload, this.JWT_SECRET as string, {
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        issuer: 'crm-auth',
        audience: 'crm-users'
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  static async generateTokenPair(
    userId: number, 
    email: string, 
    tokenVersion: number = 1,
    refreshTokenService: RefreshTokenService,
    deviceInfo?: any,
    ipAddress?: string
  ): Promise<TokenPair> {
    try {
      // Generate access token
      const accessToken = this.generateAccessToken(userId, email, tokenVersion);
      
      // Generate refresh token string
      const refreshTokenString = RefreshTokenService.generateTokenString();
      
      // Store refresh token in database
      await refreshTokenService.create(
        userId, 
        refreshTokenString, 
        this.REFRESH_TOKEN_EXPIRES_DAYS,
        deviceInfo,
        ipAddress
      );

      // Calculate access token expiration in seconds
      const expiresIn = this.parseExpirationToSeconds(this.ACCESS_TOKEN_EXPIRES_IN);

      return {
        accessToken,
        refreshToken: refreshTokenString,
        expiresIn
      };
    } catch (error) {
      throw new Error('Failed to generate token pair');
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  static generateToken(userId: number, email: string, tokenVersion: number = 1): string {
    return this.generateAccessToken(userId, email, tokenVersion);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET as string, {
        issuer: 'crm-auth',
        audience: 'crm-users'
      } as jwt.VerifyOptions) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; message?: string } {
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
  static validateEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize user input
   */
  static sanitizeString(input: string): string {
    return input.trim().toLowerCase();
  }

  /**
   * Generate secure random string (for additional security features)
   */
  static generateSecureRandom(length: number = 32): string {
    return require('crypto').randomBytes(length).toString('hex');
  }

  /**
   * Parse expiration string to seconds
   */
  private static parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 1800; // Default 30 minutes

    const [, num, unit] = match;
    const value = parseInt(num);

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 1800;
    }
  }
}