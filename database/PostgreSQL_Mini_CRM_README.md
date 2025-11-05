# PostgreSQL Mini CRM Database Schema

## Overview

This PostgreSQL-native schema provides a comprehensive mini CRM system with advanced features including encrypted credential storage, comprehensive audit logging, and timezone support. The schema leverages PostgreSQL-specific features like arrays, JSONB, advanced indexing, and built-in encryption.

## Database Structure

### Core Tables

#### 1. `users` (Optional User Management)
**Purpose**: System users who can own clients and be assigned tasks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing primary key |
| `uuid` | UUID | UNIQUE, NOT NULL | External reference identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | CHECK constraint | admin, manager, user |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account status |
| `timezone` | VARCHAR(100) | DEFAULT 'UTC' | User's timezone |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Indexes**: email, role, is_active, created_at

---

#### 2. `clients`
**Purpose**: Client/customer information with advanced metadata

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing primary key |
| `uuid` | UUID | UNIQUE, NOT NULL | External reference identifier |
| `name` | VARCHAR(255) | NOT NULL | Client's full name |
| `company` | VARCHAR(255) | | Company name |
| `email` | VARCHAR(255) | Email validation | Client's email address |
| `phone` | VARCHAR(50) | | Primary phone number |
| `status` | VARCHAR(50) | CHECK constraint | active, inactive, prospect, archived |
| `tags` | TEXT[] | DEFAULT '{}' | Array of categorization tags |
| `timezone` | VARCHAR(100) | DEFAULT 'UTC' | Client's timezone |
| `website_url` | VARCHAR(500) | URL validation | Company website |
| `notes` | TEXT | | Additional notes |
| `owner_user_id` | INTEGER | FK to users(id) | Assigned user owner |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Foreign Keys**: 
- `owner_user_id` → `users(id)` (SET NULL on delete)

**Indexes**: name, company, email, status, owner_user_id, created_at, updated_at, GIN index on tags, composite indexes for performance

---

#### 3. `tasks`
**Purpose**: Task management linked to clients with user assignment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing primary key |
| `uuid` | UUID | UNIQUE, NOT NULL | External reference identifier |
| `client_id` | INTEGER | NOT NULL, FK | Reference to clients table |
| `title` | VARCHAR(255) | NOT NULL | Task title |
| `description` | TEXT | | Detailed task description |
| `status` | VARCHAR(50) | CHECK constraint | pending, in_progress, completed, cancelled, on_hold |
| `priority` | VARCHAR(50) | CHECK constraint | low, medium, high, urgent |
| `due_date` | DATE | Date validation | Task deadline |
| `assigned_user_id` | INTEGER | FK to users(id) | Assigned user |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Foreign Keys**: 
- `client_id` → `clients(id)` (CASCADE delete)
- `assigned_user_id` → `users(id)` (SET NULL on delete)

**Indexes**: Comprehensive indexing including composite indexes for common query patterns, partial indexes for overdue and due-today tasks

---

#### 4. `credentials`
**Purpose**: Encrypted credential storage with PostgreSQL native encryption

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing primary key |
| `uuid` | UUID | UNIQUE, NOT NULL | External reference identifier |
| `client_id` | INTEGER | NOT NULL, FK | Reference to clients table |
| `label` | VARCHAR(255) | NOT NULL | Credential description |
| `username` | VARCHAR(255) | | Username or account name |
| `encrypted_value` | BYTEA | | Encrypted password using pgcrypto |
| `url` | VARCHAR(500) | URL validation | Login or service URL |
| `notes` | TEXT | | Additional notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Foreign Keys**: 
- `client_id` → `clients(id)` (CASCADE delete)

**Indexes**: client_id, label, username, created_at, updated_at, composite index on client_id+label

---

#### 5. `credential_audit_logs`
**Purpose**: Comprehensive audit trail for credential access and modifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing primary key |
| `uuid` | UUID | UNIQUE, NOT NULL | External reference identifier |
| `credential_id` | INTEGER | NOT NULL, FK | Reference to credentials table |
| `user_id` | INTEGER | FK to users(id) | User who performed action |
| `action` | VARCHAR(50) | CHECK constraint | view, create, update, delete, decrypt |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When action occurred |
| `ip_address` | INET | | Client IP address |
| `user_agent` | TEXT | | Browser/client information |

**Foreign Keys**: 
- `credential_id` → `credentials(id)` (CASCADE delete)
- `user_id` → `users(id)` (SET NULL on delete)

**Indexes**: Extensive indexing for audit queries including composite indexes for time-based and user-based queries

---

## PostgreSQL-Specific Features

### Advanced Data Types
- **UUID**: Native UUID generation with `gen_random_uuid()`
- **INET**: IP address storage with built-in validation
- **TEXT[]**: Native array type for tags with GIN indexing
- **BYTEA**: Binary data for encrypted credentials
- **TIMESTAMP WITH TIME ZONE**: Timezone-aware timestamps

### Extensions Used
- **uuid-ossp**: UUID generation functions
- **pgcrypto**: Encryption and hashing functions

### Advanced Indexing
- **GIN Index**: For array operations on tags
- **Partial Indexes**: For filtered queries (active records, overdue tasks)
- **Composite Indexes**: For multi-column query optimization
- **Expression Indexes**: For computed values

---

## Security Features

### Encryption
- **Native pgcrypto**: Uses PostgreSQL's built-in encryption
- **Symmetric Encryption**: `pgp_sym_encrypt()` for credential values
- **Key Management**: Configurable encryption keys
- **Safe Decryption**: Error handling for decryption failures

### Audit Trail
- **Automatic Logging**: Triggers log credential access automatically
- **Comprehensive Tracking**: IP addresses, user agents, timestamps
- **Action Types**: Create, update, delete, view, decrypt operations
- **User Context**: Links actions to specific users

### Data Validation
- **Email Validation**: Regex constraints for email formats
- **URL Validation**: Regex constraints for website URLs
- **Status Constraints**: CHECK constraints for enum-like values
- **Date Validation**: Logical date range constraints

---

## Performance Optimization

### Strategic Indexing
```sql
-- High-performance indexes for common queries
CREATE INDEX idx_tasks_overdue ON tasks(client_id, due_date) 
    WHERE status IN ('pending', 'in_progress') AND due_date < CURRENT_DATE;

CREATE INDEX idx_clients_tags ON clients USING GIN(tags);

CREATE INDEX idx_credential_audit_logs_user_created_at 
    ON credential_audit_logs(user_id, created_at) 
    WHERE user_id IS NOT NULL;
```

### Query Optimization
- **Views**: Pre-computed joins for common queries
- **Filtered Indexes**: Partial indexes for active records only
- **Array Operations**: Optimized tag searching with GIN indexes

---

## Database Views

### `client_overview`
Comprehensive client summary with statistics:
```sql
SELECT * FROM client_overview WHERE status = 'active';
```
Includes: task counts, overdue tasks, credential counts, owner information

### `task_overview`
Enhanced task view with urgency classification:
```sql
SELECT * FROM task_overview WHERE urgency_status = 'overdue';
```
Includes: client information, assigned user, urgency status (overdue, due_today, due_soon, normal)

### `credential_audit_summary`
Security audit overview:
```sql
SELECT * FROM credential_audit_summary WHERE decrypt_count > 0;
```
Includes: access counts, last accessed time, unique user count

---

## Helper Functions

### Encryption Functions
```sql
-- Encrypt a credential value
SELECT encrypt_credential_value('my_password', 'encryption_key');

-- Decrypt a credential value
SELECT decrypt_credential_value(encrypted_data, 'encryption_key');
```

### Search Functions
```sql
-- Find clients by tag
SELECT * FROM find_clients_by_tag('enterprise');
```

### Automatic Functions
- **update_updated_at_column()**: Automatically updates timestamps
- **log_credential_access()**: Automatic audit logging

---

## Setup Instructions

### 1. Database Creation
```sql
CREATE DATABASE mini_crm;
\c mini_crm;
```

### 2. Run Migration
```bash
psql -U username -d mini_crm -f postgresql_mini_crm_001.sql
```

### 3. Add Sample Data
```bash
psql -U username -d mini_crm -f postgresql_mini_crm_sample_data.sql
```

### 4. Verify Installation
```sql
-- Check tables
\dt

-- Check views
\dv

-- Check functions
\df

-- Verify sample data
SELECT table_name, record_count FROM (
    SELECT 'users' as table_name, COUNT(*) as record_count FROM users
    UNION ALL
    SELECT 'clients', COUNT(*) FROM clients
    UNION ALL
    SELECT 'tasks', COUNT(*) FROM tasks
    UNION ALL
    SELECT 'credentials', COUNT(*) FROM credentials
    UNION ALL
    SELECT 'credential_audit_logs', COUNT(*) FROM credential_audit_logs
) counts ORDER BY table_name;
```

---

## Usage Examples

### Common Queries

```sql
-- Get active clients with task statistics
SELECT name, company, task_count, pending_tasks, credential_count 
FROM client_overview 
WHERE status = 'active' 
ORDER BY task_count DESC;

-- Find overdue tasks
SELECT title, client_name, due_date, priority, assigned_user_name
FROM task_overview 
WHERE urgency_status = 'overdue'
ORDER BY due_date;

-- Search clients by multiple tags
SELECT name, company, tags 
FROM clients 
WHERE tags && ARRAY['enterprise', 'high-value'];

-- Audit credential access
SELECT action, created_at, user_name, credential_label, ip_address
FROM credential_audit_logs cal
JOIN credentials c ON cal.credential_id = c.id
JOIN users u ON cal.user_id = u.id
WHERE cal.action = 'decrypt'
ORDER BY cal.created_at DESC;

-- Timezone-aware queries
SELECT name, created_at AT TIME ZONE timezone as local_time
FROM clients 
WHERE timezone != 'UTC';
```

### Security Operations

```sql
-- Create encrypted credential
INSERT INTO credentials (client_id, label, username, encrypted_value, url)
VALUES (1, 'WordPress Admin', 'admin', 
        encrypt_credential_value('secure_password'), 
        'https://example.com/wp-admin');

-- Manually log credential access
INSERT INTO credential_audit_logs (credential_id, user_id, action, ip_address)
VALUES (1, 1, 'decrypt', '192.168.1.100');

-- Find credentials that haven't been accessed recently
SELECT c.label, cl.name, MAX(cal.created_at) as last_access
FROM credentials c
JOIN clients cl ON c.client_id = cl.id
LEFT JOIN credential_audit_logs cal ON c.id = cal.credential_id
GROUP BY c.id, c.label, cl.name
HAVING MAX(cal.created_at) < NOW() - INTERVAL '30 days' OR MAX(cal.created_at) IS NULL;
```

---

## Maintenance and Monitoring

### Regular Maintenance
```sql
-- Analyze tables for query optimization
ANALYZE users, clients, tasks, credentials, credential_audit_logs;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Monitor table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Security Monitoring
```sql
-- Monitor unusual credential access patterns
SELECT 
    cal.credential_id,
    c.label,
    COUNT(*) as access_count,
    COUNT(DISTINCT cal.ip_address) as unique_ips,
    COUNT(DISTINCT cal.user_id) as unique_users
FROM credential_audit_logs cal
JOIN credentials c ON cal.credential_id = c.id
WHERE cal.created_at > NOW() - INTERVAL '24 hours'
GROUP BY cal.credential_id, c.label
HAVING COUNT(*) > 10 OR COUNT(DISTINCT cal.ip_address) > 3;
```

---

## Environment Compatibility

**Recommended**: PostgreSQL 12+
- Native UUID support
- Advanced GIN indexing
- JSON/JSONB operations
- pgcrypto extension
- Timezone support

**Features Used**:
- SERIAL data type
- CHECK constraints
- Array data types
- INET data type
- Triggers and functions
- Views with window functions
- Partial and composite indexes

This schema provides enterprise-grade security, performance, and functionality while leveraging PostgreSQL's advanced features for optimal performance and data integrity.