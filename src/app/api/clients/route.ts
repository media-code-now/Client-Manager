import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { getDatabaseUrl } from '../../../utils/database';

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
    console.log('Clients API called');
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth header or invalid format:', authHeader?.substring(0, 20));
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.log('JWT_SECRET not found');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
      console.log('JWT verified for user:', decoded.email);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Connect to database
    const client = new Client({
      connectionString: getDatabaseUrl()
    });
    
    await client.connect();

    // Fetch clients
    const clientsQuery = `
      SELECT 
        id::text as "id",
        name,
        company,
        status,
        email,
        phone,
        -- tags is optional; ignore if column missing in some schemas
        NULL as tags,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt",
        COALESCE(last_activity_at, updated_at) as "lastActivityAt"
      FROM clients 
      ORDER BY updated_at DESC
    `;

    const result = await client.query(clientsQuery);
    await client.end();

    console.log('Clients query returned:', result.rows.length, 'clients');

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

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/clients called');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('POST: No auth header or invalid format');
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('POST: JWT_SECRET not found');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('POST: JWT verified for user:', (decoded as any).email);
    } catch (error) {
      console.log('POST: JWT verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('POST: Request body:', body);
    
    const { name, company, status = 'Active', email = null, phone = null, notes = null } = body || {};

    if (!name || typeof name !== 'string') {
      console.log('POST: Missing or invalid name field');
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    console.log('POST: Creating client with data:', { name, company, status, email, phone, notes });

    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    console.log('POST: Database connected');

    // Ensure minimal clients table exists (safe for Postgres; no-op if already exists)
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        status TEXT DEFAULT 'Active',
        email TEXT,
        phone TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('POST: Table ensured');

    const insertQuery = `
      INSERT INTO clients (name, company, status, email, phone, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id::text as "id", name, company, status, email, phone, notes,
                created_at as "createdAt", updated_at as "updatedAt",
                updated_at as "lastActivityAt";
    `;
    const insertValues = [name, company || null, status, email, phone, notes];
    const result = await client.query(insertQuery, insertValues);
    await client.end();

    console.log('POST: Client inserted successfully:', result.rows[0]);

    return NextResponse.json({ success: true, client: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('POST: Create client error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}