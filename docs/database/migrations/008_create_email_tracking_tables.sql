-- Email tracking tables for open/click analytics
-- This migration creates tables to track email opens, link clicks, and analytics

-- Table to track individual email events (opens and clicks)
CREATE TABLE IF NOT EXISTS email_tracking_events (
  id SERIAL PRIMARY KEY,
  email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'open', 'click'
  tracking_id VARCHAR(100) UNIQUE NOT NULL, -- Unique tracking identifier
  user_agent TEXT, -- Browser/email client info
  ip_address VARCHAR(45), -- IP address of opener
  link_url TEXT, -- URL clicked (null for opens)
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store tracking links with UTM parameters
CREATE TABLE IF NOT EXISTS email_tracking_links (
  id SERIAL PRIMARY KEY,
  email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  tracking_id VARCHAR(100) UNIQUE NOT NULL, -- Unique identifier for link
  original_url TEXT NOT NULL, -- Original link URL
  tracked_url TEXT NOT NULL, -- URL with tracking parameters
  utm_source VARCHAR(255), -- UTM source parameter
  utm_medium VARCHAR(255), -- UTM medium parameter
  utm_campaign VARCHAR(255), -- UTM campaign parameter
  utm_content VARCHAR(255), -- UTM content parameter
  utm_term VARCHAR(255), -- UTM term parameter
  click_count INTEGER DEFAULT 0, -- Number of clicks
  first_clicked_at TIMESTAMP WITH TIME ZONE, -- First click timestamp
  last_clicked_at TIMESTAMP WITH TIME ZONE, -- Last click timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add tracking fields to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS tracking_pixel_id VARCHAR(100) UNIQUE;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_email_id ON email_tracking_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_tracking_id ON email_tracking_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_occurred_at ON email_tracking_events(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_tracking_links_email_id ON email_tracking_links(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_links_tracking_id ON email_tracking_links(tracking_id);

CREATE INDEX IF NOT EXISTS idx_emails_tracking_pixel_id ON emails(tracking_pixel_id);
CREATE INDEX IF NOT EXISTS idx_emails_first_opened_at ON emails(first_opened_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_tracking_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_email_tracking_links_updated_at ON email_tracking_links;
CREATE TRIGGER update_email_tracking_links_updated_at
  BEFORE UPDATE ON email_tracking_links
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tracking_links_updated_at();

-- Comments for documentation
COMMENT ON TABLE email_tracking_events IS 'Stores individual email open and click events with timestamps';
COMMENT ON TABLE email_tracking_links IS 'Stores tracking links with UTM parameters and click analytics';
COMMENT ON COLUMN email_tracking_events.tracking_id IS 'Unique identifier for tracking pixel or link';
COMMENT ON COLUMN email_tracking_events.event_type IS 'Type of event: open or click';
COMMENT ON COLUMN email_tracking_links.tracking_id IS 'Unique identifier embedded in tracked links';
COMMENT ON COLUMN email_tracking_links.tracked_url IS 'URL with tracking ID and UTM parameters appended';
COMMENT ON COLUMN emails.tracking_pixel_id IS 'Unique ID for tracking pixel embedded in email HTML';
COMMENT ON COLUMN emails.open_count IS 'Total number of times email was opened';
COMMENT ON COLUMN emails.click_count IS 'Total number of link clicks in email';
COMMENT ON COLUMN emails.reply_count IS 'Number of replies to this email (tracked via thread_id)';
