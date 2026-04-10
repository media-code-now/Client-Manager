import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

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
 * POST /api/setup/migrate
 * Run database migrations
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Running database migrations...');
    
    const sql = getSql();

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
