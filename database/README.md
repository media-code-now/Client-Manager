# Client Manager Database Documentation

## Overview

This database schema is designed for a comprehensive Client Management System that handles clients, tasks, credentials, and maintains an audit trail of all changes. The schema is optimized for performance with proper indexing and includes additional tables for enhanced functionality.

## Database Structure

### Core Tables

#### 1. `clients`
**Purpose**: Store client information and company details

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key, auto-increment |
| `uuid` | VARCHAR(36) | Unique identifier for external references |
| `name` | VARCHAR(255) | Client's full name |
| `email` | VARCHAR(255) | Client's email address (unique) |
| `phone` | VARCHAR(50) | Primary phone number |
| `company` | VARCHAR(255) | Company name |
| `address` | TEXT | Full address |
| `city` | VARCHAR(100) | City |
| `state` | VARCHAR(100) | State/Province |
| `country` | VARCHAR(100) | Country |
| `postal_code` | VARCHAR(20) | ZIP/Postal code |
| `website` | VARCHAR(255) | Company website |
| `notes` | TEXT | Additional notes |
| `status` | ENUM | active, inactive, archived |
| `priority` | ENUM | low, medium, high, critical |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `created_by` | VARCHAR(255) | User who created the record |
| `updated_by` | VARCHAR(255) | User who last updated the record |

**Indexes**: email, company, status, created_at, uuid

---

#### 2. `tasks`
**Purpose**: Manage client tasks and projects

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key, auto-increment |
| `uuid` | VARCHAR(36) | Unique identifier |
| `client_id` | INT (FK) | Reference to clients table |
| `title` | VARCHAR(255) | Task title |
| `description` | TEXT | Detailed task description |
| `status` | ENUM | pending, in-progress, completed, cancelled, on-hold |
| `priority` | ENUM | low, medium, high, critical |
| `due_date` | DATE | Task deadline |
| `start_date` | DATE | Task start date |
| `completion_date` | TIMESTAMP | Actual completion time |
| `estimated_hours` | DECIMAL(5,2) | Estimated time to complete |
| `actual_hours` | DECIMAL(5,2) | Actual time spent |
| `billable` | BOOLEAN | Whether task is billable |
| `hourly_rate` | DECIMAL(8,2) | Billing rate per hour |
| `tags` | JSON | Array of tags for categorization |
| `attachments` | JSON | Array of file paths/URLs |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `created_by` | VARCHAR(255) | User who created the task |
| `updated_by` | VARCHAR(255) | User who last updated the task |
| `assigned_to` | VARCHAR(255) | User assigned to the task |

**Foreign Keys**: `client_id` → `clients(id)` (CASCADE DELETE)

**Indexes**: client_id, status, priority, due_date, assigned_to, created_at, uuid, composite indexes for common queries

---

#### 3. `credentials`
**Purpose**: Store client login credentials and access information securely

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key, auto-increment |
| `uuid` | VARCHAR(36) | Unique identifier |
| `client_id` | INT (FK) | Reference to clients table |
| `title` | VARCHAR(255) | Credential title (e.g., "WordPress Admin") |
| `type` | ENUM | login, ftp, database, email, social_media, hosting, domain, api_key, license, other |
| `website_url` | VARCHAR(500) | Login URL |
| `username` | VARCHAR(255) | Username |
| `email` | VARCHAR(255) | Associated email |
| `password_encrypted` | TEXT | Encrypted password |
| `password_hint` | VARCHAR(255) | Password hint (never actual password) |
| `port` | INT | Port number (for FTP, database) |
| `host` | VARCHAR(255) | Host/server address |
| `database_name` | VARCHAR(255) | Database name (for database credentials) |
| `additional_info` | JSON | Extra fields as needed |
| `notes` | TEXT | Additional notes |
| `is_active` | BOOLEAN | Whether credential is active |
| `expires_at` | DATE | Expiration date (for licenses, subscriptions) |
| `last_used_at` | TIMESTAMP | Last time credential was accessed |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `created_by` | VARCHAR(255) | User who created the record |
| `updated_by` | VARCHAR(255) | User who last updated the record |

**Foreign Keys**: `client_id` → `clients(id)` (CASCADE DELETE)

**Indexes**: client_id, type, is_active, expires_at, uuid, composite indexes

---

#### 4. `audit_log`
**Purpose**: Track all changes to sensitive data for security and compliance

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key, auto-increment |
| `uuid` | VARCHAR(36) | Unique identifier |
| `table_name` | VARCHAR(50) | Name of the affected table |
| `record_id` | INT | ID of the affected record |
| `record_uuid` | VARCHAR(36) | UUID of the affected record |
| `action` | ENUM | CREATE, UPDATE, DELETE, VIEW |
| `old_values` | JSON | Previous values (for UPDATE/DELETE) |
| `new_values` | JSON | New values (for CREATE/UPDATE) |
| `changed_fields` | JSON | Array of changed field names |
| `user_id` | VARCHAR(255) | User who performed the action |
| `user_email` | VARCHAR(255) | Email of the user |
| `ip_address` | VARCHAR(45) | IP address of the user |
| `user_agent` | TEXT | Browser/client information |
| `session_id` | VARCHAR(255) | Session identifier |
| `timestamp` | TIMESTAMP | When the action occurred |

**Indexes**: table_name+record_id, table_name+record_uuid, action, user_id, timestamp, composite indexes

---

### Supporting Tables

#### 5. `client_contacts`
**Purpose**: Store multiple contacts per client

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key |
| `client_id` | INT (FK) | Reference to clients table |
| `name` | VARCHAR(255) | Contact's name |
| `title` | VARCHAR(255) | Job title |
| `email` | VARCHAR(255) | Contact email |
| `phone` | VARCHAR(50) | Phone number |
| `mobile` | VARCHAR(50) | Mobile number |
| `is_primary` | BOOLEAN | Primary contact flag |
| `notes` | TEXT | Additional notes |

#### 6. `task_comments`
**Purpose**: Store comments and notes for tasks

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key |
| `task_id` | INT (FK) | Reference to tasks table |
| `comment` | TEXT | Comment content |
| `is_internal` | BOOLEAN | Internal vs client-visible |
| `created_at` | TIMESTAMP | Comment creation time |
| `created_by` | VARCHAR(255) | User who created the comment |

#### 7. `attachments`
**Purpose**: Store file attachments for clients, tasks, and credentials

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Primary key |
| `attachable_type` | ENUM | client, task, credential |
| `attachable_id` | INT | ID of the parent record |
| `filename` | VARCHAR(255) | Stored filename |
| `original_filename` | VARCHAR(255) | Original filename |
| `file_path` | VARCHAR(500) | Full file path |
| `file_size` | BIGINT | File size in bytes |
| `mime_type` | VARCHAR(100) | File MIME type |

---

## Database Views

### `client_overview`
Provides a comprehensive view of clients with task and credential statistics:
- All client information
- Total task count
- Pending tasks count
- Overdue tasks count
- Active credentials count

### `task_overview`
Enhanced task view with client information and urgency status:
- All task information
- Client name, company, email
- Urgency status (overdue, due_today, due_soon, normal)

---

## Security Considerations

### Password Encryption
- All passwords in the `credentials` table must be encrypted using strong encryption (AES-256 recommended)
- Never store plain text passwords
- Use password hints instead of storing actual passwords for recovery

### Audit Trail
- All sensitive operations should be logged in the `audit_log` table
- Include user context, IP addresses, and timestamps
- Monitor for suspicious activities

### Access Control
- Implement role-based access control
- Limit access to credentials table to authorized users only
- Use database-level permissions to restrict access

---

## Performance Optimization

### Indexing Strategy
- Primary keys and foreign keys are automatically indexed
- Composite indexes for common query patterns
- Separate indexes for frequently searched columns

### Query Optimization
- Use the provided views for complex queries
- Implement pagination for large result sets
- Consider database connection pooling for high-traffic applications

---

## Backup and Maintenance

### Regular Backups
- Daily full backups recommended
- Test backup restoration procedures regularly
- Store backups securely and encrypt sensitive data

### Maintenance Tasks
- Regular ANALYZE TABLE operations
- Monitor index usage and performance
- Archive old audit log entries to maintain performance

---

## Usage Examples

### Common Queries

```sql
-- Get all active clients with their task counts
SELECT * FROM client_overview WHERE status = 'active';

-- Get overdue tasks
SELECT * FROM task_overview WHERE urgency_status = 'overdue';

-- Get credentials expiring soon
SELECT * FROM credentials 
WHERE expires_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);

-- Audit trail for a specific client
SELECT * FROM audit_log 
WHERE table_name = 'clients' AND record_id = 1 
ORDER BY timestamp DESC;
```

### Application Integration
1. Use UUIDs for external API references instead of internal IDs
2. Always log sensitive operations to the audit table
3. Implement soft deletes for important records if needed
4. Use transactions for multi-table operations

---

## Migration Instructions

1. **Initial Setup**: Run `001_initial_setup.sql` to create all tables and views
2. **Sample Data**: Run `sample_data.sql` to populate with test data
3. **Validation**: Verify all tables are created and sample data is inserted correctly
4. **Security**: Configure database users and permissions
5. **Backup**: Set up automated backup procedures

## Environment Compatibility

This schema is designed to work with:
- **MySQL 8.0+** (recommended)
- **MariaDB 10.3+**
- **PostgreSQL 12+** (with minor syntax adjustments)

For PostgreSQL, replace:
- `AUTO_INCREMENT` with `SERIAL`
- `ENUM` types with `CHECK` constraints or custom types
- `UUID()` with `gen_random_uuid()`