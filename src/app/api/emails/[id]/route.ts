import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


const sql = neon(process.env.DATABASE_URL!);

/**
 * Verify JWT token and get user ID
 */
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
  return decoded.userId;
}

/**
 * GET /api/emails/[id]
 * Get detailed email information including full body and attachments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = verifyToken(request);
    const emailId = parseInt(params.id);

    // Get email with related data
    const email = await sql`
      SELECT 
        e.*,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        c.email as contact_email,
        c.phone as contact_phone,
        i.name as integration_name,
        i.config as integration_config
      FROM emails e
      JOIN integrations i ON e.integration_id = i.id
      LEFT JOIN clients c ON e.contact_id = c.id
      WHERE e.id = ${emailId} AND i.user_id = ${userId}
      LIMIT 1
    `;

    if (email.length === 0) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Get attachments
    const attachments = await sql`
      SELECT *
      FROM email_attachments
      WHERE email_id = ${emailId}
      ORDER BY created_at
    `;

    // Get thread emails if part of a thread
    let threadEmails: any[] = [];
    if (email[0].thread_id) {
      threadEmails = await sql`
        SELECT 
          id,
          from_email,
          from_name,
          subject,
          snippet,
          sent_at,
          is_read
        FROM emails
        WHERE thread_id = ${email[0].thread_id}
        AND id != ${emailId}
        ORDER BY sent_at ASC
      `;
    }

    return NextResponse.json({
      email: email[0],
      attachments,
      thread: threadEmails,
    });

  } catch (error) {
    console.error('Failed to fetch email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/emails/[id]
 * Update email properties (mark as read, star, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = verifyToken(request);
    const emailId = parseInt(params.id);
    const body = await request.json();

    // Verify ownership
    const email = await sql`
      SELECT e.id
      FROM emails e
      JOIN integrations i ON e.integration_id = i.id
      WHERE e.id = ${emailId} AND i.user_id = ${userId}
    `;

    if (email.length === 0) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (typeof body.isRead === 'boolean') {
      updates.push('is_read = $' + (values.length + 1));
      values.push(body.isRead);
    }

    if (typeof body.isStarred === 'boolean') {
      updates.push('is_starred = $' + (values.length + 1));
      values.push(body.isStarred);
    }

    if (typeof body.isImportant === 'boolean') {
      updates.push('is_important = $' + (values.length + 1));
      values.push(body.isImportant);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Build the update parts for SQL
    const setParts = [];
    if (typeof body.isRead === 'boolean') {
      setParts.push(`is_read = ${body.isRead}`);
    }
    if (typeof body.isStarred === 'boolean') {
      setParts.push(`is_starred = ${body.isStarred}`);
    }
    if (typeof body.isImportant === 'boolean') {
      setParts.push(`is_important = ${body.isImportant}`);
    }

    // Update email using neon sql template
    const result = await sql`
      UPDATE emails
      SET ${sql.unsafe(setParts.join(', '))}, updated_at = NOW()
      WHERE id = ${emailId}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      email: result[0],
    });

  } catch (error) {
    console.error('Failed to update email:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails/[id]
 * Delete an email
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = verifyToken(request);
    const emailId = parseInt(params.id);

    // Verify ownership and delete
    const result = await sql`
      DELETE FROM emails e
      USING integrations i
      WHERE e.integration_id = i.id
      AND e.id = ${emailId}
      AND i.user_id = ${userId}
      RETURNING e.id, e.subject
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email deleted successfully',
    });

  } catch (error) {
    console.error('Failed to delete email:', error);
    return NextResponse.json(
      { error: 'Failed to delete email' },
      { status: 500 }
    );
  }
}
