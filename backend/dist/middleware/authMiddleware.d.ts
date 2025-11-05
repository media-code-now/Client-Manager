import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
    };
}
/**
 * JWT Authentication Middleware
 *
 * Reads JWT from Authorization: Bearer <token> header
 * Verifies using JWT_SECRET
 * If valid, attaches req.user = { id, email }
 * If missing or invalid, returns 401 JSON { error: "Unauthorized" }
 */
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Optional middleware to require authentication
 * Use this when you want to make authentication optional on some routes
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map