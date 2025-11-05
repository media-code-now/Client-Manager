-- Mini CRM PostgreSQL Schema
-- Database: mini_crm
-- Version: 1.0
-- Created: November 4, 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- USERS TABLE (Optional)
-- ================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_uuid_key UNIQUE (uuid)
);

-- Index for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ================================================
-- CLIENTS TABLE
-- ================================================
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'archived')),
    tags TEXT[] DEFAULT '{}', -- PostgreSQL array for tags
    timezone VARCHAR(100) DEFAULT 'UTC',
    website_url VARCHAR(500),
    notes TEXT,
    owner_user_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_clients_owner_user FOREIGN KEY (owner_user_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT clients_uuid_key UNIQUE (uuid),
    CONSTRAINT clients_email_check CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT clients_website_url_check CHECK (website_url IS NULL OR website_url ~* '^https?://')
);

-- Indexes for clients
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_company ON clients(company);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_owner_user_id ON clients(owner_user_id);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_updated_at ON clients(updated_at);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags); -- GIN index for array operations

-- ================================================
-- TASKS TABLE
-- ================================================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    assigned_user_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_tasks_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assigned_user FOREIGN KEY (assigned_user_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT tasks_uuid_key UNIQUE (uuid),
    CONSTRAINT tasks_due_date_check CHECK (due_date IS NULL OR due_date >= CURRENT_DATE - INTERVAL '1 year')
);

-- Indexes for tasks
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_title ON tasks(title);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assigned_user_id ON tasks(assigned_user_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_client_status ON tasks(client_id, status);
CREATE INDEX idx_tasks_client_due_date ON tasks(client_id, due_date);
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_user_id, status) WHERE assigned_user_id IS NOT NULL;
CREATE INDEX idx_tasks_status_due_date ON tasks(status, due_date) WHERE due_date IS NOT NULL;

-- ================================================
-- CREDENTIALS TABLE
-- ================================================
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    label VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    encrypted_value BYTEA, -- Encrypted password/token/key
    url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_credentials_client FOREIGN KEY (client_id) 
        REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT credentials_uuid_key UNIQUE (uuid),
    CONSTRAINT credentials_url_check CHECK (url IS NULL OR url ~* '^https?://'),
    CONSTRAINT credentials_label_not_empty CHECK (LENGTH(TRIM(label)) > 0)
);

-- Indexes for credentials
CREATE INDEX idx_credentials_client_id ON credentials(client_id);
CREATE INDEX idx_credentials_label ON credentials(label);
CREATE INDEX idx_credentials_username ON credentials(username);
CREATE INDEX idx_credentials_created_at ON credentials(created_at);
CREATE INDEX idx_credentials_updated_at ON credentials(updated_at);

-- Composite index for client credentials
CREATE INDEX idx_credentials_client_label ON credentials(client_id, label);

-- ================================================
-- CREDENTIAL_AUDIT_LOGS TABLE
-- ================================================
CREATE TABLE credential_audit_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    credential_id INTEGER NOT NULL,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'decrypt')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    -- Foreign key constraints
    CONSTRAINT fk_credential_audit_logs_credential FOREIGN KEY (credential_id) 
        REFERENCES credentials(id) ON DELETE CASCADE,
    CONSTRAINT fk_credential_audit_logs_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT credential_audit_logs_uuid_key UNIQUE (uuid),
    CONSTRAINT credential_audit_logs_action_not_empty CHECK (LENGTH(TRIM(action)) > 0)
);

-- Indexes for credential_audit_logs
CREATE INDEX idx_credential_audit_logs_credential_id ON credential_audit_logs(credential_id);
CREATE INDEX idx_credential_audit_logs_user_id ON credential_audit_logs(user_id);
CREATE INDEX idx_credential_audit_logs_action ON credential_audit_logs(action);
CREATE INDEX idx_credential_audit_logs_created_at ON credential_audit_logs(created_at);
CREATE INDEX idx_credential_audit_logs_ip_address ON credential_audit_logs(ip_address);

-- Composite indexes for audit queries
CREATE INDEX idx_credential_audit_logs_credential_created_at ON credential_audit_logs(credential_id, created_at);
CREATE INDEX idx_credential_audit_logs_user_created_at ON credential_audit_logs(user_id, created_at) WHERE user_id IS NOT NULL;
CREATE INDEX idx_credential_audit_logs_action_created_at ON credential_audit_logs(action, created_at);

-- ================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at 
    BEFORE UPDATE ON credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log credential access
CREATE OR REPLACE FUNCTION log_credential_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log credential creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO credential_audit_logs (credential_id, action, ip_address)
        VALUES (NEW.id, 'create', inet_client_addr());
        RETURN NEW;
    END IF;
    
    -- Log credential updates
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO credential_audit_logs (credential_id, action, ip_address)
        VALUES (NEW.id, 'update', inet_client_addr());
        RETURN NEW;
    END IF;
    
    -- Log credential deletion
    IF TG_OP = 'DELETE' THEN
        INSERT INTO credential_audit_logs (credential_id, action, ip_address)
        VALUES (OLD.id, 'delete', inet_client_addr());
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for automatic credential audit logging
CREATE TRIGGER credential_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON credentials
    FOR EACH ROW EXECUTE FUNCTION log_credential_access();

-- ================================================
-- USEFUL VIEWS
-- ================================================

-- View: Client overview with task and credential counts
CREATE VIEW client_overview AS
SELECT 
    c.*,
    COALESCE(t.task_count, 0) as task_count,
    COALESCE(t.pending_tasks, 0) as pending_tasks,
    COALESCE(t.overdue_tasks, 0) as overdue_tasks,
    COALESCE(cr.credential_count, 0) as credential_count,
    u.name as owner_name,
    u.email as owner_email
FROM clients c
LEFT JOIN users u ON c.owner_user_id = u.id
LEFT JOIN (
    SELECT 
        client_id,
        COUNT(*) as task_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress') AND due_date < CURRENT_DATE) as overdue_tasks
    FROM tasks 
    GROUP BY client_id
) t ON c.id = t.client_id
LEFT JOIN (
    SELECT 
        client_id,
        COUNT(*) as credential_count
    FROM credentials 
    GROUP BY client_id
) cr ON c.id = cr.client_id;

-- View: Task overview with client and assignee information
CREATE VIEW task_overview AS
SELECT 
    t.*,
    c.name as client_name,
    c.company as client_company,
    c.email as client_email,
    u.name as assigned_user_name,
    u.email as assigned_user_email,
    CASE 
        WHEN t.due_date < CURRENT_DATE AND t.status IN ('pending', 'in_progress') THEN 'overdue'
        WHEN t.due_date = CURRENT_DATE AND t.status IN ('pending', 'in_progress') THEN 'due_today'
        WHEN t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' 
             AND t.status IN ('pending', 'in_progress') THEN 'due_soon'
        ELSE 'normal'
    END as urgency_status
FROM tasks t
JOIN clients c ON t.client_id = c.id
LEFT JOIN users u ON t.assigned_user_id = u.id;

-- View: Credential audit summary
CREATE VIEW credential_audit_summary AS
SELECT 
    c.id as credential_id,
    c.label,
    cl.name as client_name,
    COUNT(cal.id) as total_accesses,
    COUNT(cal.id) FILTER (WHERE cal.action = 'view') as view_count,
    COUNT(cal.id) FILTER (WHERE cal.action = 'decrypt') as decrypt_count,
    MAX(cal.created_at) as last_accessed,
    COUNT(DISTINCT cal.user_id) as unique_users
FROM credentials c
JOIN clients cl ON c.client_id = cl.id
LEFT JOIN credential_audit_logs cal ON c.id = cal.credential_id
GROUP BY c.id, c.label, cl.name;

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to encrypt credential values
CREATE OR REPLACE FUNCTION encrypt_credential_value(plaintext TEXT, key TEXT DEFAULT 'default_encryption_key')
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(plaintext, key);
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt credential values
CREATE OR REPLACE FUNCTION decrypt_credential_value(encrypted_value BYTEA, key TEXT DEFAULT 'default_encryption_key')
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_value, key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL; -- Return NULL if decryption fails
END;
$$ LANGUAGE plpgsql;

-- Function to search clients by tags
CREATE OR REPLACE FUNCTION find_clients_by_tag(tag_name TEXT)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    company VARCHAR(255),
    email VARCHAR(255),
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.company, c.email, c.tags
    FROM clients c
    WHERE tag_name = ANY(c.tags);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Additional specialized indexes
CREATE INDEX idx_clients_status_owner ON clients(status, owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_tasks_overdue ON tasks(client_id, due_date) WHERE status IN ('pending', 'in_progress') AND due_date < CURRENT_DATE;
CREATE INDEX idx_tasks_due_today ON tasks(assigned_user_id, due_date) WHERE status IN ('pending', 'in_progress') AND due_date = CURRENT_DATE;

-- Partial indexes for active records only
CREATE INDEX idx_clients_active ON clients(name, company) WHERE status = 'active';
CREATE INDEX idx_users_active ON users(name, email) WHERE is_active = TRUE;

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE users IS 'System users who can own clients and be assigned tasks';
COMMENT ON TABLE clients IS 'Client/customer information with contact details and metadata';
COMMENT ON TABLE tasks IS 'Tasks associated with clients, can be assigned to users';
COMMENT ON TABLE credentials IS 'Encrypted credentials associated with clients';
COMMENT ON TABLE credential_audit_logs IS 'Audit trail for credential access and modifications';

COMMENT ON COLUMN clients.tags IS 'Array of tags for categorizing clients';
COMMENT ON COLUMN clients.timezone IS 'Client timezone for scheduling and communication';
COMMENT ON COLUMN credentials.encrypted_value IS 'Encrypted password/token using pgcrypto';
COMMENT ON COLUMN credential_audit_logs.ip_address IS 'IP address of user accessing credentials';
COMMENT ON COLUMN credential_audit_logs.user_agent IS 'Browser/client user agent string';

-- ================================================
-- SAMPLE USAGE EXAMPLES (commented out)
-- ================================================

/*
-- Example: Insert a user
INSERT INTO users (name, email, password_hash, role) 
VALUES ('John Admin', 'admin@company.com', crypt('password123', gen_salt('bf')), 'admin');

-- Example: Insert a client with tags
INSERT INTO clients (name, company, email, phone, tags, owner_user_id) 
VALUES ('Jane Smith', 'Tech Corp', 'jane@techcorp.com', '+1234567890', ARRAY['vip', 'enterprise'], 1);

-- Example: Insert a task
INSERT INTO tasks (client_id, title, description, status, priority, due_date, assigned_user_id)
VALUES (1, 'Setup new website', 'Create and deploy new corporate website', 'pending', 'high', '2025-11-15', 1);

-- Example: Insert encrypted credential
INSERT INTO credentials (client_id, label, username, encrypted_value, url)
VALUES (1, 'WordPress Admin', 'admin', encrypt_credential_value('secret123'), 'https://techcorp.com/wp-admin');

-- Example: Search clients by tag
SELECT * FROM find_clients_by_tag('enterprise');

-- Example: Get overdue tasks
SELECT * FROM task_overview WHERE urgency_status = 'overdue';

-- Example: Get credential audit history
SELECT * FROM credential_audit_summary WHERE decrypt_count > 0 ORDER BY last_accessed DESC;
*/