import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

/**
 * GET /api/setup/fix-credentials-column
 * Fix the credentials column type from jsonb to text
 */
export async function GET(request: NextRequest) {
  try {
    const sql = getSql();
    
    console.log('Fixing integrations.credentials column type...');

    // Change credentials column from jsonb to text
    await sql`
      ALTER TABLE integrations 
      ALTER COLUMN credentials TYPE TEXT USING credentials::text
    `;

    console.log('Column type changed successfully');

    return NextResponse.json({
      success: true,
      message: 'Credentials column fixed successfully',
    });

  } catch (error) {
    console.error('Fix failed:', error);
    return NextResponse.json(
      { 
        error: 'Fix failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
