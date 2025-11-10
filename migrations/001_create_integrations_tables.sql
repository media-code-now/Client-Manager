-- Create integrations table for email integrations
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'calendar', 'other')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  config JSONB DEFAULT '{}'::jsonb,
  credentials TEXT NOT NULL, -- Encrypted credentials string
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT integrations_user_name_unique UNIQUE (user_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS integrations_user_id_idx ON integrations(user_id);
CREATE INDEX IF NOT EXISTS integrations_type_idx ON integrations(type);
CREATE INDEX IF NOT EXISTS integrations_status_idx ON integrations(status);

-- Create integration_logs table for tracking events
CREATE TABLE IF NOT EXISTS integration_logs (
  id SERIAL PRIMARY KEY,
  integration_id INTEGER NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for integration logs
CREATE INDEX IF NOT EXISTS integration_logs_integration_id_idx ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS integration_logs_created_at_idx ON integration_logs(created_at DESC);

-- Add comment
COMMENT ON TABLE integrations IS 'Stores email and other third-party integrations with encrypted credentials';
COMMENT ON COLUMN integrations.credentials IS 'AES-256 encrypted credentials string';
