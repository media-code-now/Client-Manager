const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createEmailWorkflowsTables() {
  console.log('📊 Creating email workflows and automation tables...\n');

  try {
    // Create email_workflows table
    console.log('📝 Creating email_workflows table...');
    await sql`
      CREATE TABLE IF NOT EXISTS email_workflows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ email_workflows table created\n');

    // Create workflow_triggers table
    console.log('📝 Creating workflow_triggers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_triggers (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
        trigger_type VARCHAR(100) NOT NULL,
        trigger_config JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ workflow_triggers table created\n');

    // Create workflow_conditions table
    console.log('📝 Creating workflow_conditions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_conditions (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
        condition_type VARCHAR(100) NOT NULL,
        operator VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ workflow_conditions table created\n');

    // Create workflow_actions table
    console.log('📝 Creating workflow_actions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_actions (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        action_config JSONB NOT NULL,
        execution_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ workflow_actions table created\n');

    // Create workflow_executions table
    console.log('📝 Creating workflow_executions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
        trigger_event_id INTEGER,
        trigger_type VARCHAR(100) NOT NULL,
        trigger_data JSONB,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        actions_executed INTEGER DEFAULT 0,
        actions_total INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ workflow_executions table created\n');

    // Create workflow_action_logs table
    console.log('📝 Creating workflow_action_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS workflow_action_logs (
        id SERIAL PRIMARY KEY,
        execution_id INTEGER NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
        action_id INTEGER NOT NULL REFERENCES workflow_actions(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        action_config JSONB,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        result JSONB,
        error_message TEXT,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ workflow_action_logs table created\n');

    // Create email_templates table
    console.log('📝 Creating email_templates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        body_text TEXT,
        variables JSONB,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ email_templates table created\n');

    // Create scheduled_followups table
    console.log('📝 Creating scheduled_followups table...');
    await sql`
      CREATE TABLE IF NOT EXISTS scheduled_followups (
        id SERIAL PRIMARY KEY,
        original_email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
        workflow_id INTEGER REFERENCES email_workflows(id) ON DELETE SET NULL,
        contact_id INTEGER,
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        days_after_original INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        executed_at TIMESTAMP WITH TIME ZONE,
        execution_result JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ scheduled_followups table created\n');

    // Add columns to clients table
    console.log('🔧 Adding automation columns to clients table...');
    try {
      await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_stage VARCHAR(100) DEFAULT 'new'`;
      await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE`;
      await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0`;
      console.log('✅ Columns added to clients table\n');
    } catch (error) {
      console.log('ℹ️  Columns may already exist in clients table\n');
    }

    // Create indexes
    console.log('📑 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON email_workflows(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON email_workflows(is_active)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_triggers_workflow_id ON workflow_triggers(workflow_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_triggers_type ON workflow_triggers(trigger_type)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_conditions_workflow_id ON workflow_conditions(workflow_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_actions_workflow_id ON workflow_actions(workflow_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_actions_order ON workflow_actions(workflow_id, execution_order)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_executions_created_at ON workflow_executions(created_at DESC)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_action_logs_execution_id ON workflow_action_logs(execution_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_action_logs_action_id ON workflow_action_logs(action_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_templates_user_id ON email_templates(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_templates_is_active ON email_templates(is_active)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_followups_scheduled_for ON scheduled_followups(scheduled_for)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_followups_status ON scheduled_followups(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_followups_email_id ON scheduled_followups(original_email_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_lead_stage ON clients(lead_stage)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_last_contacted ON clients(last_contacted_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_engagement_score ON clients(engagement_score DESC)`;
    
    console.log('✅ Indexes created\n');

    // Create triggers
    console.log('🔄 Creating database triggers...');
    
    await sql`
      CREATE OR REPLACE FUNCTION update_workflow_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_workflow_timestamp ON email_workflows
    `;
    await sql`
      CREATE TRIGGER trigger_update_workflow_timestamp
      BEFORE UPDATE ON email_workflows
      FOR EACH ROW
      EXECUTE FUNCTION update_workflow_updated_at()
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS trigger_update_template_timestamp ON email_templates
    `;
    await sql`
      CREATE TRIGGER trigger_update_template_timestamp
      BEFORE UPDATE ON email_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_workflow_updated_at()
    `;
    
    console.log('✅ Triggers created\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'email_workflows',
        'workflow_triggers',
        'workflow_conditions',
        'workflow_actions',
        'workflow_executions',
        'workflow_action_logs',
        'email_templates',
        'scheduled_followups'
      )
      ORDER BY table_name
    `;
    
    console.log('✅ Tables created:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log();

    // Get table stats
    for (const table of tables) {
      const count = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = ${table.table_name}
      `;
      const indexCount = await sql`
        SELECT COUNT(*) as count 
        FROM pg_indexes 
        WHERE tablename = ${table.table_name}
      `;
      console.log(`📊 ${table.table_name}: ${count[0].count} columns, ${indexCount[0].count} indexes`);
    }

    // Check clients table columns
    const clientColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'clients'
      AND column_name IN ('lead_stage', 'last_contacted_at', 'engagement_score')
      ORDER BY column_name
    `;
    
    console.log('\n📊 clients table automation columns:');
    clientColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ Email workflows and automation setup complete!');
    console.log('\n📈 Features enabled:');
    console.log('   - Email activity triggers');
    console.log('   - Automated follow-ups');
    console.log('   - Lead stage automation');
    console.log('   - Email templates');
    console.log('   - Workflow builder support');
    console.log('   - Engagement tracking');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Run the migration
createEmailWorkflowsTables()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
