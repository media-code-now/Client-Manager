import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { getDatabaseUrl } from '../../../utils/database';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


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

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decoded.id; // Get user ID from JWT

    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();

    // Ensure minimal tasks table exists with user_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Open',
        priority TEXT DEFAULT 'Medium',
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Add user_id column if it doesn't exist (for existing tables)
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS user_id INTEGER;
    `);

    // Update NULL user_id values to the current user (for migration)
    await client.query(`
      UPDATE tasks 
      SET user_id = $1 
      WHERE user_id IS NULL;
    `, [userId]);

    // Set NOT NULL constraint after populating
    await client.query(`
      ALTER TABLE tasks 
      ALTER COLUMN user_id SET NOT NULL;
    `);

    const result = await client.query(
      `SELECT id::text as "id", client_id::text as "clientId", title, description,
              status, priority, due_date as "dueDate" 
       FROM tasks 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [userId]
    );

    await client.end();

    return NextResponse.json({ success: true, tasks: result.rows });
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decoded.id; // Get user ID from JWT

    const body = await request.json();
    const { clientId, title, description = null, status = 'Open', priority = 'Medium', dueDate = null } = body || {};

    if (!clientId || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, title' },
        { status: 400 }
      );
    }

    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();

    // Ensure tasks table exists with user_id
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Open',
        priority TEXT DEFAULT 'Medium',
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Add user_id column if it doesn't exist (for existing tables)
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS user_id INTEGER;
    `);

    const result = await client.query(
      `INSERT INTO tasks (client_id, user_id, title, description, status, priority, due_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id::text as "id", client_id::text as "clientId", title, description, status, priority, due_date as "dueDate"`,
      [parseInt(clientId, 10), userId, title, description, status, priority, dueDate]
    );

    await client.end();

    return NextResponse.json({ success: true, task: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decoded.id; // Get user ID from JWT

    const body = await request.json();
    const { id, clientId, title, description, status, priority, dueDate } = body || {};

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (clientId !== undefined) {
      updates.push(`client_id = $${paramCount++}`);
      values.push(parseInt(clientId, 10));
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDate);
    }

    if (updates.length === 0) {
      await client.end();
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId); // for WHERE user_id
    values.push(parseInt(id, 10)); // for WHERE id

    const result = await client.query(
      `UPDATE tasks 
       SET ${updates.join(', ')}
       WHERE user_id = $${paramCount++} AND id = $${paramCount++}
       RETURNING id::text as "id", client_id::text as "clientId", title, description, status, priority, due_date as "dueDate"`,
      values
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task: result.rows[0] });
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
