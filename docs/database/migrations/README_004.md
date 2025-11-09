# Database Migration: User Profiles

This migration adds the `user_profiles` table to store user profile information including preferences and settings.

## To Apply This Migration

You have several options to run this migration:

### Option 1: Using Neon Console (Recommended)
1. Go to https://console.neon.tech/
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the contents of `004_create_user_profiles.sql`
5. Click "Run" to execute

### Option 2: Using psql Command Line
```bash
psql $DATABASE_URL -f docs/database/migrations/004_create_user_profiles.sql
```

### Option 3: Using Node.js Script
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const sql = neon(process.env.DATABASE_URL);
const migration = fs.readFileSync('docs/database/migrations/004_create_user_profiles.sql', 'utf8');
(async () => {
  await sql(migration);
  console.log('Migration completed successfully!');
})();
"
```

## What This Migration Does

- Creates `user_profiles` table with fields:
  - `id` - User identifier (VARCHAR)
  - `name` - User's full name
  - `email` - User's email address (unique)
  - `avatar` - Optional profile picture URL
  - `company` - Optional company name
  - `role` - Optional job role/title
  - `timezone` - User's timezone preference
  - `language` - User's language preference
  - `two_factor_enabled` - 2FA status
  - `email_notifications` - Email notification preference
  - `push_notifications` - Push notification preference
  - `marketing_emails` - Marketing email preference
  - `created_at` - Timestamp when profile was created
  - `updated_at` - Timestamp when profile was last updated

- Creates an index on `email` for faster lookups

## Verification

After running the migration, verify it worked:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_profiles'
);

-- View table structure
\d user_profiles
```

## Rollback

If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS user_profiles;
```
