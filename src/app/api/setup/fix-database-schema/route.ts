import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

/**
 * POST /api/setup/fix-database-schema
 * Comprehensive fix for all database schema issues
 */
export async function GET() {
  try {
    console.log('Starting comprehensive database schema fix...');
    
    // 1. Fix integrations.user_id type (VARCHAR to INTEGER)
    console.log('Step 1: Fixing integrations.user_id type...');
    await sql`
      ALTER TABLE integrations 
      ALTER COLUMN user_id TYPE INTEGER 
      USING user_id::integer
    `;
    console.log('✓ integrations.user_id is now INTEGER');

    // 2. Add user_id to clients if it doesn't exist
    console.log('Step 2: Adding user_id to clients table...');
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS user_id INTEGER
    `;
    console.log('✓ clients.user_id column added');

    // 3. Populate user_id for existing clients
    console.log('Step 3: Populating user_id for existing clients...');
    await sql`
      UPDATE clients 
      SET user_id = 1 
      WHERE user_id IS NULL
    `;
    console.log('✓ Existing clients now have user_id');

    // 4. Set NOT NULL constraint on clients.user_id
    console.log('Step 4: Setting NOT NULL constraint...');
    await sql`
      ALTER TABLE clients 
      ALTER COLUMN user_id SET NOT NULL
    `;
    console.log('✓ clients.user_id is now NOT NULL');

    // 5. Create index on clients.user_id
    console.log('Step 5: Creating index on clients.user_id...');
    await sql`
      CREATE INDEX IF NOT EXISTS clients_user_id_idx 
      ON clients(user_id)
    `;
    console.log('✓ Index created on clients.user_id');

    // 6. Add first_name column if it doesn't exist
    console.log('Step 6: Adding first_name to clients...');
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS first_name TEXT
    `;
    console.log('✓ clients.first_name column added');

    // 7. Add last_name column if it doesn't exist
    console.log('Step 7: Adding last_name to clients...');
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS last_name TEXT
    `;
    console.log('✓ clients.last_name column added');

    // 8. Add email column if it doesn't exist
    console.log('Step 8: Adding email to clients...');
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS email TEXT
    `;
    console.log('✓ clients.email column added');

    // 9. Migrate existing name data to first_name/last_name if needed
    console.log('Step 9: Migrating name data...');
    await sql`
      UPDATE clients 
      SET 
        first_name = COALESCE(first_name, SPLIT_PART(name, ' ', 1)),
        last_name = COALESCE(last_name, SUBSTRING(name FROM POSITION(' ' IN name) + 1))
      WHERE first_name IS NULL OR last_name IS NULL
    `;
    console.log('✓ Name data migrated');

    // 10. Add source column if it doesn't exist (for tracking where client came from)
    console.log('Step 10: Adding source column...');
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
    `;
    console.log('✓ clients.source column added');

    // 11. Ensure status column exists with proper type
    console.log('Step 11: Checking status column...');
    await sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    `;
    console.log('✓ clients.status column verified');

    // 12. Create index on clients.email for faster lookups
    console.log('Step 12: Creating index on clients.email...');
    await sql`
      CREATE INDEX IF NOT EXISTS clients_email_idx 
      ON clients(LOWER(email))
    `;
    console.log('✓ Index created on clients.email');

    console.log('✅ All database schema fixes completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database schema fixed successfully',
      fixes: [
        'integrations.user_id converted to INTEGER',
        'clients.user_id column added and populated',
        'clients.first_name column added',
        'clients.last_name column added',
        'clients.email column added',
        'clients.source column added',
        'clients.status column verified',
        'Name data migrated from name to first_name/last_name',
        'Indexes created for performance',
        'All constraints applied'
      ]
    });

  } catch (error) {
    console.error('Failed to fix database schema:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to fix database schema',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}
