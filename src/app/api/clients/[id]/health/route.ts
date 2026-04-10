import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { getDatabaseUrl } from '../../../../../utils/database';
import { formatHealthData } from '../../../../../lib/client-health-calculator';

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

/**
 * GET /api/clients/[id]/health
 * 
 * Returns health score data for a specific client
 * Includes:
 * - Health score (0-100)
 * - Status (excellent, good, attention, critical)
 * - Task metrics (overdue, pending, completed)
 * - Activity metrics (last activity, days without activity)
 * - Credential metrics (count, last update)
 * - Trend indicators
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const clientId = context.params.id;

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

    const userId = decoded.id;

    // Connect to database
    const client = new Client({
      connectionString: getDatabaseUrl()
    });
    
    await client.connect();

    // Fetch client details first
    const clientQuery = `
      SELECT id, name FROM clients 
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `;

    const clientResult = await client.query(clientQuery, [clientId, userId]);

    if (clientResult.rows.length === 0) {
      await client.end();
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    const clientName = clientResult.rows[0].name;

    // Get task metrics: overdue, pending, completed
    const taskMetricsQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(*) as total_tasks,
        MAX(CASE 
          WHEN status = 'completed' THEN completion_date
          WHEN status != 'completed' THEN updated_at
          ELSE NULL 
        END) as last_activity
      FROM tasks
      WHERE client_id = $1
    `;

    const taskMetrics = await client.query(taskMetricsQuery, [clientId]);
    const taskData = taskMetrics.rows[0];

    // Get credential metrics: count and last update
    const credentialMetricsQuery = `
      SELECT 
        COUNT(*) as credentials_count,
        MAX(updated_at) as credentials_last_updated
      FROM credentials
      WHERE client_id = $1
    `;

    const credentialMetrics = await client.query(credentialMetricsQuery, [clientId]);
    const credentialData = credentialMetrics.rows[0];

    await client.end();

    // Combine all data for health score calculation
    const healthData = formatHealthData(parseInt(clientId), clientName, {
      overdue_tasks: parseInt(taskData.overdue_tasks || '0'),
      pending_tasks: parseInt(taskData.pending_tasks || '0'),
      completed_tasks: parseInt(taskData.completed_tasks || '0'),
      total_tasks: parseInt(taskData.total_tasks || '0'),
      last_activity: taskData.last_activity,
      credentials_count: parseInt(credentialData.credentials_count || '0'),
      credentials_last_updated: credentialData.credentials_last_updated
    });

    return NextResponse.json({
      success: true,
      data: healthData
    });

  } catch (error) {
    console.error('Client health API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
