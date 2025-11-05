import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        email: string;
    };
}
/**
 * Middleware to authenticate JWT token
 */
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if user is admin (optional - for future use)
 */
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware for error handling
 */
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map