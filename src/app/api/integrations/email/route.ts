import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { EmailService, EmailIntegrationFactory } from '@/lib/email-service';
import { encryptEmailCredentials, EmailCredentials, maskEmailCredentials } from '@/lib/encryption';

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
 * GET /api/integrations/email
 * List user's email integrations
 */
export async function GET(request: NextRequest) {
  try {
    const userId = verifyToken(request);

    const integrations = await sql`
      SELECT 
        id, 
        name, 
        status, 
        config,
        created_at,
        updated_at
      FROM integrations 
      WHERE user_id = ${userId} AND type = 'email'
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Failed to fetch email integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/email
 * Create new email integration
 */
export async function POST(request: NextRequest) {
  try {
    const userId = verifyToken(request);
    const body = await request.json();
    
    console.log('Creating email integration for user:', userId);
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { name, provider, credentials } = body;

    if (!name || !provider || !credentials) {
      return NextResponse.json(
        { error: 'Name, provider, and credentials are required' },
        { status: 400 }
      );
    }

    // Validate credentials
    const validation = EmailIntegrationFactory.validateCredentials(credentials);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid credentials', details: validation.errors },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptedCredentials = encryptEmailCredentials(credentials);
    console.log('Credentials encrypted successfully');

    // Test connection before saving
    console.log('Testing email connection...');
    const emailService = new EmailService(encryptedCredentials);
    const testResult = await emailService.testConnection();
    console.log('Connection test result:', testResult);

    if (!testResult.success) {
      return NextResponse.json(
        { 
          error: 'Email connection test failed', 
          details: testResult.error,
          testResult 
        },
        { status: 400 }
      );
    }

    // Save to database
    const result = await sql`
      INSERT INTO integrations (
        user_id, 
        type, 
        name, 
        status, 
        config,
        credentials
      ) VALUES (
        ${userId},
        'email',
        ${name},
        'active',
        ${JSON.stringify({ provider, email: credentials.email })}::jsonb,
        ${encryptedCredentials}
      )
      RETURNING id, name, status, config, created_at
    `;

    // Log the connection
    await sql`
      INSERT INTO integration_logs (
        integration_id,
        event_type,
        status,
        data
      ) VALUES (
        ${result[0].id},
        'connection_established',
        'success',
        ${JSON.stringify({ 
          provider, 
          email: credentials.email,
          testResult: testResult.details 
        })}::jsonb
      )
    `;

    return NextResponse.json({
      success: true,
      integration: result[0],
      testResult
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create email integration:', error);
    
    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Failed to create integration',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/integrations/email/[id]
 * Update email integration
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = verifyToken(request);
    const integrationId = parseInt(params.id);
    const body = await request.json();

    const { name, credentials } = body;

    // Verify ownership
    const existing = await sql`
      SELECT id FROM integrations 
      WHERE id = ${integrationId} AND user_id = ${userId} AND type = 'email'
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    
    if (name) {
      updateData.name = name;
    }

    if (credentials) {
      // Validate credentials
      const validation = EmailIntegrationFactory.validateCredentials(credentials);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid credentials', details: validation.errors },
          { status: 400 }
        );
      }

      // Test connection
      const encryptedCredentials = encryptEmailCredentials(credentials);
      const emailService = new EmailService(encryptedCredentials);
      const testResult = await emailService.testConnection();

      if (!testResult.success) {
        return NextResponse.json(
          { 
            error: 'Email connection test failed', 
            details: testResult.error,
            testResult 
          },
          { status: 400 }
        );
      }

      updateData.credentials = encryptedCredentials;
      updateData.config = JSON.stringify({ 
        provider: credentials.provider, 
        email: credentials.email 
      });
    }

    // Update integration
    const result = await sql`
      UPDATE integrations 
      SET 
        name = COALESCE(${updateData.name}, name),
        config = COALESCE(${updateData.config}::jsonb, config),
        credentials = COALESCE(${updateData.credentials}, credentials),
        updated_at = NOW()
      WHERE id = ${integrationId} AND user_id = ${userId}
      RETURNING id, name, status, config, updated_at
    `;

    return NextResponse.json({
      success: true,
      integration: result[0]
    });

  } catch (error) {
    console.error('Failed to update email integration:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/email/[id]
 * Delete email integration
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = verifyToken(request);
    const integrationId = parseInt(params.id);

    // Verify ownership and delete
    const result = await sql`
      DELETE FROM integrations 
      WHERE id = ${integrationId} AND user_id = ${userId} AND type = 'email'
      RETURNING id, name
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Log the disconnection
    await sql`
      INSERT INTO integration_logs (
        integration_id,
        event_type,
        status,
        data
      ) VALUES (
        ${integrationId},
        'connection_removed',
        'success',
        ${JSON.stringify({ removed_at: new Date().toISOString() })}::jsonb
      )
    `;

    return NextResponse.json({
      success: true,
      message: `Email integration "${result[0].name}" removed successfully`
    });

  } catch (error) {
    console.error('Failed to delete email integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}