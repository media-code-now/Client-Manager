import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

let sql: any = null;

function getSql() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(dbUrl);
  }
  return sql;
}

export async function GET(request: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const clientId = searchParams.get('clientId');
    const assignedTo = searchParams.get('assignedTo');
    const dueDateFrom = searchParams.get('dueDateFrom');
    const dueDateTo = searchParams.get('dueDateTo');
    const searchQuery = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getSql();

    // Build WHERE conditions dynamically
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (priority) {
      conditions.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }

    if (clientId) {
      conditions.push(`client_id = $${paramIndex++}`);
      params.push(parseInt(clientId, 10));
    }

    if (assignedTo) {
      conditions.push(`assigned_to = $${paramIndex++}`);
      params.push(assignedTo);
    }

    if (dueDateFrom) {
      conditions.push(`due_date >= $${paramIndex++}`);
      params.push(dueDateFrom);
    }

    if (dueDateTo) {
      conditions.push(`due_date <= $${paramIndex++}`);
      params.push(dueDateTo);
    }

    if (searchQuery) {
      conditions.push(`(title ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`);
      params.push(`%${searchQuery}%`);
      params.push(`%${searchQuery}%`);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count - handle both scenarios
    let total = 0;
    try {
      const countQuery = `SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`;
      const countResult = await db(countQuery, params);
      total = countResult[0]?.total || 0;
    } catch (error) {
      console.error('Error getting count:', error);
      total = 0;
    }

    // Get paginated results with client info
    const query = `
      SELECT 
        t.*,
        c.name as client_name,
        c.status as client_status
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE ${whereClause}
      ORDER BY 
        CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
        due_date ASC, 
        CASE 
          WHEN priority = 'critical' THEN 1
          WHEN priority = 'high' THEN 2
          WHEN priority = 'medium' THEN 3
          ELSE 4
        END ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit);
    params.push(offset);

    let tasks: any[] = [];
    try {
      tasks = await db(query, params);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      tasks = [];
    }

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      filters: {
        status: status || null,
        priority: priority || null,
        clientId: clientId || null,
        assignedTo: assignedTo || null,
        dueDateFrom: dueDateFrom || null,
        dueDateTo: dueDateTo || null,
        search: searchQuery || null
      }
    });

  } catch (error: any) {
    console.error('Error filtering tasks:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}
