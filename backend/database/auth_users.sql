-- Auth Module - Users Table
-- Add this to your existing PostgreSQL Mini CRM schema

-- Create users table if it doesn't exist (it should already exist from our previous schema)
-- This is a simplified version focused on authentication
CREATE TABLE IF NOT EXISTS auth_users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT auth_users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT auth_users_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_is_active ON auth_users(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_users_created_at ON auth_users(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_auth_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auth_users_updated_at_trigger
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_auth_users_updated_at();

-- Comments
COMMENT ON TABLE auth_users IS 'Authentication users for the CRM system';
COMMENT ON COLUMN auth_users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN auth_users.uuid IS 'External reference UUID for API responses';
COMMENT ON COLUMN auth_users.is_active IS 'Whether user account is active';