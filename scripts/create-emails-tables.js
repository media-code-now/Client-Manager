const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createEmailsTables() {
  console.log('🗄️  Creating emails tables...\n');

  try {
    console.log('📝 Creating tables...');
    
    // Create tables directly with SQL template strings
    await sql`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        integration_id VARCHAR(255) NOT NULL,
        contact_id INTEGER,
        message_id VARCHAR(500) UNIQUE NOT NULL,
        thread_id VARCHAR(500),
        in_reply_to VARCHAR(500),
        "references" TEXT,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255),
        to_emails TEXT NOT NULL,
        cc_emails TEXT,
        bcc_emails TEXT,
        subject TEXT,
        body_text TEXT,
        body_html TEXT,
        snippet TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        is_starred BOOLEAN DEFAULT FALSE,
        is_important BOOLEAN DEFAULT FALSE,
        is_draft BOOLEAN DEFAULT FALSE,
        is_sent BOOLEAN DEFAULT FALSE,
        has_attachments BOOLEAN DEFAULT FALSE,
        attachments JSONB,
        sent_at TIMESTAMP WITH TIME ZONE,
        received_at TIMESTAMP WITH TIME ZONE,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        labels JSONB,
        folder VARCHAR(255),
        size_bytes INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES clients(id) ON DELETE SET NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS email_sync_state (
        id SERIAL PRIMARY KEY,
        integration_id VARCHAR(255) NOT NULL UNIQUE,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        last_message_id VARCHAR(500),
        last_history_id VARCHAR(100),
        sync_token TEXT,
        sync_status VARCHAR(50) DEFAULT 'idle',
        sync_error TEXT,
        messages_synced INTEGER DEFAULT 0,
        last_sync_duration_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS email_attachments (
        id SERIAL PRIMARY KEY,
        email_id INTEGER NOT NULL,
        filename VARCHAR(500) NOT NULL,
        content_type VARCHAR(255),
        size_bytes INTEGER,
        attachment_id VARCHAR(255),
        storage_path TEXT,
        is_inline BOOLEAN DEFAULT FALSE,
        content_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
      )
    `;
    
    console.log('✅ Tables created successfully\n');

    // Create indexes
    console.log('📑 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_integration_id ON emails(integration_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_from_email ON emails(from_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_emails_synced_at ON emails(synced_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id)`;
    
    console.log('✅ Indexes created successfully\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('emails', 'email_sync_state', 'email_attachments')
      ORDER BY table_name
    `;

    console.log('✅ Tables created:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');

    // Get column counts
    const emailsColumns = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'emails'
    `;
    console.log(`📊 emails table: ${emailsColumns[0].count} columns`);

    const syncStateColumns = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'email_sync_state'
    `;
    console.log(`📊 email_sync_state table: ${syncStateColumns[0].count} columns`);

    const attachmentsColumns = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'email_attachments'
    `;
    console.log(`📊 email_attachments table: ${attachmentsColumns[0].count} columns`);
    console.log('');

    // Get index counts
    const indexes = await sql`
      SELECT 
        tablename,
        COUNT(*) as index_count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('emails', 'email_sync_state', 'email_attachments')
      GROUP BY tablename
      ORDER BY tablename
    `;

    console.log('📑 Indexes created:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.tablename}: ${idx.index_count} indexes`);
    });
    console.log('');

    console.log('✅ Email tables setup complete!\n');
    console.log('📧 Ready to sync emails from connected accounts');

  } catch (error) {
    console.error('❌ Error creating emails tables:', error);
    process.exit(1);
  }
}

createEmailsTables();
