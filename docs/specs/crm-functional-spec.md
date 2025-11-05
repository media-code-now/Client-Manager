# CRM Functional Specification

## Overview
A secure web-based CRM for managing clients, their tasks, and associated credentials. Primary persona is an authenticated admin who needs rapid visibility into workload and safe storage for sensitive secrets.

## User Flows
1. **Authentication:** Admin signs in, receives JWT, and enters the authenticated shell.
2. **Dashboard:** Landing screen with greeting, aggregate stats, Today’s Tasks list, and highlighted clients requiring attention.
3. **Client Management:** Create/edit/archive clients, assign tags, view contact data, and drill into detailed views.
4. **Task Management:** Create tasks per client, track status/priority, mark complete, and view upcoming/overdue items.
5. **Credential Vault:** Store encrypted secrets per client, reveal/copy securely, track access via audit logs.
6. **Search & Filter:** Global search across clients/tasks/credentials plus filter chips for status, priority, and tags.

## Major Features
- Dashboard with stats, quick search, Today’s Tasks, and Clients spotlight.
- Client detail view with tabs: Overview, Tasks, Credentials, Activity.
- Task lifecycle management (create, update status/priority/due date, assign owner).
- Secure credential management, masked display, reveal/copy with confirmation.
- Audit log of credential events (view/reveal/create/update/delete).
- Tag management for clients/tasks/credentials.
- Role-based access with at least Admin vs Read-only distinction.
- Responsive layout supporting desktop/tablet; mobile read-focused (editing optional).

## Entities & Relationships
- `User`: authenticated person, role-driven permissions, referenced by owned clients/tasks/credentials.
- `Client`: core entity with contact info, status, tags, and relationship to tasks/credentials.
- `Task`: belongs to a client, tracks status, priority, due date, assigned user.
- `Credential`: belongs to a client, stores encrypted secret, metadata, audit trail.
- `Tag`: reusable label applied to clients/tasks/credentials through join tables.
- `AuditLog`: records credential access/edit events with user, timestamp, IP/user agent.
- Optional `Note`: per-client annotations (future nice-to-have).
Relationships: User 1..n Clients/Tasks/Credentials. Client 1..n Tasks/Credentials. Credential 1..n AuditLogs. Tags many-to-many with core entities.

## Feature Prioritization
### MVP
- Secure login, JWT session handling, role enforcement.
- Dashboard with stats, Today’s Tasks, client list/search.
- Client CRUD with archive, tags, status management.
- Task CRUD per client with status, priority, due date, assignment.
- Credential CRUD with encryption/decryption server-side only and masked display.
- Audit logging for credential interactions; admin endpoint to view logs.
- Tagging system for segmentation.
- Responsive shell (desktop + tablet).

### Nice to Have
- Expanded roles (Manager, Contractor), custom permission matrix.
- Email/push notifications for overdue tasks or credential rotations.
- Client notes, attachments, file uploads.
- Import/export (CSV) for clients/tasks.
- Smart group filters, saved searches.
- Activity timeline with more granular filtering.
- MFA, SSO, SCIM provisioning.
- Mobile editing, offline mode, task templates.
- Public API with scoped tokens.
- Credential rotation reminders, secrets management integrations.

## Security Requirements
- All secrets encrypted at rest using strong algorithms (AES-256-GCM or equivalent) with unique IV per record.
- Encryption keys stored outside the DB (environment variable + KMS rotation or dedicated vault).
- Never persist or log plaintext passwords/secrets.
- TLS 1.2+ enforced for all transport; secure HTTP headers (HSTS, CSP, XSS protection).
- Role-based access control; least privilege on API routes and database operations.
- Session management with short-lived access tokens, refresh tokens, inactivity timeout, optional MFA.
- Comprehensive audit logging for credential access/edit events with user/time/IP metadata.
- Regular dependency scanning, vulnerability management, and penetration testing schedule.

## Outstanding Questions
- Will multiple admins collaborate simultaneously? (Impacts notifications and conflict handling.)
- Should contractors have restricted credential visibility? (Determines role matrix.)
- Do we need integration hooks (Slack/email) for task updates in MVP?
