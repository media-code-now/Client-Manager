#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

async function createIntegrationsTables() {
  try {
    loadEnv();

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      process.exit(1);
    }

    console.log('🔄 Creating integrations tables...\n');

    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    // Create integrations table
    console.log('Creating integrations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'disconnected',
        config JSONB DEFAULT '{}',
        credentials JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        connected_at TIMESTAMP,
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ integrations table created');

    // Create integration_logs table
    console.log('Creating integration_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS integration_logs (
        id VARCHAR(255) PRIMARY KEY,
        integration_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        message TEXT,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ integration_logs table created');

    // Create webhooks table
    console.log('Creating webhooks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id VARCHAR(255) PRIMARY KEY,
        integration_id VARCHAR(255),
        url TEXT NOT NULL,
        secret VARCHAR(255),
        events TEXT[],
        status VARCHAR(20) DEFAULT 'active',
        last_triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ webhooks table created');

    // Create integration_data table
    console.log('Creating integration_data table...');
    await sql`
      CREATE TABLE IF NOT EXISTS integration_data (
        id VARCHAR(255) PRIMARY KEY,
        integration_id VARCHAR(255) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        external_id VARCHAR(255),
        data JSONB NOT NULL,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ integration_data table created');

    // Create indexes
    console.log('\nCreating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_integration_id ON webhooks(integration_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integration_data_integration_id ON integration_data(integration_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integration_data_data_type ON integration_data(data_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_integration_data_external_id ON integration_data(external_id)`;
    console.log('✅ All indexes created');

    // Verify tables
    console.log('\n📋 Verifying tables...');
    const result = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename LIKE 'integration%' OR tablename = 'webhooks'
      ORDER BY tablename
    `;

    console.log('Tables created:');
    result.forEach(row => {
      console.log(`  ✓ ${row.tablename}`);
    });

    console.log('\n✅ Integration tables migration completed successfully!');
    console.log('You can now use the Integrations feature in the app.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createIntegrationsTables();
