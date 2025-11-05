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
  tokenVersion?: number; // For global logout capability
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  revoked_at?: Date;
  revoked_reason?: string;
  device_info?: any; // JSONB data
  ip_address?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiration in seconds
}

export interface EnhancedAuthResponse {
  success: boolean;
  message: string;
  user?: UserResponse;
  tokens?: TokenPair;
}