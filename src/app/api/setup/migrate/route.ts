import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

/**
 * POST /api/setup/migrate
 * Run database migrations
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Running database migrations...');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '001_create_integrations_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration SQL...');
    
    // Execute the migration
    await sql.unsafe(migrationSQL);

    console.log('Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migrations completed successfully',
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
