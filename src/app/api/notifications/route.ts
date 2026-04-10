import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let sql: any = null;

function getSql() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL is not set');
    sql = neon(dbUrl);
  }
  return sql;
}

interface DecodedToken {
  uuid: string;
  id?: number;
  email: string;
  role: string;
}

function verifyAuth(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return null;
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    return decoded.uuid || decoded.id?.toString() || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  const userId = verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sqlFunc = getSql();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (params?.id) {
      const result = await sqlFunc(
        'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
        [parseInt(params.id), userId]
      );
      if (!result?.length) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(result[0]);
    }

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (filter && ['pending', 'read', 'dismissed', 'sent', 'failed'].includes(filter)) {
      query += ` AND status = $${paramIndex}`;
      queryParams.push(filter);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await sqlFunc(query, queryParams);

    const countQuery = filter
      ? 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND status = $2'
      : 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1';
    
    const countParams = filter ? [userId, filter] : [userId];
    const countResult = await sqlFunc(countQuery, countParams);

    return NextResponse.json({
      notifications: result || [],
      total: parseInt(countResult?.[0]?.count || '0'),
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  const userId = verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (params?.id) {
      return NextResponse.json({ error: 'Use PATCH to update' }, { status: 400 });
    }

    const {
      ruleId,
      triggerType,
      notificationType,
      subject,
      message,
      relatedEntityType,
      relatedEntityId,
      priority,
      deliveryMethods,
      metadata,
    } = body;

    if (!message || !notificationType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const sqlFunc = getSql();
    const result = await sqlFunc(
      `INSERT INTO notifications (
        user_id, rule_id, trigger_type, notification_type, subject, message,
        related_entity_type, related_entity_id, priority, delivery_methods,
        status, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        userId,
        ruleId || null,
        triggerType || 'custom',
        notificationType,
        subject || null,
        message,
        relatedEntityType || null,
        relatedEntityId || null,
        priority || 'normal',
        JSON.stringify(deliveryMethods || ['in_app']),
        'pending',
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json(result?.[0] || {}, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  const userId = verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params || {};
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const body = await request.json();
    const sqlFunc = getSql();

    const checkResult = await sqlFunc(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [parseInt(id), userId]
    );

    if (!checkResult?.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [parseInt(id), userId];
    let paramIndex = 3;

    if (body.status) {
      updates.push(`status = $${paramIndex}`);
      values.push(body.status);
      paramIndex++;
      if (body.status === 'read') {
        updates.push('read_at = NOW()');
      }
    }

    if (body.message !== undefined) {
      updates.push(`message = $${paramIndex}`);
      values.push(body.message);
      paramIndex++;
    }

    if (body.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex}`);
      values.push(JSON.stringify(body.metadata));
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');

    const result = await sqlFunc(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      values
    );

    return NextResponse.json(result?.[0] || {});
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  const userId = verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params || {};
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sqlFunc = getSql();
    const result = await sqlFunc(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [parseInt(id), userId]
    );

    if (!result?.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
