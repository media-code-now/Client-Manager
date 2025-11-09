-- Migration: Create emails table for storing synced emails
-- Description: Stores emails linked to contacts with threading, read status, and attachments

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  integration_id INTEGER NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Email sync tables for CRM
-- This migration creates tables to store synced emails, sync state, and attachments

-- Main emails table to store all synced email messages
CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  integration_id VARCHAR(255) NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Email identifiers and threading
  message_id VARCHAR(500) UNIQUE NOT NULL,  -- Provider's unique message ID
  thread_id VARCHAR(500),                    -- Thread/conversation ID
  in_reply_to VARCHAR(500),                  -- Message-ID this is replying to
  "references" TEXT,                         -- Full References header for threading
  
  -- Email addresses and participants
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  to_emails TEXT NOT NULL,                   -- JSON array of recipient emails
  cc_emails TEXT,                            -- JSON array of CC emails
  bcc_emails TEXT,                           -- JSON array of BCC emails
  subject TEXT,
  
  -- Email content
  body_text TEXT,
  body_html TEXT,
  snippet TEXT, -- Short preview (first 200 chars)
  
  -- Status and flags
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  
  -- Attachments
  has_attachments BOOLEAN DEFAULT FALSE,
  attachments JSONB, -- Array of {filename, size, contentType, url/path}
  
  -- Dates
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  labels JSONB, -- Gmail labels, Outlook categories
  folder VARCHAR(255), -- IMAP folder (INBOX, Sent, etc)
  size_bytes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_sync_state table to track last sync per integration
CREATE TABLE IF NOT EXISTS email_sync_state (
  id SERIAL PRIMARY KEY,
  integration_id VARCHAR(255) NOT NULL UNIQUE REFERENCES integrations(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_message_id VARCHAR(500),
  last_history_id VARCHAR(100), -- Gmail history ID
  sync_token TEXT, -- Outlook sync token
  sync_status VARCHAR(50) DEFAULT 'idle', -- idle, syncing, error
  sync_error TEXT,
  messages_synced INTEGER DEFAULT 0,
  last_sync_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_attachments table for detailed attachment storage
CREATE TABLE IF NOT EXISTS email_attachments (
  id SERIAL PRIMARY KEY,
  email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  content_type VARCHAR(255),
  size_bytes INTEGER,
  attachment_id VARCHAR(255), -- Provider-specific attachment ID
  storage_path TEXT, -- Local storage path or cloud URL
  is_inline BOOLEAN DEFAULT FALSE,
  content_id VARCHAR(255), -- For inline images
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_integration_id ON emails(integration_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_from_email ON emails(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_synced_at ON emails(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_state_integration_id ON email_sync_state(integration_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for emails table
DROP TRIGGER IF EXISTS emails_updated_at_trigger ON emails;
CREATE TRIGGER emails_updated_at_trigger
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_emails_updated_at();

-- Create trigger for email_sync_state table
DROP TRIGGER IF EXISTS email_sync_state_updated_at_trigger ON email_sync_state;
CREATE TRIGGER email_sync_state_updated_at_trigger
  BEFORE UPDATE ON email_sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_emails_updated_at();

-- Add helpful comments
COMMENT ON TABLE emails IS 'Stores synced emails from connected email integrations';
COMMENT ON TABLE email_sync_state IS 'Tracks sync state for each email integration';
COMMENT ON TABLE email_attachments IS 'Stores email attachment metadata';
COMMENT ON COLUMN emails.message_id IS 'Unique message ID from email provider';
COMMENT ON COLUMN emails.thread_id IS 'Thread/conversation ID for grouping related emails';
COMMENT ON COLUMN emails.contact_id IS 'Linked CRM contact (auto-matched by email address)';
COMMENT ON COLUMN email_sync_state.last_history_id IS 'Gmail History API history ID for incremental sync';
COMMENT ON COLUMN email_sync_state.sync_token IS 'Outlook Delta API sync token for incremental sync';
