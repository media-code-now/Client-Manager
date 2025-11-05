# CRM Development Roadmap

## Phase 1 – Setup Project & Authentication
- **Tasks**
  - Initialise monorepo or separate backend/frontend projects.
  - Configure TypeScript, ESLint, Prettier, Husky hooks.
  - Set up Express (or NestJS) with basic middleware (helmet, cors, rate limiting).
  - Implement `/auth/sign-in`, `/auth/refresh`, `/auth/sign-out` using JWT (access + refresh tokens).
  - Hash passwords with bcrypt/argon2; seed initial admin user.
  - Establish `.env` handling and secrets management (dotenv + vault/KMS).
- **Difficulty:** Medium
- **Before Next Phase, Test**
  - Unit tests for auth service, password hashing, JWT issuance/verification.
  - Integration test: sign-in flow returns tokens, protected route denies unauthenticated request.
  - Linting and formatting run clean; CI pipeline green.

## Phase 2 – Database & Core Models
- **Tasks**
  - Provision PostgreSQL instance; apply schema from `docs/specs/data-model.sql`.
  - Integrate ORM (Prisma/TypeORM/Knex) and generate models for users, clients, tasks, credentials, tags, audit_logs.
  - Implement migrations pipeline and seeding strategy.
  - Configure connection pooling and environment-specific DB URLs.
- **Difficulty:** Medium
- **Before Next Phase, Test**
  - Run migrations in dev/staging, validate tables/indexes.
  - ORM model tests: CRUD for each entity.
  - Verify rollback/redo works; ensure test suite uses isolated database.

## Phase 3 – API for Clients & Tasks
- **Tasks**
  - Build protected routes for client CRUD, archive, search (pagination, filters).
  - Implement task CRUD within `/clients/:id/tasks` with status, priority, due date, assignment.
  - Add RBAC checks (admin/manager vs read_only) via middleware.
  - Implement validation schemas (Zod/Joi) for payloads.
  - Document API (OpenAPI/Postman).
- **Difficulty:** Medium-High
- **Before Next Phase, Test**
  - Integration tests for client/task endpoints covering happy path, validation, RBAC failures.
  - Performance smoke test: pagination/search under sample data.
  - Verify audit logging scaffolding exists (even if credentials pending).

## Phase 4 – Secure Credentials System
- **Tasks**
  - Implement encryption helpers (AES-256-GCM) with key versioning; integrate KMS/environment key loader.
  - Create credential CRUD endpoints (metadata + encrypted_value + nonce + notes).
  - Limit reveal/decrypt routes to privileged roles; add confirmation/rate limiting.
  - Log every credential event to `audit_logs`.
  - Build key rotation job/runbook; store scripts.
- **Difficulty:** High
- **Before Next Phase, Test**
  - Unit tests for encrypt/decrypt (round trip, nonce uniqueness, key mismatch failure).
  - Integration tests ensuring secrets are stored encrypted and reveals require auth.
  - Audit log assertions for create/update/reveal/delete.
  - Dry-run key rotation script in staging.

## Phase 5 – Frontend UI & Usability
- **Tasks**
  - Implement dashboard and client detail pages (React + Tailwind) per `docs/frontend/frontend-plan.md`.
  - Integrate React Query (or SWR) with JWT auth, handling token refresh.
  - Build modals/forms for clients, tasks, credentials with validation and optimistic updates.
  - Add search/filter UI, segmented control, responsive layout, iOS-style polish/motion.
  - Implement secure secret viewing (masking, timeouts, copy flows with warnings).
- **Difficulty:** Medium-High
- **Before Next Phase, Test**
  - E2E flows (Cypress/Playwright): login → create client → add task → add credential → reveal secret.
  - Accessibility checks (axe) and responsive snapshots.
  - Manual UX review for motion/spacing consistency.

## Phase 6 – Testing, Security Review & Deployment
- **Tasks**
  - Expand automated test suite (unit, integration, E2E) with coverage goals.
  - Conduct security audit against checklist (`docs/security/credential-security-checklist.md`).
  - Add logging, monitoring, and alerting (structured logs, audit exports).
  - Set up CI/CD pipeline (build, test, lint, deploy to staging/production).
  - Configure infrastructure: HTTPS (TLS certs), reverse proxy, WAF/CDN, environment secrets.
  - Perform load testing and rollback drills.
- **Difficulty:** High
- **Before Launch, Test**
  - Pen-test/OWASP-style review; verify no plaintext secrets in logs/DB.
  - Run full regression E2E suite on staging.
  - Chaos/rollback test: simulate key rotation, credential reveal, audit retrieval.
  - Confirm observability (dashboards, alerts) functions in staging environment.
