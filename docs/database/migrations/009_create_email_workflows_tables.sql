-- Email Automation Workflows Schema
-- Allows users to create automated triggers based on email activity

-- Workflow definitions table
CREATE TABLE IF NOT EXISTS email_workflows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow triggers (when something happens)
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
  trigger_type VARCHAR(100) NOT NULL,
  -- Trigger types:
  -- 'email_received', 'email_sent', 'email_opened', 'email_clicked', 
  -- 'email_replied', 'no_reply_after_days', 'contact_created'
  
  trigger_config JSONB,
  -- Config examples:
  -- For 'no_reply_after_days': {"days": 3, "original_email_id": null}
  -- For 'email_received': {"from_domain": "example.com", "subject_contains": "quote"}
  -- For 'email_opened': {"min_opens": 1}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow conditions (filter when trigger fires)
CREATE TABLE IF NOT EXISTS workflow_conditions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
  condition_type VARCHAR(100) NOT NULL,
  -- Condition types:
  -- 'contact_status', 'contact_tag', 'email_subject_contains', 
  -- 'email_from_domain', 'lead_stage', 'days_since_last_contact'
  
  operator VARCHAR(50) NOT NULL,
  -- Operators: 'equals', 'not_equals', 'contains', 'not_contains', 
  -- 'greater_than', 'less_than', 'in', 'not_in'
  
  value TEXT NOT NULL,
  -- Value can be JSON string for complex comparisons
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow actions (what to do when triggered)
CREATE TABLE IF NOT EXISTS workflow_actions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  -- Action types:
  -- 'send_email', 'update_lead_stage', 'add_tag', 'remove_tag',
  -- 'assign_to_user', 'create_task', 'send_notification', 'update_contact_field',
  -- 'mark_as_engaged', 'add_to_sequence', 'webhook'
  
  action_config JSONB NOT NULL,
  -- Config examples:
  -- For 'send_email': {"template_id": 5, "delay_hours": 0}
  -- For 'update_lead_stage': {"stage": "engaged", "reason": "Email opened"}
  -- For 'create_task': {"title": "Follow up", "due_in_days": 1}
  -- For 'send_notification': {"user_id": 123, "message": "New lead email"}
  
  execution_order INTEGER DEFAULT 0,
  -- Order in which actions execute (ascending)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow execution log
CREATE TABLE IF NOT EXISTS workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
  trigger_event_id INTEGER,
  -- Reference to email_id, contact_id, etc. depending on trigger
  
  trigger_type VARCHAR(100) NOT NULL,
  trigger_data JSONB,
  -- Store the data that triggered the workflow
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Status: 'pending', 'running', 'completed', 'failed', 'skipped'
  
  actions_executed INTEGER DEFAULT 0,
  actions_total INTEGER DEFAULT 0,
  
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow action execution details
CREATE TABLE IF NOT EXISTS workflow_action_logs (
  id SERIAL PRIMARY KEY,
  execution_id INTEGER NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  action_id INTEGER NOT NULL REFERENCES workflow_actions(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  action_config JSONB,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Status: 'pending', 'running', 'completed', 'failed', 'skipped'
  
  result JSONB,
  -- Store result of action (e.g., email_id for sent email, task_id for created task)
  
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates for automated emails
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB,
  -- Available variables: {{contact_name}}, {{company}}, {{user_name}}, etc.
  
  category VARCHAR(100),
  -- Categories: 'follow_up', 'welcome', 'nurture', 'reminder', 'custom'
  
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled follow-ups (for "no reply after X days" trigger)
CREATE TABLE IF NOT EXISTS scheduled_followups (
  id SERIAL PRIMARY KEY,
  original_email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  workflow_id INTEGER REFERENCES email_workflows(id) ON DELETE SET NULL,
  contact_id INTEGER,
  
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  days_after_original INTEGER NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Status: 'pending', 'executed', 'cancelled', 'failed'
  
  executed_at TIMESTAMP WITH TIME ZONE,
  execution_result JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON email_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON email_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_triggers_type ON workflow_triggers(trigger_type);

CREATE INDEX IF NOT EXISTS idx_conditions_workflow_id ON workflow_conditions(workflow_id);

CREATE INDEX IF NOT EXISTS idx_actions_workflow_id ON workflow_actions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_actions_order ON workflow_actions(workflow_id, execution_order);

CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created_at ON workflow_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_logs_execution_id ON workflow_action_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_action_id ON workflow_action_logs(action_id);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_followups_scheduled_for ON scheduled_followups(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_followups_status ON scheduled_followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_email_id ON scheduled_followups(original_email_id);

-- Create trigger for updated_at timestamp on email_workflows
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_workflow_timestamp
  BEFORE UPDATE ON email_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

-- Create trigger for updated_at timestamp on email_templates
CREATE TRIGGER trigger_update_template_timestamp
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

-- Add lead_stage column to clients table if it doesn't exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_stage VARCHAR(100) DEFAULT 'new';
-- Lead stages: 'new', 'contacted', 'engaged', 'qualified', 'proposal', 'negotiation', 'won', 'lost'

ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;

-- Create index on lead_stage
CREATE INDEX IF NOT EXISTS idx_clients_lead_stage ON clients(lead_stage);
CREATE INDEX IF NOT EXISTS idx_clients_last_contacted ON clients(last_contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_engagement_score ON clients(engagement_score DESC);
