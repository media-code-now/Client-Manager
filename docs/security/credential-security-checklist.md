# Credential Security Checklist & Guidance

## Encryption Architecture
- Use envelope encryption with AES-256-GCM for per-record data keys and a master key stored in a KMS (AWS KMS, GCP KMS, or HashiCorp Vault). At minimum, inject a 32-byte base64-encoded key via environment variables managed by a secret store.
- Persist only ciphertext, authentication tag, IV (nonce), encryption method, and key version in PostgreSQL. Never store or log plaintext credentials.
- Centralise encryption/decryption in a backend service helper. Wipe decrypted buffers (`Buffer.fill(0)`) immediately after use and avoid serialising secrets to logs or telemetry.
- Restrict decryption operations to server-side routes guarded by explicit role checks (admin/manager). Read-only roles receive masked metadata only.

## Key Rotation Strategy
- Track `key_version` per credential. Maintain a map of version → key in configuration or fetch dynamically from the KMS.
- When introducing a new master key:
  1. Add the new key to KMS/config and deploy services that can encrypt using `key_version = vNext`.
  2. New or updated credentials use the new key immediately.
  3. Run a background migration that batches existing records: decrypt with the legacy key, encrypt with the new key, update `key_version`.
  4. Keep legacy keys accessible for read operations during migration. Retire them only after all rows move to the new version and backups confirm.
- Automate the rotation job and add runbooks/tests in staging before production rollout.

## Transport & Access Controls
- Enforce HTTPS/TLS 1.2+ in all environments; configure HSTS, secure cookies (`SameSite=Strict`, `Secure`, `HttpOnly`), and content security headers.
- Issue short-lived access tokens; store refresh tokens in HTTP-only cookies; support MFA for privileged accounts.
- Rate-limit credential reveal endpoints and require explicit user confirmation. Consider additional friction (re-authentication) for high-risk actions.
- Implement ABAC/RBAC so only authorised roles can retrieve decrypted secrets.

## Frontend Handling
- Fetch decrypted secrets only when requested. Auto-remask after a short timeout or when the modal closes.
- Avoid persisting secrets in global state, localStorage, or analytics payloads. Keep decrypted values in a transient component state that resets on unmount.
- Disable autocomplete on secret inputs and ensure copy-to-clipboard actions pull from a short-lived variable that is cleared immediately afterward.
- Display security messaging (“Secrets encrypted at rest. Access is audited.”) to set expectations and deter misuse.

## Auditing & Monitoring
- Record every credential event (create/update/delete/reveal/copy) with user ID, timestamp, IP, user agent, and request ID in an append-only `audit_logs` table or external log store.
- Ship logs to a SIEM for anomaly detection (e.g., repeated reveals, out-of-hours access). Configure alerts and dashboards.
- Protect audit data from tampering (write-only service account, immutable buckets, or log immutability features).

## Common Mistakes to Avoid
- Logging plaintext secrets or stack traces containing decrypted values.
- Reusing IVs/nonces with AES-GCM or using deterministic IVs.
- Hardcoding keys in source control or sharing keys across environments.
- Returning decrypted secrets by default in list endpoints.
- Sending secrets to client-side analytics, error trackers, or browser storage.

## External Password Manager Integration (Optional)
- Evaluate managed secret stores (1Password Connect, HashiCorp Vault, AWS Secrets Manager). Store references/IDs in the CRM database while retrieving secrets from the provider on demand.
- Use service-to-service auth (JWT/mTLS/api keys) between backend and password manager. Respect provider TTLs and caching guidelines.
- Leverage external audit logs and rotation policies to reduce in-house burden, but ensure availability requirements are met.

## Implementation Checklist
- [ ] Wire backend encryption helper (`encryptSecret`/`decryptSecret`) using AES-256-GCM with random 12-byte nonce.
- [ ] Store `encrypted_value`, `encryption_nonce`, `key_version`, and metadata; ensure ORM serializers forbid plaintext writes.
- [ ] Enforce HTTPS, secure cookies, JWT auth, and RBAC on sensitive endpoints.
- [ ] Build UI reveal flows with timeout remasking, confirmation dialogs, and copy-to-clipboard helpers that clear state immediately.
- [ ] Implement audit logging with structured data; forward to central log pipeline; configure anomaly alerts.
- [ ] Create automated key rotation workflow with staging tests and rollback plan.
- [ ] Add security unit/integration tests (no plaintext regressions) and lint rules preventing `console.log` of secrets.
- [ ] Document runbook for incidents (key compromise, suspicious access) and rehearse response procedures.
- [ ] Optional: prototype integration with external password manager API and assess long-term feasibility.
