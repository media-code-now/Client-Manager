-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'email', 'form', 'website', 'ads', 'marketing'
  provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'typeform', 'google_forms', 'wordpress', 'google_ads', etc.
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'syncing'
  config JSONB DEFAULT '{}', -- Integration-specific configuration
  credentials JSONB DEFAULT '{}', -- Encrypted credentials (tokens, API keys)
  metadata JSONB DEFAULT '{}', -- Additional data (last_sync, sync_count, etc.)
  connected_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create integration_logs table for tracking events
CREATE TABLE IF NOT EXISTS integration_logs (
  id VARCHAR(255) PRIMARY KEY,
  integration_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'sync', 'connect', 'disconnect', 'error', 'webhook'
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'pending'
  message TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create webhooks table for incoming webhooks from integrations
CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR(255) PRIMARY KEY,
  integration_id VARCHAR(255),
  url TEXT NOT NULL,
  secret VARCHAR(255),
  events TEXT[], -- Array of event types to listen for
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'failed'
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create integration_data table for storing synced data
CREATE TABLE IF NOT EXISTS integration_data (
  id VARCHAR(255) PRIMARY KEY,
  integration_id VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL, -- 'contact', 'email', 'form_submission', 'campaign', 'ad', etc.
  external_id VARCHAR(255), -- ID from the external system
  data JSONB NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_integration_id ON webhooks(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_data_integration_id ON integration_data(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_data_data_type ON integration_data(data_type);
CREATE INDEX IF NOT EXISTS idx_integration_data_external_id ON integration_data(external_id);
