import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/setup/create-emails-table
 * Create the emails table for storing synced emails
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Creating emails table...');

    // Create emails table
    await sql`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        integration_id INTEGER NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
        contact_id INTEGER,
        message_id TEXT NOT NULL,
        thread_id TEXT,
        from_email TEXT NOT NULL,
        from_name TEXT,
        to_email TEXT[],
        cc_email TEXT[],
        bcc_email TEXT[],
        subject TEXT,
        snippet TEXT,
        body_text TEXT,
        body_html TEXT,
        sent_at TIMESTAMPTZ NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        has_attachments BOOLEAN DEFAULT FALSE,
        labels TEXT[],
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT emails_message_id_unique UNIQUE (integration_id, message_id)
      )
    `;

    console.log('Created emails table');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS emails_integration_id_idx ON emails(integration_id)`;
    await sql`CREATE INDEX IF NOT EXISTS emails_contact_id_idx ON emails(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS emails_thread_id_idx ON emails(thread_id)`;
    await sql`CREATE INDEX IF NOT EXISTS emails_from_email_idx ON emails(from_email)`;
    await sql`CREATE INDEX IF NOT EXISTS emails_sent_at_idx ON emails(sent_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS emails_is_read_idx ON emails(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS emails_subject_idx ON emails USING gin(to_tsvector('english', subject))`;

    console.log('Created indexes');

    // Create email_attachments table
    await sql`
      CREATE TABLE IF NOT EXISTS email_attachments (
        id SERIAL PRIMARY KEY,
        email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        content_type TEXT,
        size INTEGER,
        attachment_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    console.log('Created email_attachments table');

    await sql`CREATE INDEX IF NOT EXISTS email_attachments_email_id_idx ON email_attachments(email_id)`;

    console.log('All email tables created successfully');

    return NextResponse.json({
      success: true,
      message: 'Email tables created successfully',
    });

  } catch (error) {
    console.error('Create tables failed:', error);
    return NextResponse.json(
      { 
        error: 'Create tables failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
