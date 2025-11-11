import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: number; id?: number };
  const userId = decoded.userId || decoded.id;
  if (!userId) {
    throw new Error('JWT token does not contain user ID');
  }
  return userId;
}

/**
 * GET /api/debug/check-emails
 * Check if emails exist and what the query is doing
 */
export async function GET(request: NextRequest) {
  try {
    const userId = verifyToken(request);

    // Check integrations
    const integrations = await sql`
      SELECT id, name, type, status 
      FROM integrations 
      WHERE user_id = ${userId}
    `;

    // Check emails count
    const emailCount = await sql`
      SELECT COUNT(*) as count
      FROM emails e
      JOIN integrations i ON e.integration_id = i.id
      WHERE i.user_id = ${userId}
    `;

    // Get sample emails
    const sampleEmails = await sql`
      SELECT 
        e.id,
        e.subject,
        e.from_email,
        e.sent_at,
        i.name as integration_name
      FROM emails e
      JOIN integrations i ON e.integration_id = i.id
      WHERE i.user_id = ${userId}
      ORDER BY e.sent_at DESC
      LIMIT 5
    `;

    return NextResponse.json({
      userId,
      integrations,
      emailCount: emailCount[0].count,
      sampleEmails,
    });

  } catch (error) {
    console.error('Debug check failed:', error);
    return NextResponse.json(
      { 
        error: 'Debug check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
