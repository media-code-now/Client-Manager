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

interface DecodedToken {
  userId: string;
  email: string;
}

/**
 * GET /api/clients/[id]/lifecycle
 * Get client lifecycle information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'JWT_SECRET is not configured' },
        { status: 500 }
      );
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const clientId = parseInt(params.id);
    const database = getSql();

    // Get client information
    const clientResult = await database`
      SELECT id, name, status, created_at, user_id FROM clients
      WHERE id = ${clientId} AND user_id = ${decoded.userId}
    `;

    if (clientResult.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const client = clientResult[0];

    // Get task statistics
    const tasksResult = await database`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_tasks,
        MAX(updated_at) as last_activity
      FROM tasks
      WHERE client_id = ${clientId}
    `;

    const tasks = tasksResult[0] || {
      total_tasks: 0,
      completed_tasks: 0,
      overdue_tasks: 0,
      last_activity: null
    };

    // Get lifecycle transitions
    const transitionsResult = await database`
      SELECT id, client_id, from_stage, to_stage, reason, created_at, initiated_by
      FROM client_lifecycle_transitions
      WHERE client_id = ${clientId}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Calculate days in current stage
    const stageChanges = transitionsResult.filter(
      (t: any) => t.to_stage === client.status
    );
    let daysInStage = 0;

    if (stageChanges.length > 0) {
      const lastChange = new Date(stageChanges[0].created_at);
      const today = new Date();
      daysInStage = Math.ceil(
        (today.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else {
      // No transitions yet, use client creation date
      const createdDate = new Date(client.created_at);
      const today = new Date();
      daysInStage = Math.ceil(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Calculate days since last activity
    let daysSinceActivity = null;
    if (tasks.last_activity) {
      const lastActivity = new Date(tasks.last_activity);
      const today = new Date();
      daysSinceActivity = Math.ceil(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          stage: client.status,
          createdAt: client.created_at
        },
        metrics: {
          stage: client.status,
          daysInStage,
          lastActivityDate: tasks.last_activity,
          daysSinceActivity,
          totalTasks: tasks.total_tasks,
          completedTasks: tasks.completed_tasks,
          overdueTask: tasks.overdue_tasks
        },
        transitions: transitionsResult.map((t: any) => ({
          id: t.id,
          from: t.from_stage,
          to: t.to_stage,
          reason: t.reason,
          date: t.created_at,
          initiatedBy: t.initiated_by
        }))
      }
    });
  } catch (error) {
    console.error('Lifecycle retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve lifecycle information' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/[id]/lifecycle/transition
 * Move client to a new lifecycle stage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'JWT_SECRET is not configured' },
        { status: 500 }
      );
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const clientId = parseInt(params.id);
    const body = await request.json();
    const { toStage, reason } = body;

    if (!toStage) {
      return NextResponse.json(
        { error: 'toStage is required' },
        { status: 400 }
      );
    }

    const validStages = ['prospect', 'lead', 'active', 'inactive', 'archived'];
    if (!validStages.includes(toStage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      );
    }

    const database = getSql();

    // Get current client
    const clientResult = await database`
      SELECT id, status, user_id FROM clients
      WHERE id = ${clientId} AND user_id = ${decoded.userId}
    `;

    if (clientResult.length === 0) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const client = clientResult[0];
    const fromStage = client.status;

    if (fromStage === toStage) {
      return NextResponse.json(
        { error: 'Client is already in this stage' },
        { status: 400 }
      );
    }

    // Record the transition
    const transitionResult = await database`
      INSERT INTO client_lifecycle_transitions (
        client_id, from_stage, to_stage, reason, initiated_by, created_at
      ) VALUES (
        ${clientId}, ${fromStage}, ${toStage}, ${reason || null}, ${decoded.userId}, NOW()
      )
      RETURNING id, client_id, from_stage, to_stage, reason, created_at, initiated_by
    `;

    const transition = transitionResult[0];

    // Update client status
    await database`
      UPDATE clients
      SET status = ${toStage}, updated_at = NOW()
      WHERE id = ${clientId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        transition: {
          id: transition.id,
          clientId: transition.client_id,
          fromStage: transition.from_stage,
          toStage: transition.to_stage,
          reason: transition.reason,
          createdAt: transition.created_at,
          initiatedBy: transition.initiated_by
        }
      }
    });
  } catch (error) {
    console.error('Lifecycle transition error:', error);
    return NextResponse.json(
      { error: 'Failed to update lifecycle' },
      { status: 500 }
    );
  }
}
