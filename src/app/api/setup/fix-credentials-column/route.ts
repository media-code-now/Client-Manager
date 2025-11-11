import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/setup/fix-credentials-column
 * Fix the credentials column type from jsonb to text
 */
export async function GET(request: NextRequest) {
  try {
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
