import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { EmailSyncService } from '@/lib/email-sync-service';

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
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: number; id?: number };
  
  // Try both userId and id fields
  const userId = decoded.userId || decoded.id;
  if (!userId) {
    console.error('JWT token missing userId/id field:', decoded);
    throw new Error('JWT token does not contain user ID');
  }
  
  return userId;
}

/**
 * GET /api/emails
 * Get emails for the authenticated user with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    console.log('Fetching emails for userId:', userId);
    
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const contactId = searchParams.get('contactId');
    const isRead = searchParams.get('isRead');
    const threadId = searchParams.get('threadId');
    const search = searchParams.get('search');
    const integrationId = searchParams.get('integrationId');

    // Build query
    let whereConditions = [`i.user_id = ${userId}`];
    
    if (contactId) {
      whereConditions.push(`e.contact_id = ${contactId}`);
    }
    
    if (isRead !== null && isRead !== undefined) {
      whereConditions.push(`e.is_read = ${isRead === 'true'}`);
    }
    
    if (threadId) {
      whereConditions.push(`e.thread_id = '${threadId}'`);
    }
    
    if (integrationId) {
      whereConditions.push(`e.integration_id = ${integrationId}`);
    }
    
    if (search) {
      const searchTerm = search.replace(/'/g, "''"); // Escape single quotes
      whereConditions.push(`(
        e.subject ILIKE '%${searchTerm}%' OR 
        e.from_email ILIKE '%${searchTerm}%' OR 
        e.from_name ILIKE '%${searchTerm}%' OR 
        e.snippet ILIKE '%${searchTerm}%'
      )`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get emails
    const emails = await sql`
      SELECT 
        e.*,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name,
        i.name as integration_name,
        (SELECT COUNT(*) FROM emails e2 WHERE e2.thread_id = e.thread_id) as thread_count
      FROM emails e
      JOIN integrations i ON e.integration_id = i.id
      LEFT JOIN clients c ON e.contact_id = c.id
      WHERE ${sql.unsafe(whereClause)}
      ORDER BY e.sent_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM emails e
      JOIN integrations i ON e.integration_id = i.id
      WHERE ${sql.unsafe(whereClause)}
    `;

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Failed to fetch emails:', error);
    
    // Provide detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch emails',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/sync
 * Manually trigger email sync for a specific integration
 */
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const body = await request.json();
    const { integrationId } = body;

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const integration = await sql`
      SELECT id, credentials
      FROM integrations
      WHERE id = ${integrationId} AND user_id = ${userId} AND type = 'email' AND status = 'active'
    `;

    if (integration.length === 0) {
      return NextResponse.json(
        { error: 'Integration not found or not active' },
        { status: 404 }
      );
    }

    // Start sync
    const syncService = new EmailSyncService(
      integration[0].id,
      integration[0].credentials,
      userId
    );

    const result = await syncService.syncEmails();

    return NextResponse.json({
      success: result.success,
      messagesSynced: result.messagesSynced,
      error: result.error,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to sync emails:', error);
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
