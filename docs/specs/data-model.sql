-- Enable UUID generation extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'read_only');
CREATE TYPE client_status AS ENUM ('active', 'on_hold', 'archived');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'blocked', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE audit_action AS ENUM (
  'credential_view',
  'credential_reveal',
  'credential_copy',
  'credential_create',
  'credential_update',
  'credential_delete'
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  password_hash text NOT NULL,
  mfa_enabled boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name text NOT NULL,
  company text,
  status client_status NOT NULL DEFAULT 'active',
  primary_email text,
  primary_phone text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_name_company_unique UNIQUE (lower(name), COALESCE(company, ''))
);

CREATE INDEX clients_owner_idx ON clients(owner_user_id);
CREATE INDEX clients_status_idx ON clients(status);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date date,
  assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_client_status_idx ON tasks(client_id, status);
CREATE INDEX tasks_due_date_idx ON tasks(due_date);
CREATE INDEX tasks_assigned_idx ON tasks(assigned_to_user_id);

CREATE TABLE credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  label text NOT NULL,
  username text,
  url text,
  encrypted_value bytea NOT NULL,
  encryption_nonce bytea NOT NULL,
  encryption_method text NOT NULL DEFAULT 'aes-256-gcm',
  key_version text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credentials_unique_label_per_client UNIQUE (client_id, lower(label))
);

CREATE INDEX credentials_client_idx ON credentials(client_id);
CREATE INDEX credentials_key_version_idx ON credentials(key_version);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  color text,
  scope text NOT NULL DEFAULT 'global',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE client_tags (
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (client_id, tag_id)
);

CREATE TABLE task_tags (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE credential_tags (
  credential_id uuid NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (credential_id, tag_id)
);

CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  credential_id uuid NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action audit_action NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_credential_idx ON audit_logs(credential_id, occurred_at DESC);
CREATE INDEX audit_logs_user_idx ON audit_logs(user_id, occurred_at DESC);
