import { User, UserResponse } from '../types/auth';
export declare class UserService {
    /**
     * Create a new user
     */
    static createUser(name: string, email: string, passwordHash: string): Promise<UserResponse>;
    /**
     * Find user by email
     */
    static findByEmail(email: string): Promise<User | null>;
    /**
     * Find user by ID
     */
    static findById(id: number): Promise<UserResponse | null>;
    /**
     * Update user's last login timestamp
     */
    static updateLastLogin(id: number): Promise<void>;
    /**
     * Check if email exists
     */
    static emailExists(email: string): Promise<boolean>;
    /**
     * Get user count (for admin purposes)
     */
    static getUserCount(): Promise<number>;
}
//# sourceMappingURL=userService.d.ts.map