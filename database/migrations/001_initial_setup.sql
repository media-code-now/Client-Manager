-- Migration: Create Client Manager Database
-- Version: 001
-- Description: Initial database setup with core tables

-- ================================================
-- DROP EXISTING TABLES (BE CAREFUL IN PRODUCTION!)
-- ================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS client_contacts;
DROP TABLE IF EXISTS credentials;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS clients;
SET FOREIGN_KEY_CHECKS = 1;

-- ================================================
-- CREATE CORE TABLES
-- ================================================

-- CLIENTS TABLE
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
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
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    INDEX idx_clients_email (email),
    INDEX idx_clients_company (company),
    INDEX idx_clients_status (status),
    INDEX idx_clients_created_at (created_at),
    INDEX idx_clients_uuid (uuid)
);

-- TASKS TABLE
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
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
    tags JSON,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    assigned_to VARCHAR(255),
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    INDEX idx_tasks_client_id (client_id),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_due_date (due_date),
    INDEX idx_tasks_assigned_to (assigned_to),
    INDEX idx_tasks_created_at (created_at),
    INDEX idx_tasks_uuid (uuid),
    INDEX idx_tasks_client_status (client_id, status),
    INDEX idx_tasks_client_due_date (client_id, due_date)
);

-- CREDENTIALS TABLE
CREATE TABLE credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('login', 'ftp', 'database', 'email', 'social_media', 'hosting', 'domain', 'api_key', 'license', 'other') NOT NULL,
    website_url VARCHAR(500),
    username VARCHAR(255),
    email VARCHAR(255),
    password_encrypted TEXT,
    password_hint VARCHAR(255),
    port INT,
    host VARCHAR(255),
    database_name VARCHAR(255),
    additional_info JSON,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    
    INDEX idx_credentials_client_id (client_id),
    INDEX idx_credentials_type (type),
    INDEX idx_credentials_is_active (is_active),
    INDEX idx_credentials_expires_at (expires_at),
    INDEX idx_credentials_uuid (uuid),
    INDEX idx_credentials_client_type (client_id, type),
    INDEX idx_credentials_client_active (client_id, is_active)
);

-- AUDIT LOG TABLE
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    record_uuid VARCHAR(36),
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_fields JSON,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_table_uuid (table_name, record_uuid),
    INDEX idx_audit_action (action),
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_uuid (uuid),
    INDEX idx_audit_table_timestamp (table_name, timestamp),
    INDEX idx_audit_user_timestamp (user_id, timestamp)
);

-- CLIENT CONTACTS TABLE
CREATE TABLE client_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    client_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
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

-- TASK COMMENTS TABLE
CREATE TABLE task_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    task_id INT NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_comments_task_id (task_id),
    INDEX idx_task_comments_created_at (created_at),
    INDEX idx_task_comments_uuid (uuid)
);

-- ATTACHMENTS TABLE
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    attachable_type ENUM('client', 'task', 'credential') NOT NULL,
    attachable_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_attachments_attachable (attachable_type, attachable_id),
    INDEX idx_attachments_uploaded_by (uploaded_by),
    INDEX idx_attachments_created_at (created_at),
    INDEX idx_attachments_uuid (uuid)
);

-- ================================================
-- CREATE VIEWS
-- ================================================

-- Client overview with statistics
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

-- Task overview with client information
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