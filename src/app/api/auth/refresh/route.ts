import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';
import { getDatabaseUrl } from '../../../../utils/database';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RefreshTokenPayload {
  userId: number;
  iat: number;
  exp: number;
}

interface UserPayload {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token required' },
        { status: 400 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify refresh token
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, jwtRefreshSecret) as RefreshTokenPayload;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Connect to database
    const client = new Client({
      connectionString: getDatabaseUrl()
    });
    
    await client.connect();

    try {
      // Verify refresh token exists in database and hasn't expired
      const tokenQuery = `
        SELECT rt.id, rt.token_hash, rt.expires_at, rt.revoked_at
        FROM refresh_tokens rt
        WHERE rt.user_id = $1 AND rt.expires_at > NOW() AND rt.revoked_at IS NULL
      `;
      const tokenResult = await client.query(tokenQuery, [decoded.userId]);

      if (tokenResult.rows.length === 0) {
        await client.end();
        return NextResponse.json(
          { success: false, error: 'Refresh token not found or expired' },
          { status: 401 }
        );
      }

      // Verify the token hash matches (check if this specific token is valid)
      let isValidToken = false;
      for (const row of tokenResult.rows) {
        if (await bcrypt.compare(refreshToken, row.token_hash)) {
          isValidToken = true;
          break;
        }
      }

      if (!isValidToken) {
        await client.end();
        return NextResponse.json(
          { success: false, error: 'Invalid refresh token' },
          { status: 401 }
        );
      }

      // Get user data
      const userQuery = `
        SELECT id, uuid, name, email, role 
        FROM users 
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0) {
        await client.end();
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Generate new access token
      const userPayload: UserPayload = {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role
      };

      const accessToken = jwt.sign(userPayload, jwtSecret, { expiresIn: '15m' });

      await client.end();

      return NextResponse.json({
        success: true,
        tokens: {
          accessToken,
          expiresIn: 900 // 15 minutes in seconds
        }
      });

    } catch (dbError) {
      await client.end();
      console.error('Database error during token refresh:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
