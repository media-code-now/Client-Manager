import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/setup/fix-user-id-types
 * Fix user_id column types to be consistent integers
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Fixing user_id column types...');

    // Fix integrations.user_id to INTEGER
    await sql`
      ALTER TABLE integrations 
      ALTER COLUMN user_id TYPE INTEGER USING user_id::integer
    `;
    console.log('Fixed integrations.user_id');

    // Add user_id to clients table if it doesn't exist
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS user_id INTEGER
    `;
    console.log('Added user_id to clients table');

    // Update existing clients to have user_id = 1 (assuming single user for now)
    await sql`
      UPDATE clients 
      SET user_id = 1 
      WHERE user_id IS NULL
    `;
    console.log('Updated existing clients with user_id');

    // Make user_id NOT NULL after populating
    await sql`
      ALTER TABLE clients 
      ALTER COLUMN user_id SET NOT NULL
    `;
    console.log('Set user_id as NOT NULL');

    // Add index
    await sql`
      CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id)
    `;
    console.log('Created index on clients.user_id');

    return NextResponse.json({
      success: true,
      message: 'user_id columns fixed successfully',
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
