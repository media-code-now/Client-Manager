#!/bin/bash

# PostgreSQL Mini CRM Demo Script
# This script demonstrates the functionality of our Mini CRM database

export PATH="/usr/local/opt/postgresql@14/bin:$PATH"

echo "=== PostgreSQL Mini CRM Database Demo ==="
echo ""

echo "1. Checking database connection..."
psql -d mini_crm -c "SELECT version();" | head -3

echo ""
echo "2. Total records in each table:"
psql -d mini_crm -c "
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL  
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Credentials', COUNT(*) FROM credentials
UNION ALL
SELECT 'Credential Audit Logs', COUNT(*) FROM credential_audit_logs;"

echo ""
echo "3. Active clients with their statistics:"
psql -d mini_crm -c "
SELECT 
    name, 
    company, 
    status, 
    task_count, 
    pending_tasks, 
    credential_count,
    owner_name
FROM client_overview 
WHERE status = 'active' 
ORDER BY task_count DESC;"

echo ""
echo "4. Tasks due soon or overdue:"
psql -d mini_crm -c "
SELECT 
    title, 
    client_name, 
    status, 
    priority, 
    due_date, 
    urgency_status
FROM task_overview 
WHERE urgency_status IN ('overdue', 'due_today', 'due_soon')
ORDER BY due_date;"

echo ""
echo "5. Finding clients by tags (enterprise clients):"
psql -d mini_crm -c "
SELECT name, company, tags 
FROM clients 
WHERE 'enterprise' = ANY(tags);"

echo ""
echo "6. PostgreSQL array operations (clients with tech or high-value tags):"
psql -d mini_crm -c "
SELECT name, company, tags 
FROM clients 
WHERE tags && ARRAY['tech', 'high-value'];"

echo ""
echo "7. User roles and status:"
psql -d mini_crm -c "
SELECT name, email, role, is_active, timezone 
FROM users 
ORDER BY role, name;"

echo ""
echo "=== Demo Complete ==="
echo "Your PostgreSQL Mini CRM database is working perfectly!"
echo ""
echo "To connect directly: psql -d mini_crm"
echo "To stop PostgreSQL: brew services stop postgresql@14"