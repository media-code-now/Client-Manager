import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/setup/check-tables
 * Check if integrations tables exist
 */
export async function GET(request: NextRequest) {
  try {
    // Check if integrations table exists
    const tableCheck = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('integrations', 'integration_logs')
      ORDER BY table_name, ordinal_position
    `;

    return NextResponse.json({
      success: true,
      tables: tableCheck,
    });

  } catch (error) {
    console.error('Check failed:', error);
    return NextResponse.json(
      { 
        error: 'Check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
