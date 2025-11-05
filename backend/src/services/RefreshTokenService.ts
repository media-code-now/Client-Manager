import { Pool } from 'pg';
import crypto from 'crypto';
import { RefreshToken } from '../types/auth';

export class RefreshTokenService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new refresh token for a user
   */
  async create(
    userId: number, 
    tokenString: string, 
    expiresInDays: number = 30,
    deviceInfo?: any,
    ipAddress?: string
  ): Promise<RefreshToken> {
    const tokenHash = this.hashToken(tokenString);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [userId, tokenHash, expiresAt, deviceInfo, ipAddress];
    const result = await this.pool.query(query, values);
    
    return result.rows[0];
  }

  /**
   * Find a refresh token by its string value
   */
  async findByToken(tokenString: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(tokenString);
    
    const query = `
      SELECT * FROM refresh_tokens 
      WHERE token_hash = $1 
      AND expires_at > NOW() 
      AND revoked_at IS NULL
    `;

    const result = await this.pool.query(query, [tokenHash]);
    return result.rows[0] || null;
  }

  /**
   * Validate a refresh token and return associated user info
   */
  async validateToken(tokenString: string): Promise<{ token: RefreshToken; userTokenVersion: number } | null> {
    const tokenHash = this.hashToken(tokenString);
    
    const query = `
      SELECT rt.*, au.token_version 
      FROM refresh_tokens rt
      INNER JOIN auth_users au ON rt.user_id = au.id
      WHERE rt.token_hash = $1 
      AND rt.expires_at > NOW() 
      AND rt.revoked_at IS NULL
      AND au.is_active = true
    `;

    const result = await this.pool.query(query, [tokenHash]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      token: {
        id: row.id,
        user_id: row.user_id,
        token_hash: row.token_hash,
        expires_at: row.expires_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        revoked_at: row.revoked_at,
        revoked_reason: row.revoked_reason,
        device_info: row.device_info,
        ip_address: row.ip_address
      },
      userTokenVersion: row.token_version
    };
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(tokenString: string, reason: string = 'manual_revocation'): Promise<boolean> {
    const tokenHash = this.hashToken(tokenString);
    
    const query = `
      UPDATE refresh_tokens 
      SET revoked_at = NOW(), revoked_reason = $2, updated_at = NOW()
      WHERE token_hash = $1 AND revoked_at IS NULL
    `;

    const result = await this.pool.query(query, [tokenHash, reason]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Revoke all refresh tokens for a user (useful for logout from all devices)
   */
  async revokeAllUserTokens(userId: number, reason: string = 'logout_all'): Promise<number> {
    const query = `
      UPDATE refresh_tokens 
      SET revoked_at = NOW(), revoked_reason = $2, updated_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL
    `;

    const result = await this.pool.query(query, [userId, reason]);
    return result.rowCount || 0;
  }

  /**
   * Increment user's token version to invalidate all existing tokens
   */
  async incrementUserTokenVersion(userId: number): Promise<number> {
    const query = `
      UPDATE auth_users 
      SET token_version = token_version + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING token_version
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0]?.token_version || 1;
  }

  /**
   * Clean up expired refresh tokens (should be run periodically)
   */
  async cleanupExpired(): Promise<number> {
    const query = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < NOW() OR revoked_at IS NOT NULL
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Get all active refresh tokens for a user (for admin/security purposes)
   */
  async getUserActiveTokens(userId: number): Promise<RefreshToken[]> {
    const query = `
      SELECT * FROM refresh_tokens 
      WHERE user_id = $1 
      AND expires_at > NOW() 
      AND revoked_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Hash a token string for secure storage
   */
  private hashToken(tokenString: string): string {
    return crypto.createHash('sha256').update(tokenString).digest('hex');
  }

  /**
   * Generate a secure random refresh token string
   */
  static generateTokenString(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}