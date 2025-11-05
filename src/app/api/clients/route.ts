import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

interface DecodedToken {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Connect to database
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await client.connect();

    // Fetch clients
    const clientsQuery = `
      SELECT 
        id,
        name,
        company,
        status,
        email,
        phone,
        tags,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt",
        last_activity_at as "lastActivityAt"
      FROM clients 
      ORDER BY updated_at DESC
    `;

    const result = await client.query(clientsQuery);
    await client.end();

    return NextResponse.json({
      success: true,
      clients: result.rows
    });

  } catch (error) {
    console.error('Clients API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}