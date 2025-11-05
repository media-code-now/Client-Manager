export interface User {
    id: number;
    uuid: string;
    name: string;
    email: string;
    password_hash: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface UserResponse {
    id: number;
    uuid: string;
    name: string;
    email: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    success: boolean;
    message: string;
    user?: UserResponse;
    token?: string;
}
export interface JWTPayload {
    userId: number;
    email: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=auth.d.ts.map