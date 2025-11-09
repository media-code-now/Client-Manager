const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createEmailTrackingTables() {
  console.log('📊 Creating email tracking tables...\n');

  try {
    console.log('📝 Creating tables...');
    
    // Create email_tracking_events table
    await sql`
      CREATE TABLE IF NOT EXISTS email_tracking_events (
        id SERIAL PRIMARY KEY,
        email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        tracking_id VARCHAR(100) UNIQUE NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        link_url TEXT,
        occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create email_tracking_links table
    await sql`
      CREATE TABLE IF NOT EXISTS email_tracking_links (
        id SERIAL PRIMARY KEY,
        email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
        tracking_id VARCHAR(100) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        tracked_url TEXT NOT NULL,
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        utm_content VARCHAR(255),
        utm_term VARCHAR(255),
        click_count INTEGER DEFAULT 0,
        first_clicked_at TIMESTAMP WITH TIME ZONE,
        last_clicked_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('✅ Tables created successfully\n');

    // Add tracking columns to emails table
    console.log('🔧 Adding tracking columns to emails table...');
    
    await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS tracking_pixel_id VARCHAR(100) UNIQUE`;
    await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0`;
    await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0`;
    await sql`ALTER TABLE emails ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0`;
    
    console.log('✅ Columns added successfully\n');

    // Create indexes
    console.log('📑 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tracking_events_email_id ON email_tracking_events(email_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tracking_events_tracking_id ON email_tracking_events(tracking_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tracking_events_type ON email_tracking_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tracking_events_occurred_at ON email_tracking_events(occurred_at DESC)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tracking_links_email_id ON email_tracking_links(email_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tracking_links_tracking_id ON email_tracking_links(tracking_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_tracking_pixel_id ON emails(tracking_pixel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_first_opened_at ON emails(first_opened_at DESC)`;
    
    console.log('✅ Indexes created successfully\n');

    // Create trigger function
    console.log('🔄 Creating triggers...');
    
    await sql`
      CREATE OR REPLACE FUNCTION update_email_tracking_links_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    await sql`DROP TRIGGER IF EXISTS update_email_tracking_links_updated_at ON email_tracking_links`;
    
    await sql`
      CREATE TRIGGER update_email_tracking_links_updated_at
      BEFORE UPDATE ON email_tracking_links
      FOR EACH ROW
      EXECUTE FUNCTION update_email_tracking_links_updated_at()
    `;
    
    console.log('✅ Triggers created successfully\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_tracking_events', 'email_tracking_links')
      ORDER BY table_name
    `;

    console.log('✅ Tables created:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');

    // Get column counts
    const trackingEventsColumns = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'email_tracking_events'
    `;
    console.log(`📊 email_tracking_events table: ${trackingEventsColumns[0].count} columns`);

    const trackingLinksColumns = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'email_tracking_links'
    `;
    console.log(`📊 email_tracking_links table: ${trackingLinksColumns[0].count} columns`);
    
    // Get updated emails column count
    const emailsColumns = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'emails'
    `;
    console.log(`📊 emails table (updated): ${emailsColumns[0].count} columns`);
    console.log('');

    // Get index counts
    const indexes = await sql`
      SELECT 
        tablename,
        COUNT(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('email_tracking_events', 'email_tracking_links', 'emails')
      GROUP BY tablename
      ORDER BY tablename
    `;

    console.log('📑 Indexes created:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.tablename}: ${idx.index_count} indexes`);
    });
    console.log('');

    console.log('✅ Email tracking setup complete!\n');
    console.log('📈 Features enabled:');
    console.log('   - Tracking pixel for email opens');
    console.log('   - Link click tracking with UTM parameters');
    console.log('   - Open and click analytics');
    console.log('   - Per-email performance metrics\n');

  } catch (error) {
    console.error('❌ Error creating email tracking tables:', error);
    process.exit(1);
  }
}

createEmailTrackingTables();
