import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

interface LoginRequest {
  email: string;
  password: string;
}

interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL environment variable not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const client = new Client({
      connectionString: dbUrl
    });
    
    try {
      await client.connect();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Find user by email
    const userQuery = 'SELECT id, uuid, name, email, password_hash, role FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      await client.end();
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      await client.end();
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      await client.end();
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const userPayload: User = {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Create access token (15 minutes)
    const accessToken = jwt.sign(userPayload, jwtSecret, { expiresIn: '15m' });
    
    // Create refresh token (7 days)
    const refreshToken = jwt.sign({ userId: user.id }, jwtRefreshSecret, { expiresIn: '7d' });

    // Store refresh token in database (hash it for security)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await client.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      user: userPayload,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900 // 15 minutes in seconds
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}