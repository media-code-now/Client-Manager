-- Client Manager Database Schema
-- Database: client_manager
-- Version: 1.0
-- Created: November 4, 2025

-- Enable UUID extension (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- CLIENTS TABLE
-- ================================================
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    website VARCHAR(255),
    notes TEXT,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255), -- User who created the client
    updated_by VARCHAR(255), -- User who last updated the client
    
    -- Indexes for performance
    INDEX idx_clients_email (email),
    INDEX idx_clients_company (company),
    INDEX idx_clients_status (status),
    INDEX idx_clients_created_at (created_at),
    INDEX idx_clients_uuid (uuid)
);

-- ================================================
-- TASKS TABLE
-- ================================================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in-progress', 'completed', 'cancelled', 'on-hold') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    due_date DATE,
    start_date DATE,
    completion_date TIMESTAMP NULL,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    billable BOOLEAN DEFAULT TRUE,
    hourly_rate DECIMAL(8,2),
    tags JSON, -- Store tags as JSON array for flexibility
    attachments JSON, -- Store file paths/URLs as JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    assigned_to VARCHAR(255), -- User assigned to the task
    
    -- Foreign key constraints
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_tasks_client_id (client_id),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_due_date (due_date),
    INDEX idx_tasks_assigned_to (assigned_to),
    INDEX idx_tasks_created_at (created_at),
    INDEX idx_tasks_uuid (uuid),
    
    -- Composite indexes for common queries
    INDEX idx_tasks_client_status (client_id, status),
    INDEX idx_tasks_client_due_date (client_id, due_date)
);

-- ================================================
-- CREDENTIALS TABLE
-- ================================================
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL, -- e.g., "WordPress Admin", "FTP Access", "Email Account"
    type ENUM('login', 'ftp', 'database', 'email', 'social_media', 'hosting', 'domain', 'api_key', 'license', 'other') NOT NULL,
    website_url VARCHAR(500),
    username VARCHAR(255),
    email VARCHAR(255),
    password_encrypted TEXT, -- Encrypted password
    password_hint VARCHAR(255), -- Optional hint (never store actual password)
    port INT, -- For FTP, database connections
    host VARCHAR(255), -- For FTP, database, email servers
    database_name VARCHAR(255), -- For database credentials
    additional_info JSON, -- Store extra fields as JSON for flexibility
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATE, -- For licenses, subscriptions
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Foreign key constraints
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_credentials_client_id (client_id),
    INDEX idx_credentials_type (type),
    INDEX idx_credentials_is_active (is_active),
    INDEX idx_credentials_expires_at (expires_at),
    INDEX idx_credentials_uuid (uuid),
    
    -- Composite indexes
    INDEX idx_credentials_client_type (client_id, type),
    INDEX idx_credentials_client_active (client_id, is_active)
);

-- ================================================
-- AUDIT LOG TABLE
-- ================================================
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    table_name VARCHAR(50) NOT NULL, -- clients, tasks, credentials
    record_id INT NOT NULL, -- ID of the affected record
    record_uuid UUID, -- UUID of the affected record
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW') NOT NULL,
    old_values JSON, -- Previous values (for UPDATE/DELETE)
    new_values JSON, -- New values (for CREATE/UPDATE)
    changed_fields JSON, -- Array of field names that changed
    user_id VARCHAR(255), -- Who performed the action
    user_email VARCHAR(255), -- Email of the user
    ip_address INET, -- IP address of the user
    user_agent TEXT, -- Browser/client information
    session_id VARCHAR(255), -- Session identifier
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_table_uuid (table_name, record_uuid),
    INDEX idx_audit_action (action),
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_uuid (uuid),
    
    -- Composite indexes for common queries
    INDEX idx_audit_table_timestamp (table_name, timestamp),
    INDEX idx_audit_user_timestamp (user_id, timestamp)
);

-- ================================================
-- ADDITIONAL TABLES FOR ENHANCED FUNCTIONALITY
-- ================================================

-- Client contacts (multiple contacts per client)
CREATE TABLE client_contacts (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    client_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255), -- Job title
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_contacts_client_id (client_id),
    INDEX idx_client_contacts_is_primary (is_primary),
    INDEX idx_client_contacts_uuid (uuid)
);

-- Task comments/notes
CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    task_id INT NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs client-visible
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_comments_task_id (task_id),
    INDEX idx_task_comments_created_at (created_at),
    INDEX idx_task_comments_uuid (uuid)
);

-- File attachments
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    attachable_type ENUM('client', 'task', 'credential') NOT NULL,
    attachable_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT, -- Size in bytes
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_attachments_attachable (attachable_type, attachable_id),
    INDEX idx_attachments_uploaded_by (uploaded_by),
    INDEX idx_attachments_created_at (created_at),
    INDEX idx_attachments_uuid (uuid)
);

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- View: Client overview with task and credential counts
CREATE VIEW client_overview AS
SELECT 
    c.*,
    COALESCE(t.task_count, 0) as task_count,
    COALESCE(t.pending_tasks, 0) as pending_tasks,
    COALESCE(t.overdue_tasks, 0) as overdue_tasks,
    COALESCE(cr.credential_count, 0) as credential_count
FROM clients c
LEFT JOIN (
    SELECT 
        client_id,
        COUNT(*) as task_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status IN ('pending', 'in-progress') AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_tasks
    FROM tasks 
    GROUP BY client_id
) t ON c.id = t.client_id
LEFT JOIN (
    SELECT 
        client_id,
        COUNT(*) as credential_count
    FROM credentials 
    WHERE is_active = TRUE
    GROUP BY client_id
) cr ON c.id = cr.client_id;

-- View: Task overview with client information
CREATE VIEW task_overview AS
SELECT 
    t.*,
    c.name as client_name,
    c.company as client_company,
    c.email as client_email,
    CASE 
        WHEN t.due_date < CURDATE() AND t.status IN ('pending', 'in-progress') THEN 'overdue'
        WHEN t.due_date = CURDATE() AND t.status IN ('pending', 'in-progress') THEN 'due_today'
        WHEN t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND t.status IN ('pending', 'in-progress') THEN 'due_soon'
        ELSE 'normal'
    END as urgency_status
FROM tasks t
JOIN clients c ON t.client_id = c.id;

-- ================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ================================================

-- Trigger function for audit logging
DELIMITER //
CREATE TRIGGER audit_clients_changes
    AFTER INSERT, UPDATE, DELETE ON clients
    FOR EACH ROW
BEGIN
    DECLARE action_type VARCHAR(10);
    DECLARE old_vals JSON DEFAULT NULL;
    DECLARE new_vals JSON DEFAULT NULL;
    
    CASE 
        WHEN OLD IS NULL THEN SET action_type = 'CREATE';
        WHEN NEW IS NULL THEN SET action_type = 'DELETE';
        ELSE SET action_type = 'UPDATE';
    END CASE;
    
    IF OLD IS NOT NULL THEN
        SET old_vals = JSON_OBJECT(
            'id', OLD.id,
            'name', OLD.name,
            'email', OLD.email,
            'company', OLD.company,
            'status', OLD.status
        );
    END IF;
    
    IF NEW IS NOT NULL THEN
        SET new_vals = JSON_OBJECT(
            'id', NEW.id,
            'name', NEW.name,
            'email', NEW.email,
            'company', NEW.company,
            'status', NEW.status
        );
    END IF;
    
    INSERT INTO audit_log (
        table_name, 
        record_id, 
        record_uuid, 
        action, 
        old_values, 
        new_values,
        user_id
    ) VALUES (
        'clients',
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.uuid, OLD.uuid),
        action_type,
        old_vals,
        new_vals,
        USER() -- This should be replaced with actual user context
    );
END//
DELIMITER ;

-- Similar triggers would be created for tasks and credentials tables

-- ================================================
-- INITIAL DATA / SEED DATA
-- ================================================

-- Insert some initial data for testing
-- This section would typically be in a separate seed file