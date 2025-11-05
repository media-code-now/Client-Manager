# Data Model Overview

## ERD Narrative
- **Users** own clients, create/assign tasks, and manage credentials. Every credential access event is tied back to the acting user.
- **Clients** represent businesses or individuals. Each client aggregates tasks, credentials, and optional tags. Clients can be archived without losing historical data.
- **Tasks** belong to a single client, include status/priority/due date, and may be assigned to a user. Tags provide categorisation for reporting and filtering.
- **Credentials** store encrypted secrets per client. Metadata (label, username, url) stays queryable while the `encrypted_value` remains opaque. Each credential logs access events.
- **Tags** attach to clients, tasks, or credentials using dedicated join tables, enabling flexible filtering.
- **Audit Logs** capture credential actions (view, reveal, copy, create, update, delete) with user, timestamp, ip, and user agent for compliance.

## Encryption Strategy
- Secrets are encrypted before reaching the database (AES-256-GCM recommended).
- `encrypted_value` holds ciphertext + auth tag, `encryption_nonce` stores the IV, `key_version` allows rotation.
- Keys are never stored in the database. Retrieve from a dedicated key management service (AWS KMS, GCP KMS, HashiCorp Vault) or an injected environment secret, refreshing regularly.
- Decryption occurs only for authorised requests and should be wiped from memory immediately after use.

## Table Purpose Summary
- `users`: authentication data, roles, MFA, audit linkage.
- `clients`: client profile, status, ownership, archival metadata.
- `tasks`: per-client work items with lifecycle tracking.
- `credentials`: secure storage of client secrets with metadata.
- `tags` & join tables: shared taxonomy across entities.
- `audit_logs`: immutable ledger for credential interactions.

Refer to `data-model.sql` for the complete PostgreSQL schema.
