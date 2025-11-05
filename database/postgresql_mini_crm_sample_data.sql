-- Sample Data for PostgreSQL Mini CRM
-- This file contains test data to populate the database for development and testing

-- ================================================
-- SAMPLE USERS
-- ================================================

INSERT INTO users (name, email, password_hash, role, is_active, timezone) VALUES
('John Admin', 'admin@minicrm.com', crypt('admin123', gen_salt('bf')), 'admin', TRUE, 'America/New_York'),
('Sarah Manager', 'sarah@minicrm.com', crypt('manager123', gen_salt('bf')), 'manager', TRUE, 'America/Los_Angeles'),
('Mike Developer', 'mike@minicrm.com', crypt('dev123', gen_salt('bf')), 'user', TRUE, 'America/Chicago'),
('Lisa Designer', 'lisa@minicrm.com', crypt('design123', gen_salt('bf')), 'user', TRUE, 'Europe/London'),
('David Sales', 'david@minicrm.com', crypt('sales123', gen_salt('bf')), 'user', FALSE, 'Australia/Sydney');

-- ================================================
-- SAMPLE CLIENTS
-- ================================================

INSERT INTO clients (name, company, email, phone, status, tags, timezone, website_url, notes, owner_user_id) VALUES
('Alice Johnson', 'TechStart Inc', 'alice@techstart.com', '+1-555-0101', 'active', ARRAY['enterprise', 'high-value', 'tech'], 'America/New_York', 'https://techstart.com', 'Key enterprise client, very responsive', 1),
('Bob Wilson', 'Design Studios Pro', 'bob@designstudios.com', '+1-555-0102', 'active', ARRAY['creative', 'medium-value'], 'America/Los_Angeles', 'https://designstudios.com', 'Creative agency, prefers evening calls', 2),
('Carol Brown', 'E-Commerce Plus', 'carol@ecommerceplus.com', '+1-555-0103', 'prospect', ARRAY['retail', 'potential'], 'America/Chicago', 'https://ecommerceplus.com', 'Potential client, in negotiation phase', 1),
('Daniel Smith', 'Legal Advisors LLC', 'daniel@legaladvisors.com', '+1-555-0104', 'active', ARRAY['legal', 'corporate'], 'America/New_York', 'https://legaladvisors.com', 'Corporate law firm, strict confidentiality requirements', 3),
('Emma Davis', 'Food Delivery Co', 'emma@fooddelivery.com', '+1-555-0105', 'inactive', ARRAY['food', 'startup'], 'America/Los_Angeles', 'https://fooddelivery.com', 'Startup client, currently on hold', 2),
('Frank Miller', 'Construction Pro', 'frank@constructionpro.com', '+1-555-0106', 'active', ARRAY['construction', 'b2b'], 'America/Chicago', 'https://constructionpro.com', 'Construction company, prefers mobile contact', 4);

-- ================================================
-- SAMPLE TASKS
-- ================================================

INSERT INTO tasks (client_id, title, description, status, priority, due_date, assigned_user_id) VALUES
-- TechStart Inc tasks
(1, 'Website Redesign', 'Complete redesign of company website with modern UI/UX and responsive design', 'in_progress', 'high', '2025-11-20', 3),
(1, 'Mobile App Development', 'Develop native iOS and Android mobile application for customer portal', 'pending', 'high', '2025-12-15', 3),
(1, 'Database Migration', 'Migrate legacy database to PostgreSQL with data validation', 'completed', 'medium', '2025-10-30', 3),

-- Design Studios Pro tasks
(2, 'Brand Identity Package', 'Create complete brand identity including logo, colors, typography', 'completed', 'medium', '2025-10-25', 4),
(2, 'Marketing Collateral', 'Design business cards, brochures, and digital marketing materials', 'in_progress', 'medium', '2025-11-10', 4),
(2, 'Website Templates', 'Create 5 custom website templates for client portfolio', 'pending', 'low', '2025-11-30', 4),

-- E-Commerce Plus tasks
(3, 'Platform Evaluation', 'Evaluate e-commerce platforms and provide recommendations', 'pending', 'high', '2025-11-08', 1),
(3, 'Cost Estimation', 'Provide detailed cost estimation for proposed solutions', 'pending', 'medium', '2025-11-12', 1),

-- Legal Advisors LLC tasks
(4, 'Document Management System', 'Implement secure document management system with encryption', 'in_progress', 'high', '2025-11-25', 2),
(4, 'Compliance Audit', 'Conduct security and compliance audit of existing systems', 'pending', 'urgent', '2025-11-15', 2),

-- Food Delivery Co tasks (on hold)
(5, 'App Performance Review', 'Review and optimize mobile app performance', 'on_hold', 'low', '2025-12-01', 3),

-- Construction Pro tasks
(6, 'Project Management Tool', 'Setup and customize project management software', 'pending', 'medium', '2025-11-18', 2),
(6, 'Mobile Site Optimization', 'Optimize website for mobile devices and tablets', 'pending', 'high', '2025-11-22', 4);

-- ================================================
-- SAMPLE CREDENTIALS
-- ================================================

INSERT INTO credentials (client_id, label, username, encrypted_value, url, notes) VALUES
-- TechStart Inc credentials
(1, 'WordPress Admin', 'admin', encrypt_credential_value('TechStart2025!'), 'https://techstart.com/wp-admin', 'Main admin account for website management'),
(1, 'FTP Access', 'techstart_ftp', encrypt_credential_value('ftp_secure_pass'), 'ftp://ftp.techstart.com', 'Primary FTP account for file uploads'),
(1, 'Database Admin', 'db_admin', encrypt_credential_value('db_admin_2025'), NULL, 'PostgreSQL database administrator account'),
(1, 'Google Analytics', 'alice@techstart.com', encrypt_credential_value('analytics_pass'), 'https://analytics.google.com', 'Google Analytics dashboard access'),

-- Design Studios Pro credentials
(2, 'Adobe Creative Cloud', 'bob@designstudios.com', encrypt_credential_value('adobe_creative_2025'), 'https://creative.adobe.com', 'Team Adobe Creative Cloud subscription'),
(2, 'Website Admin', 'studio_admin', encrypt_credential_value('design_admin_pass'), 'https://designstudios.com/admin', 'Website administration panel'),
(2, 'Social Media Manager', 'designstudios', encrypt_credential_value('social_2025'), 'https://hootsuite.com', 'Social media management dashboard'),

-- Legal Advisors LLC credentials
(4, 'Case Management System', 'daniel.smith', encrypt_credential_value('legal_secure_2025'), 'https://casemanager.legaladvisors.com', 'Primary case management system login'),
(4, 'Document Vault', 'legal_vault', encrypt_credential_value('vault_secure_key'), 'https://vault.legaladvisors.com', 'Encrypted document storage system'),
(4, 'Email Admin', 'admin@legaladvisors.com', encrypt_credential_value('email_admin_2025'), 'https://mail.legaladvisors.com', 'Email server administration'),

-- Construction Pro credentials
(6, 'Project Software', 'frank.miller', encrypt_credential_value('project_2025'), 'https://projectmanager.constructionpro.com', 'Project management software access'),
(6, 'Accounting System', 'accounting', encrypt_credential_value('accounting_secure'), 'https://quickbooks.intuit.com', 'QuickBooks online accounting');

-- ================================================
-- SAMPLE CREDENTIAL AUDIT LOGS
-- ================================================

-- Insert some manual audit log entries to show the system in action
INSERT INTO credential_audit_logs (credential_id, user_id, action, ip_address, user_agent) VALUES
(1, 1, 'view', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(1, 1, 'decrypt', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(2, 3, 'view', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(4, 2, 'view', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
(4, 2, 'decrypt', '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
(8, 2, 'view', '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'),
(9, 2, 'decrypt', '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'),
(5, 4, 'view', '192.168.1.104', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(11, 2, 'view', '192.168.1.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Count records in each table
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL  
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Credentials', COUNT(*) FROM credentials
UNION ALL
SELECT 'Credential Audit Logs', COUNT(*) FROM credential_audit_logs;

-- ================================================
-- SAMPLE QUERIES TO TEST THE SCHEMA
-- ================================================

-- Test client overview view
SELECT 
    name, 
    company, 
    status, 
    task_count, 
    pending_tasks, 
    overdue_tasks, 
    credential_count,
    owner_name
FROM client_overview 
WHERE status = 'active' 
ORDER BY task_count DESC;

-- Test task overview view
SELECT 
    title, 
    client_name, 
    status, 
    priority, 
    due_date, 
    urgency_status,
    assigned_user_name
FROM task_overview 
WHERE urgency_status IN ('overdue', 'due_today', 'due_soon')
ORDER BY 
    CASE urgency_status 
        WHEN 'overdue' THEN 1 
        WHEN 'due_today' THEN 2 
        WHEN 'due_soon' THEN 3 
        ELSE 4 
    END, 
    due_date;

-- Test credential audit summary view
SELECT 
    label, 
    client_name, 
    total_accesses, 
    view_count, 
    decrypt_count, 
    last_accessed, 
    unique_users
FROM credential_audit_summary 
WHERE total_accesses > 0
ORDER BY last_accessed DESC;

-- Test finding clients by tag
SELECT * FROM find_clients_by_tag('enterprise');
SELECT * FROM find_clients_by_tag('high-value');

-- Test encrypted credential handling
SELECT 
    c.label,
    cl.name as client_name,
    c.username,
    -- Decrypt a credential (in practice, this would be done securely in application)
    decrypt_credential_value(c.encrypted_value) as decrypted_value
FROM credentials c
JOIN clients cl ON c.client_id = cl.id
WHERE c.id = 1; -- Only decrypt one for testing

-- Test array operations on tags
SELECT name, company, tags 
FROM clients 
WHERE 'tech' = ANY(tags) OR 'enterprise' = ANY(tags);

-- Test timezone-aware queries
SELECT 
    name, 
    timezone, 
    created_at,
    created_at AT TIME ZONE timezone as local_created_at
FROM clients 
WHERE created_at IS NOT NULL;

-- Test overdue tasks query
SELECT 
    t.title,
    c.name as client_name,
    t.due_date,
    t.status,
    t.priority,
    u.name as assigned_to
FROM tasks t
JOIN clients c ON t.client_id = c.id
LEFT JOIN users u ON t.assigned_user_id = u.id
WHERE t.due_date < CURRENT_DATE 
AND t.status IN ('pending', 'in_progress')
ORDER BY t.due_date, t.priority DESC;

-- Test credential security audit
SELECT 
    cal.action,
    cal.created_at,
    u.name as user_name,
    c.label as credential_label,
    cl.name as client_name,
    cal.ip_address
FROM credential_audit_logs cal
JOIN credentials c ON cal.credential_id = c.id
JOIN clients cl ON c.client_id = cl.id
LEFT JOIN users u ON cal.user_id = u.id
WHERE cal.action IN ('decrypt', 'view')
ORDER BY cal.created_at DESC
LIMIT 10;