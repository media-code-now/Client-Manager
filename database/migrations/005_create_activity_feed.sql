-- ============================================================================
-- Migration 005: Activity Feed System
-- ============================================================================
-- Extends audit_log with activity type categorization for timeline views
-- Adds views for activity analytics and client interaction summaries
-- Enables filtering, searching, and exporting of client activities

-- ============================================================================
-- ALTER audit_log table to add activity type classification
-- ============================================================================

ALTER TABLE IF EXISTS audit_log
ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50);

-- Add comment
COMMENT ON COLUMN audit_log.activity_type IS 'Categorical activity type for timeline and filtering (task_created, task_completed, credential_updated, etc.)';

-- ============================================================================
-- ADD INDEXES for activity feed queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_log_activity_type
ON audit_log(activity_type);

CREATE INDEX IF NOT EXISTS idx_audit_log_record_timestamp
ON audit_log(record_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_timestamp
ON audit_log(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_activity
ON audit_log(table_name, activity_type);

-- ============================================================================
-- CREATE VIEW: activity_summary
-- Provides statistics about activities per client
-- ============================================================================

CREATE OR REPLACE VIEW activity_summary AS
SELECT
  al.record_id AS client_id,
  COUNT(*) AS total_activities,
  COUNT(CASE WHEN al.activity_type = 'task_created' THEN 1 END) AS tasks_created,
  COUNT(CASE WHEN al.activity_type = 'task_completed' THEN 1 END) AS tasks_completed,
  COUNT(CASE WHEN al.activity_type = 'credential_updated' THEN 1 END) AS credentials_updated,
  COUNT(CASE WHEN al.activity_type = 'note_added' THEN 1 END) AS notes_added,
  COUNT(CASE WHEN al.activity_type = 'call_logged' THEN 1 END) AS calls_logged,
  COUNT(CASE WHEN al.activity_type = 'email_sent' THEN 1 END) AS emails_sent,
  COUNT(CASE WHEN al.activity_type = 'meeting_scheduled' THEN 1 END) AS meetings_scheduled,
  COUNT(CASE WHEN al.activity_type = 'file_uploaded' THEN 1 END) AS files_uploaded,
  MAX(al.timestamp) AS last_activity_at,
  COUNT(DISTINCT al.user_id) AS unique_users
FROM audit_log al
WHERE al.table_name IN ('clients', 'tasks', 'credentials', 'notes', 'calls', 'emails', 'meetings', 'files')
GROUP BY al.record_id;

-- ============================================================================
-- CREATE VIEW: activity_by_type
-- Shows activity distribution by type
-- ============================================================================

CREATE OR REPLACE VIEW activity_by_type AS
SELECT
  al.activity_type,
  al.table_name,
  COUNT(*) AS activity_count,
  COUNT(DISTINCT al.record_id) AS affected_records,
  COUNT(DISTINCT al.user_id) AS unique_users,
  MAX(al.timestamp) AS last_activity_at
FROM audit_log al
WHERE al.activity_type IS NOT NULL
GROUP BY al.activity_type, al.table_name
ORDER BY activity_count DESC;

-- ============================================================================
-- CREATE VIEW: activity_by_user
-- Shows activity distribution by user
-- ============================================================================

CREATE OR REPLACE VIEW activity_by_user AS
SELECT
  al.user_id,
  al.user_email,
  COUNT(*) AS activity_count,
  COUNT(DISTINCT al.record_id) AS affected_records,
  COUNT(DISTINCT al.table_name) AS table_types,
  MIN(al.timestamp) AS first_activity_at,
  MAX(al.timestamp) AS last_activity_at
FROM audit_log al
WHERE al.user_id IS NOT NULL
GROUP BY al.user_id, al.user_email
ORDER BY activity_count DESC;

-- ============================================================================
-- CREATE VIEW: recent_activities
-- Shows most recent activities across all clients
-- ============================================================================

CREATE OR REPLACE VIEW recent_activities AS
SELECT
  al.id,
  al.record_id AS client_id,
  al.user_id,
  al.user_email,
  al.activity_type,
  al.table_name,
  al.action,
  al.new_values,
  al.changed_fields,
  al.timestamp,
  ROW_NUMBER() OVER (PARTITION BY al.record_id ORDER BY al.timestamp DESC) as recency_rank
FROM audit_log al
WHERE al.activity_type IS NOT NULL
ORDER BY al.timestamp DESC;

-- ============================================================================
-- CREATE VIEW: client_activity_timeline
-- Complete timeline for individual clients
-- ============================================================================

CREATE OR REPLACE VIEW client_activity_timeline AS
SELECT
  al.id,
  al.record_id AS client_id,
  al.user_id,
  al.user_email,
  al.activity_type,
  al.table_name,
  al.action,
  al.timestamp,
  al.new_values,
  al.changed_fields,
  DATE(al.timestamp) AS activity_date,
  EXTRACT(YEAR FROM al.timestamp) AS activity_year,
  EXTRACT(MONTH FROM al.timestamp) AS activity_month,
  EXTRACT(WEEK FROM al.timestamp) AS activity_week,
  EXTRACT(DAY FROM al.timestamp) AS activity_day
FROM audit_log al
WHERE al.table_name IN ('clients', 'tasks', 'credentials', 'notes', 'calls', 'emails', 'meetings', 'files')
ORDER BY al.timestamp DESC;

-- ============================================================================
-- CREATE FUNCTION: get_client_activities
-- Retrieves paginated activities for a specific client
-- ============================================================================

CREATE OR REPLACE FUNCTION get_client_activities(
  p_client_id INT,
  p_activity_type VARCHAR(50) DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  activity_id INT,
  client_id INT,
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  activity_type VARCHAR(50),
  table_name VARCHAR(100),
  action VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE,
  new_values JSONB,
  changed_fields JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.record_id,
    al.user_id,
    al.user_email,
    al.activity_type,
    al.table_name,
    al.action,
    al.timestamp,
    al.new_values,
    al.changed_fields
  FROM audit_log al
  WHERE al.record_id = p_client_id
    AND (p_activity_type IS NULL OR al.activity_type = p_activity_type)
  ORDER BY al.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE FUNCTION: search_client_activities
-- Searches client activities by text
-- ============================================================================

CREATE OR REPLACE FUNCTION search_client_activities(
  p_client_id INT,
  p_search_term VARCHAR(255),
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  activity_id INT,
  client_id INT,
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  activity_type VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE,
  match_text VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.record_id,
    al.user_id,
    al.user_email,
    al.activity_type,
    al.timestamp,
    CONCAT(al.table_name, ' - ', al.action)
  FROM audit_log al
  WHERE al.record_id = p_client_id
    AND (
      al.user_email ILIKE CONCAT('%', p_search_term, '%')
      OR al.table_name ILIKE CONCAT('%', p_search_term, '%')
      OR al.action ILIKE CONCAT('%', p_search_term, '%')
      OR CAST(al.new_values AS TEXT) ILIKE CONCAT('%', p_search_term, '%')
    )
  ORDER BY al.timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE FUNCTION: get_activity_statistics
-- Returns activity statistics for a client
-- ============================================================================

CREATE OR REPLACE FUNCTION get_activity_statistics(p_client_id INT)
RETURNS TABLE (
  total_activities INT,
  tasks_created INT,
  tasks_completed INT,
  credentials_updated INT,
  notes_added INT,
  calls_logged INT,
  emails_sent INT,
  meetings_scheduled INT,
  files_uploaded INT,
  last_activity TIMESTAMP WITH TIME ZONE,
  unique_users INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT,
    COUNT(CASE WHEN al.activity_type = 'task_created' THEN 1 END)::INT,
    COUNT(CASE WHEN al.activity_type = 'task_completed' THEN 1 END)::INT,
    COUNT(CASE WHEN al.activity_type = 'credential_updated' THEN 1 END)::INT,
    COUNT(CASE WHEN al.activity_type = 'note_added' THEN 1 END)::INT,
    COUNT(CASE WHEN al.activity_type = 'call_logged' THEN 1 END)::INT,
    COUNT(CASE WHEN al.activity_type = 'email_sent' THEN 1 END)::INT,
    COUNT(CASE WHEN al.activity_type = 'meeting_scheduled' THEN 1 END)::INT,
    COUNT(CASE WHEN al.activity_type = 'file_uploaded' THEN 1 END)::INT,
    MAX(al.timestamp),
    COUNT(DISTINCT al.user_id)::INT
  FROM audit_log al
  WHERE al.record_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- This migration adds activity feed capabilities to the audit log system
-- 
-- Changes:
-- 1. Adds activity_type column to audit_log for better categorization
-- 2. Creates 4 views for activity analysis and reporting
-- 3. Creates 3 functions for activity retrieval and statistics
-- 4. Adds 4 indexes for improved query performance
--
-- The activity_type field should be populated by the application when
-- audit_log entries are created, using the following categories:
-- - task_created, task_updated, task_completed, task_deleted
-- - credential_created, credential_updated, credential_deleted, credential_accessed
-- - note_added, note_updated, note_deleted
-- - call_logged, email_sent, meeting_scheduled
-- - file_uploaded, client_updated, status_changed, comment_added
--
-- These enhance the existing audit_log system with activity feed functionality
-- while maintaining backward compatibility with existing audit records.
