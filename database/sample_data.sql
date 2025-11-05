-- Sample Data for Client Manager Database
-- This file contains test data to populate the database for development and testing

-- ================================================
-- SAMPLE CLIENTS
-- ================================================

INSERT INTO clients (name, email, phone, company, address, city, state, country, postal_code, website, notes, status, priority, created_by) VALUES
('John Smith', 'john@techstartup.com', '+1-555-0101', 'Tech Startup Inc', '123 Innovation Drive', 'San Francisco', 'CA', 'USA', '94105', 'https://techstartup.com', 'Early stage startup, very responsive client', 'active', 'high', 'admin'),
('Sarah Johnson', 'sarah@designstudio.com', '+1-555-0102', 'Creative Design Studio', '456 Art Street', 'New York', 'NY', 'USA', '10001', 'https://designstudio.com', 'Design agency specializing in branding', 'active', 'medium', 'admin'),
('Michael Brown', 'mike@retailplus.com', '+1-555-0103', 'Retail Plus LLC', '789 Commerce Blvd', 'Chicago', 'IL', 'USA', '60601', 'https://retailplus.com', 'E-commerce retail company', 'active', 'medium', 'admin'),
('Emma Wilson', 'emma@lawfirm.com', '+1-555-0104', 'Wilson & Associates Law', '321 Legal Lane', 'Boston', 'MA', 'USA', '02101', 'https://lawfirm.com', 'Corporate law firm', 'active', 'low', 'admin'),
('David Chen', 'david@fooddelivery.com', '+1-555-0105', 'QuickBite Delivery', '654 Food Court', 'Austin', 'TX', 'USA', '73301', 'https://fooddelivery.com', 'Food delivery platform', 'inactive', 'low', 'admin');

-- ================================================
-- SAMPLE CLIENT CONTACTS
-- ================================================

INSERT INTO client_contacts (client_id, name, title, email, phone, mobile, is_primary, notes) VALUES
(1, 'John Smith', 'CEO', 'john@techstartup.com', '+1-555-0101', '+1-555-0111', TRUE, 'Main point of contact'),
(1, 'Jane Doe', 'CTO', 'jane@techstartup.com', '+1-555-0121', '+1-555-0131', FALSE, 'Technical contact'),
(2, 'Sarah Johnson', 'Creative Director', 'sarah@designstudio.com', '+1-555-0102', '+1-555-0112', TRUE, 'Primary contact'),
(2, 'Mark Davis', 'Project Manager', 'mark@designstudio.com', '+1-555-0122', '+1-555-0132', FALSE, 'Project coordination'),
(3, 'Michael Brown', 'Owner', 'mike@retailplus.com', '+1-555-0103', '+1-555-0113', TRUE, 'Business owner'),
(4, 'Emma Wilson', 'Partner', 'emma@lawfirm.com', '+1-555-0104', '+1-555-0114', TRUE, 'Managing partner'),
(5, 'David Chen', 'Founder', 'david@fooddelivery.com', '+1-555-0105', '+1-555-0115', TRUE, 'Company founder');

-- ================================================
-- SAMPLE TASKS
-- ================================================

INSERT INTO tasks (client_id, title, description, status, priority, due_date, start_date, estimated_hours, billable, hourly_rate, tags, created_by, assigned_to) VALUES
(1, 'Website Redesign', 'Complete redesign of company website with modern UI/UX', 'in-progress', 'high', '2025-11-15', '2025-10-15', 40.00, TRUE, 75.00, '["web-design", "ui-ux", "responsive"]', 'admin', 'designer1'),
(1, 'Mobile App Development', 'Develop iOS and Android mobile application', 'pending', 'high', '2025-12-01', '2025-11-01', 120.00, TRUE, 85.00, '["mobile", "ios", "android", "react-native"]', 'admin', 'developer1'),
(2, 'Brand Identity Package', 'Create complete brand identity including logo, colors, fonts', 'completed', 'medium', '2025-10-30', '2025-10-01', 25.00, TRUE, 65.00, '["branding", "logo", "identity"]', 'admin', 'designer2'),
(2, 'Marketing Materials', 'Design business cards, brochures, and digital assets', 'pending', 'medium', '2025-11-20', '2025-11-05', 15.00, TRUE, 65.00, '["print-design", "marketing", "collateral"]', 'admin', 'designer2'),
(3, 'E-commerce Integration', 'Integrate payment gateway and inventory management', 'in-progress', 'high', '2025-11-10', '2025-10-20', 35.00, TRUE, 80.00, '["e-commerce", "payment", "integration"]', 'admin', 'developer2'),
(3, 'SEO Optimization', 'Optimize website for search engines', 'pending', 'medium', '2025-11-25', '2025-11-15', 20.00, TRUE, 60.00, '["seo", "optimization", "marketing"]', 'admin', 'marketing1'),
(4, 'Case Management System', 'Custom CRM for legal case management', 'pending', 'low', '2025-12-15', '2025-11-20', 60.00, TRUE, 90.00, '["crm", "legal", "case-management"]', 'admin', 'developer1'),
(5, 'App Performance Audit', 'Analyze and improve app performance', 'on-hold', 'low', '2025-11-30', '2025-11-01', 15.00, TRUE, 70.00, '["performance", "audit", "optimization"]', 'admin', 'developer2');

-- ================================================
-- SAMPLE CREDENTIALS
-- ================================================

INSERT INTO credentials (client_id, title, type, website_url, username, email, password_encrypted, password_hint, host, port, notes, is_active, created_by) VALUES
(1, 'WordPress Admin', 'login', 'https://techstartup.com/wp-admin', 'admin', 'admin@techstartup.com', 'encrypted_password_1', 'Company name + year', NULL, NULL, 'Main WordPress admin account', TRUE, 'admin'),
(1, 'FTP Access', 'ftp', NULL, 'techstartup_ftp', NULL, 'encrypted_password_2', 'FTP + domain', 'ftp.techstartup.com', 21, 'Primary FTP account for file uploads', TRUE, 'admin'),
(1, 'Database Access', 'database', NULL, 'db_user', NULL, 'encrypted_password_3', 'Database + client', 'db.techstartup.com', 3306, 'MySQL database credentials', TRUE, 'admin'),
(2, 'WordPress Admin', 'login', 'https://designstudio.com/admin', 'sarah_admin', 'sarah@designstudio.com', 'encrypted_password_4', 'First name + studio', NULL, NULL, 'Design studio admin panel', TRUE, 'admin'),
(2, 'Google Analytics', 'login', 'https://analytics.google.com', 'sarah@designstudio.com', 'sarah@designstudio.com', 'encrypted_password_5', 'Analytics + year', NULL, NULL, 'Google Analytics access', TRUE, 'admin'),
(3, 'Shopify Admin', 'login', 'https://retailplus.myshopify.com/admin', 'mike_retail', 'mike@retailplus.com', 'encrypted_password_6', 'Retail + plus', NULL, NULL, 'Shopify store administration', TRUE, 'admin'),
(3, 'Email Account', 'email', 'https://mail.retailplus.com', 'support', 'support@retailplus.com', 'encrypted_password_7', 'Support + domain', 'mail.retailplus.com', 993, 'Customer support email', TRUE, 'admin'),
(4, 'Case Management Login', 'login', 'https://casemanager.lawfirm.com', 'emma_law', 'emma@lawfirm.com', 'encrypted_password_8', 'Law + firm', NULL, NULL, 'Legal case management system', TRUE, 'admin'),
(4, 'Domain Registrar', 'domain', 'https://registrar.com', 'wilsonlaw', 'emma@lawfirm.com', 'encrypted_password_9', 'Wilson + law', NULL, NULL, 'Domain registration account', TRUE, 'admin'),
(5, 'App Store Connect', 'login', 'https://appstoreconnect.apple.com', 'david_foodapp', 'david@fooddelivery.com', 'encrypted_password_10', 'Food + delivery', NULL, NULL, 'iOS app management', FALSE, 'admin');

-- ================================================
-- SAMPLE TASK COMMENTS
-- ================================================

INSERT INTO task_comments (task_id, comment, is_internal, created_by) VALUES
(1, 'Initial wireframes have been approved by the client', FALSE, 'designer1'),
(1, 'Need to discuss color scheme preferences in next meeting', TRUE, 'designer1'),
(2, 'Waiting for client to provide app store credentials', FALSE, 'developer1'),
(3, 'Brand guidelines delivered and approved', FALSE, 'designer2'),
(3, 'Client loved the final logo design', FALSE, 'designer2'),
(5, 'Payment gateway integration is 80% complete', FALSE, 'developer2'),
(5, 'Need to test with sandbox environment first', TRUE, 'developer2');

-- ================================================
-- SAMPLE AUDIT LOG ENTRIES
-- ================================================

INSERT INTO audit_log (table_name, record_id, record_uuid, action, new_values, user_id, user_email, ip_address) VALUES
('clients', 1, (SELECT uuid FROM clients WHERE id = 1), 'CREATE', '{"name": "John Smith", "email": "john@techstartup.com", "company": "Tech Startup Inc"}', 'admin', 'admin@clientmanager.com', '192.168.1.100'),
('clients', 2, (SELECT uuid FROM clients WHERE id = 2), 'CREATE', '{"name": "Sarah Johnson", "email": "sarah@designstudio.com", "company": "Creative Design Studio"}', 'admin', 'admin@clientmanager.com', '192.168.1.100'),
('tasks', 1, (SELECT uuid FROM tasks WHERE id = 1), 'CREATE', '{"title": "Website Redesign", "client_id": 1, "status": "pending"}', 'admin', 'admin@clientmanager.com', '192.168.1.100'),
('tasks', 1, (SELECT uuid FROM tasks WHERE id = 1), 'UPDATE', '{"status": "in-progress"}', 'designer1', 'designer1@clientmanager.com', '192.168.1.101'),
('credentials', 1, (SELECT uuid FROM credentials WHERE id = 1), 'CREATE', '{"title": "WordPress Admin", "client_id": 1, "type": "login"}', 'admin', 'admin@clientmanager.com', '192.168.1.100');

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Uncomment these to verify the data was inserted correctly

-- SELECT 'Clients Count' as Table_Name, COUNT(*) as Record_Count FROM clients
-- UNION ALL
-- SELECT 'Tasks Count', COUNT(*) FROM tasks
-- UNION ALL  
-- SELECT 'Credentials Count', COUNT(*) FROM credentials
-- UNION ALL
-- SELECT 'Client Contacts Count', COUNT(*) FROM client_contacts
-- UNION ALL
-- SELECT 'Task Comments Count', COUNT(*) FROM task_comments
-- UNION ALL
-- SELECT 'Audit Log Count', COUNT(*) FROM audit_log;

-- Test the views
-- SELECT * FROM client_overview LIMIT 3;
-- SELECT * FROM task_overview WHERE urgency_status != 'normal' LIMIT 5;