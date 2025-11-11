import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/setup/recreate-integrations
 * Drop and recreate integrations tables with correct schema
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Recreating integrations tables...');

    // Drop existing tables
    await sql`DROP TABLE IF EXISTS integration_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS integrations CASCADE`;

    console.log('Dropped existing tables');

    // Create integrations table with correct schema
    await sql`
      CREATE TABLE integrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('email', 'calendar', 'other')),
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
        config JSONB DEFAULT '{}'::jsonb,
        credentials TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT integrations_user_name_unique UNIQUE (user_id, name)
      )
    `;

    console.log('Created integrations table');

    // Create integration_logs table
    await sql`
      CREATE TABLE integration_logs (
        id SERIAL PRIMARY KEY,
        integration_id INTEGER NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
        data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    console.log('Created integration_logs table');

    // Create indexes
    await sql`CREATE INDEX integrations_user_id_idx ON integrations(user_id)`;
    await sql`CREATE INDEX integrations_type_idx ON integrations(type)`;
    await sql`CREATE INDEX integrations_status_idx ON integrations(status)`;
    await sql`CREATE INDEX integration_logs_integration_id_idx ON integration_logs(integration_id)`;
    await sql`CREATE INDEX integration_logs_created_at_idx ON integration_logs(created_at DESC)`;

    console.log('Created indexes');

    return NextResponse.json({
      success: true,
      message: 'Integrations tables recreated successfully',
    });

  } catch (error) {
    console.error('Recreate failed:', error);
    return NextResponse.json(
      { 
        error: 'Recreate failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
