import { JWTPayload } from '../types/auth';
export declare class AuthUtils {
    private static readonly BCRYPT_ROUNDS;
    private static readonly JWT_SECRET;
    private static readonly JWT_EXPIRES_IN;
    /**
     * Hash password using bcrypt
     */
    static hashPassword(password: string): Promise<string>;
    /**
     * Compare password with hash
     */
    static comparePassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate JWT token
     */
    static generateToken(userId: number, email: string): string;
    /**
     * Verify JWT token
     */
    static verifyToken(token: string): JWTPayload;
    /**
     * Extract token from Authorization header
     */
    static extractTokenFromHeader(authHeader: string | undefined): string | null;
    /**
     * Validate password strength
     */
    static validatePassword(password: string): {
        isValid: boolean;
        message?: string;
    };
    /**
     * Validate email format
     */
    static validateEmail(email: string): boolean;
    /**
     * Sanitize user input
     */
    static sanitizeString(input: string): string;
    /**
     * Generate secure random string (for additional security features)
     */
    static generateSecureRandom(length?: number): string;
}
//# sourceMappingURL=authUtils.d.ts.map