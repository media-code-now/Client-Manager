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

interface TimeEntryRequest {
  taskId: number;
  hoursWorked: number;
  date: string;
  notes?: string;
  billable: boolean;
}

interface DecodedToken {
  userId: string;
  email: string;
}

/**
 * POST /api/tasks/time-entries
 * Create a new time entry
 * 
 * Request body:
 * {
 *   "taskId": 1,
 *   "hoursWorked": 2.5,
 *   "date": "2025-01-15",
 *   "notes": "Fixed critical bug",
 *   "billable": true
 * }
 */
export async function POST(request: NextRequest) {
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

    const body: TimeEntryRequest = await request.json();
    const { taskId, hoursWorked, date, notes, billable } = body;

    // Validate inputs
    if (!taskId || !hoursWorked || !date) {
      return NextResponse.json(
        { error: 'taskId, hoursWorked, and date are required' },
        { status: 400 }
      );
    }

    if (hoursWorked <= 0 || hoursWorked > 24) {
      return NextResponse.json(
        { error: 'Hours worked must be between 0 and 24' },
        { status: 400 }
      );
    }

    const entryDate = new Date(date);
    const today = new Date();

    if (entryDate > today) {
      return NextResponse.json(
        { error: 'Cannot log time in the future' },
        { status: 400 }
      );
    }

    const sql = await getSql();

    // Verify task exists and belongs to user
    const taskResult = await sql`
      SELECT t.id, t.user_id FROM tasks t
      WHERE t.id = ${taskId} AND t.user_id = ${decoded.userId}
    `;

    if (taskResult.length === 0) {
      return NextResponse.json(
        { error: 'Task not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Create time entry
    const result = await sql`
      INSERT INTO task_time_entries (task_id, user_id, date, hours_worked, notes, billable, created_at)
      VALUES (${taskId}, ${decoded.userId}, ${date}, ${hoursWorked}, ${notes || null}, ${billable}, NOW())
      RETURNING id, task_id, user_id, date, hours_worked, notes, billable, created_at
    `;

    const timeEntry = result[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          id: timeEntry.id,
          taskId: timeEntry.task_id,
          userId: timeEntry.user_id,
          date: timeEntry.date,
          hoursWorked: timeEntry.hours_worked,
          notes: timeEntry.notes,
          billable: timeEntry.billable,
          createdAt: timeEntry.created_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Time entry creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/time-entries?taskId=1&startDate=2025-01-01&endDate=2025-01-31
 * Retrieve time entries for a task
 * 
 * Query parameters:
 * - taskId: (required) The task ID to filter by
 * - startDate: (optional) ISO date string
 * - endDate: (optional) ISO date string
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId query parameter is required' },
        { status: 400 }
      );
    }

    const sql = await getSql();

    // Verify task exists and belongs to user
    const taskResult = await sql`
      SELECT t.id, t.user_id FROM tasks t
      WHERE t.id = ${parseInt(taskId)} AND t.user_id = ${decoded.userId}
    `;

    if (taskResult.length === 0) {
      return NextResponse.json(
        { error: 'Task not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Build query with optional date filtering
    let query = sql`
      SELECT id, task_id, user_id, date, hours_worked, notes, billable, created_at
      FROM task_time_entries
      WHERE task_id = ${parseInt(taskId)} AND user_id = ${decoded.userId}
    `;

    if (startDate) {
      query = sql`
        SELECT id, task_id, user_id, date, hours_worked, notes, billable, created_at
        FROM task_time_entries
        WHERE task_id = ${parseInt(taskId)} AND user_id = ${decoded.userId} AND date >= ${startDate}
      `;
    }

    if (endDate) {
      query = sql`
        SELECT id, task_id, user_id, date, hours_worked, notes, billable, created_at
        FROM task_time_entries
        WHERE task_id = ${parseInt(taskId)} AND user_id = ${decoded.userId} AND date >= ${startDate || '1900-01-01'} AND date <= ${endDate}
      `;
    }

    const entries = await query;

    // Calculate summary
    const totalHours = entries.reduce((sum: number, e: any) => sum + e.hours_worked, 0);
    const billableHours = entries
      .filter((e: any) => e.billable)
      .reduce((sum: number, e: any) => sum + e.hours_worked, 0);

    return NextResponse.json({
      success: true,
      data: {
        entries: entries.map((e: any) => ({
          id: e.id,
          taskId: e.task_id,
          userId: e.user_id,
          date: e.date,
          hoursWorked: e.hours_worked,
          notes: e.notes,
          billable: e.billable,
          createdAt: e.created_at
        })),
        summary: {
          totalHours,
          billableHours,
          nonBillableHours: totalHours - billableHours,
          entriesCount: entries.length
        }
      }
    });
  } catch (error) {
    console.error('Time entries retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve time entries' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/time-entries/[entryId]
 * Delete a time entry
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json(
        { error: 'entryId query parameter is required' },
        { status: 400 }
      );
    }

    const sql = await getSql();

    // Verify entry exists and belongs to user
    const entryResult = await sql`
      SELECT id, user_id FROM task_time_entries
      WHERE id = ${parseInt(entryId)} AND user_id = ${decoded.userId}
    `;

    if (entryResult.length === 0) {
      return NextResponse.json(
        { error: 'Time entry not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Delete entry
    await sql`
      DELETE FROM task_time_entries
      WHERE id = ${parseInt(entryId)} AND user_id = ${decoded.userId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Time entry deleted successfully'
    });
  } catch (error) {
    console.error('Time entry deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete time entry' },
      { status: 500 }
    );
  }
}
