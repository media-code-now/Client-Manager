import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import * as jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
}

interface ActivityRow {
  id: number;
  record_id: number;
  user_id: string;
  user_email: string;
  activity_type: string | null;
  table_name: string;
  action: string;
  timestamp: string;
  new_values: any;
  changed_fields: any;
}

function verifyAuth(request: NextRequest): DecodedToken | null {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) return null;
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    return jwt.verify(token, secret) as DecodedToken;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const url = new URL(request.url);
    const activityType = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const getStats = url.searchParams.get('stats') === 'true';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const sql = neon(process.env.DATABASE_URL || '');

    if (getStats) {
      const statsResult = await sql`
        SELECT
          COUNT(*)::INT as total_activities,
          COUNT(CASE WHEN activity_type = 'task_created' THEN 1 END)::INT as tasks_created,
          COUNT(CASE WHEN activity_type = 'task_completed' THEN 1 END)::INT as tasks_completed,
          COUNT(CASE WHEN activity_type = 'credential_updated' THEN 1 END)::INT as credentials_updated,
          COUNT(CASE WHEN activity_type = 'note_added' THEN 1 END)::INT as notes_added,
          COUNT(CASE WHEN activity_type = 'call_logged' THEN 1 END)::INT as calls_logged,
          COUNT(CASE WHEN activity_type = 'email_sent' THEN 1 END)::INT as emails_sent,
          COUNT(CASE WHEN activity_type = 'meeting_scheduled' THEN 1 END)::INT as meetings_scheduled,
          COUNT(CASE WHEN activity_type = 'file_uploaded' THEN 1 END)::INT as files_uploaded,
          MAX(timestamp) as last_activity,
          COUNT(DISTINCT user_id)::INT as unique_users
        FROM audit_log
        WHERE record_id = ${clientId}
      `;
      return NextResponse.json({ success: true, data: statsResult[0] });
    }

    let query = `
      SELECT id, record_id, user_id, user_email, activity_type, table_name, action, timestamp, new_values, changed_fields 
      FROM audit_log
      WHERE record_id = $1
    `;
    const qParams: any[] = [clientId];

    if (activityType) {
      query += ` AND activity_type = $${qParams.length + 1}`;
      qParams.push(activityType);
    }
    if (search) {
      const pattern = `%${search}%`;
      query += ` AND (user_email ILIKE $${qParams.length + 1} OR table_name ILIKE $${qParams.length + 1} OR action ILIKE $${qParams.length + 1})`;
      qParams.push(pattern, pattern, pattern);
    }
    if (startDate) {
      query += ` AND timestamp >= $${qParams.length + 1}`;
      qParams.push(new Date(startDate).toISOString());
    }
    if (endDate) {
      query += ` AND timestamp <= $${qParams.length + 1}`;
      qParams.push(new Date(endDate).toISOString());
    }

    query += ` ORDER BY timestamp DESC LIMIT $${qParams.length + 1} OFFSET $${qParams.length + 2}`;
    qParams.push(limit, offset);

    const activities = await sql(query, qParams);

    let countQuery = `SELECT COUNT(*) as count FROM audit_log WHERE record_id = $1`;
    const countParams: any[] = [clientId];

    if (activityType) {
      countQuery += ` AND activity_type = $${countParams.length + 1}`;
      countParams.push(activityType);
    }
    if (search) {
      const pattern = `%${search}%`;
      countQuery += ` AND (user_email ILIKE $${countParams.length + 1} OR table_name ILIKE $${countParams.length + 1} OR action ILIKE $${countParams.length + 1})`;
      countParams.push(pattern, pattern, pattern);
    }
    if (startDate) {
      countQuery += ` AND timestamp >= $${countParams.length + 1}`;
      countParams.push(new Date(startDate).toISOString());
    }
    if (endDate) {
      countQuery += ` AND timestamp <= $${countParams.length + 1}`;
      countParams.push(new Date(endDate).toISOString());
    }

    const countResult = await sql(countQuery, countParams);
    const total = parseInt(countResult[0]?.count || '0');

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + activities.length < total,
      },
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const body = await request.json();
    const { format = 'csv', activityType = null, startDate = null, endDate = null } = body;

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or json' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL || '');

    let query = `
      SELECT id, record_id, user_id, user_email, activity_type, table_name, action, timestamp, new_values, changed_fields 
      FROM audit_log
      WHERE record_id = $1
    `;
    const qParams: any[] = [clientId];

    if (activityType) {
      query += ` AND activity_type = $${qParams.length + 1}`;
      qParams.push(activityType);
    }
    if (startDate) {
      query += ` AND timestamp >= $${qParams.length + 1}`;
      qParams.push(new Date(startDate).toISOString());
    }
    if (endDate) {
      query += ` AND timestamp <= $${qParams.length + 1}`;
      qParams.push(new Date(endDate).toISOString());
    }

    query += ` ORDER BY timestamp DESC`;

    const activities = await sql(query, qParams);

    if (format === 'csv') {
      const csv = convertToCSV(activities as ActivityRow[]);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="client-${clientId}-activities.csv"`,
        },
      });
    } else {
      return new NextResponse(JSON.stringify(activities, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="client-${clientId}-activities.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export activities' },
      { status: 500 }
    );
  }
}

function convertToCSV(activities: ActivityRow[]): string {
  const headers = ['ID', 'User Email', 'Activity Type', 'Table', 'Action', 'Timestamp', 'Changed Fields'];
  const rows = activities.map(a => [
    a.id.toString(),
    a.user_email || '',
    a.activity_type || 'unknown',
    a.table_name || '',
    a.action || '',
    new Date(a.timestamp).toISOString(),
    a.changed_fields ? JSON.stringify(a.changed_fields) : '',
  ]);

  return [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}
