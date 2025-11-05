/**
 * Authentication utilities for the CRM frontend
 * Handles JWT token storage, retrieval, validation, and refresh token rotation
 */

export interface User {
  id: number;
  name: string;
  email: string;
  uuid: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiration in seconds
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Storage keys for localStorage
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'crm_access_token',
  REFRESH_TOKEN: 'crm_refresh_token',
  USER: 'crm_user',
  TOKEN_EXPIRES_AT: 'crm_token_expires_at',
} as const;

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Save access token to localStorage
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

/**
 * Remove access token from localStorage
 */
export function removeAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Save refresh token to localStorage
 */
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

/**
 * Remove refresh token from localStorage
 */
export function removeRefreshToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Save token expiration time
 */
export function setTokenExpiresAt(expiresIn: number): void {
  if (typeof window === 'undefined') return;
  const expiresAt = Date.now() + (expiresIn * 1000);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
}

/**
 * Get token expiration time
 */
export function getTokenExpiresAt(): number | null {
  if (typeof window === 'undefined') return null;
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  return expiresAtStr ? parseInt(expiresAtStr) : null;
}

/**
 * Remove token expiration time
 */
export function removeTokenExpiresAt(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
}

/**
 * Get user data from localStorage
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

/**
 * Save user data to localStorage
 */
export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/**
 * Remove user data from localStorage
 */
export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  if (!accessToken || !refreshToken) return false;
  
  // Check if we have a stored expiration time
  const expiresAt = getTokenExpiresAt();
  if (expiresAt && Date.now() >= expiresAt) {
    // Token is expired, but we might be able to refresh it
    return !!refreshToken;
  }
  
  // Try to validate the access token structure
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    // If access token is invalid, check if we have refresh token
    return !!refreshToken;
  }
}

/**
 * Check if access token is expired or about to expire (within 5 minutes)
 */
export function isAccessTokenExpired(): boolean {
  const expiresAt = getTokenExpiresAt();
  if (expiresAt) {
    // Consider token expired if it expires within 5 minutes
    return Date.now() >= (expiresAt - 5 * 60 * 1000);
  }
  
  const accessToken = getAccessToken();
  if (!accessToken) return true;
  
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const currentTime = Date.now() / 1000;
    // Consider expired if expires within 5 minutes
    return payload.exp <= (currentTime + 300);
  } catch {
    return true;
  }
}

/**
 * Get current authentication state
 */
export function getAuthState(): AuthState {
  return {
    isAuthenticated: isAuthenticated(),
    user: getUser(),
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  };
}

/**
 * Clear all authentication data
 */
export function logout(): void {
  removeAccessToken();
  removeRefreshToken();
  removeTokenExpiresAt();
  removeUser();
}

/**
 * Save token pair and user data
 */
export function saveTokenPair(tokens: TokenPair, user: User): void {
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
  setTokenExpiresAt(tokens.expiresIn);
  setUser(user);
}

/**
 * Legacy login function for backward compatibility
 */
export function login(token: string, user: User): void {
  setAccessToken(token);
  setUser(user);
}

/**
 * Create authorization header for API requests
 */
export function getAuthHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Refresh access token using refresh token
 */
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      logout();
      return false;
    }

    const data = await response.json();
    if (data.success && data.tokens && data.user) {
      saveTokenPair(data.tokens, data.user);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    logout();
    return false;
  }
}

/**
 * Make authenticated API request with automatic token refresh
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Check if access token needs refreshing
  if (isAccessTokenExpired() && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication failed');
    }
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Try to refresh token once
      const refreshed = await refreshTokens();
      if (refreshed) {
        // Retry the original request with new token
        const retryResponse = await fetch(fullUrl, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
            ...options.headers,
          },
        });
        
        if (retryResponse.ok) {
          return retryResponse.json();
        }
      }
      
      // If refresh failed or retry failed, logout and redirect
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'API request failed');
  }

  return response.json();
}

/**
 * Logout from backend and clear local storage
 */
export async function logoutWithBackend(): Promise<void> {
  const refreshToken = getRefreshToken();
  
  try {
    if (refreshToken) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error('Backend logout failed:', error);
  } finally {
    logout(); // Always clear local storage
  }
}

/**
 * Logout from all devices
 */
export async function logoutFromAllDevices(): Promise<void> {
  try {
    await apiRequest('/auth/logout-all', { method: 'POST' });
  } catch (error) {
    console.error('Logout from all devices failed:', error);
  } finally {
    logout(); // Always clear local storage
  }
}

/**
 * Verify token with backend
 */
export async function verifyToken(): Promise<boolean> {
  try {
    await apiRequest('/auth/verify', { method: 'POST' });
    return true;
  } catch {
    logout();
    return false;
  }
}

/**
 * Legacy function - kept for backward compatibility
 */
export function getToken(): string | null {
  return getAccessToken();
}