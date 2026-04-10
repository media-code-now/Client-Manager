-- Smart Notifications System Migration
-- Creates tables and infrastructure for intelligent notification system
-- with rules, templates, scheduling, and multi-channel delivery

-- Notification Types Enum
CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_due',
  'task_overdue',
  'task_completed',
  'task_blocked',
  'client_inactive',
  'client_milestone',
  'mention',
  'comment',
  'custom'
);

-- Notification Trigger Enum
CREATE TYPE notification_trigger AS ENUM (
  'immediate',
  'due_date',
  'overdue',
  'assigned',
  'completed',
  'blocked',
  'inactive_client',
  'milestone',
  'mention',
  'schedule'
);

-- Schedule Type Enum
CREATE TYPE schedule_type AS ENUM (
  'immediate',
  'daily_digest',
  'weekly_digest',
  'monthly_digest',
  'scheduled'
);

-- Delivery Method Enum
CREATE TYPE delivery_method AS ENUM (
  'in_app',
  'email',
  'sms'
);

-- Priority Enum
CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Notification Status Enum
CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'read',
  'dismissed',
  'failed'
);

-- Main Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  rule_id INT,
  trigger_type notification_trigger NOT NULL,
  notification_type notification_type NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50), -- 'task', 'client', 'comment'
  related_entity_id INT,
  priority notification_priority NOT NULL DEFAULT 'normal',
  delivery_methods delivery_method[] NOT NULL DEFAULT ARRAY['in_app'::delivery_method],
  status notification_status NOT NULL DEFAULT 'pending',
  read_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB, -- Additional context (task details, client info, etc.)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification Rules Table (defines when to send notifications)
CREATE TABLE notification_rules (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger notification_trigger NOT NULL,
  trigger_config JSONB NOT NULL, -- Flexible config based on trigger type
  schedule_type schedule_type NOT NULL DEFAULT 'immediate',
  schedule_time VARCHAR(5), -- HH:mm format for scheduled notifications
  delivery_methods delivery_method[] NOT NULL DEFAULT ARRAY['in_app'::delivery_method],
  priority notification_priority NOT NULL DEFAULT 'normal',
  template_id INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification Templates Table (message templates with variables)
CREATE TABLE notification_templates (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger notification_trigger NOT NULL,
  subject VARCHAR(255),
  message_template TEXT NOT NULL,
  variables TEXT[] NOT NULL, -- List of available variables
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences Table
CREATE TABLE user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  enable_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  preferred_delivery_methods delivery_method[] NOT NULL DEFAULT ARRAY['in_app'::delivery_method, 'email'::delivery_method],
  mute_duration INT, -- Minutes for mute
  mute_until TIMESTAMP,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start VARCHAR(5), -- HH:mm format
  quiet_hours_end VARCHAR(5),
  digest_frequency schedule_type NOT NULL DEFAULT 'daily_digest',
  unsubscribed_triggers notification_trigger[] NOT NULL DEFAULT ARRAY[]::notification_trigger[], -- Opt-out from specific triggers
  email_frequency VARCHAR(20) NOT NULL DEFAULT 'immediate', -- immediate, daily, weekly, never
  sms_frequency VARCHAR(20) NOT NULL DEFAULT 'immediate',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification History / Analytics Table
CREATE TABLE notification_events (
  id SERIAL PRIMARY KEY,
  notification_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'failed', 'opened', 'clicked'
  event_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notification_rules_user_id ON notification_rules(user_id);
CREATE INDEX idx_notification_rules_active ON notification_rules(user_id, is_active);

CREATE INDEX idx_notification_templates_user_id ON notification_templates(user_id);

CREATE INDEX idx_user_preferences_user_id ON user_notification_preferences(user_id);

CREATE INDEX idx_notification_events_notification_id ON notification_events(notification_id);
CREATE INDEX idx_notification_events_created_at ON notification_events(created_at DESC);

-- Materialized Views for Analytics
CREATE VIEW notification_summary AS
SELECT
  user_id,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as unread_count,
  COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
  COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_count,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_count,
  MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id;

CREATE VIEW notification_type_stats AS
SELECT
  user_id,
  notification_type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as unread
FROM notifications
GROUP BY user_id, notification_type;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_rules_updated_at BEFORE UPDATE ON notification_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
