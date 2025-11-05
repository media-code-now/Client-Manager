-- Refresh Tokens Table for JWT Token Rotation
-- This table stores refresh tokens for secure token rotation

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE NULL,
    revoked_reason VARCHAR(100) NULL,
    device_info JSONB NULL, -- Store device/browser info for security
    ip_address INET NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens (user_id, revoked_at);

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_refresh_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_refresh_tokens_updated_at();

-- Add token version to users table for global logout capability
ALTER TABLE auth_users 
ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;

-- Create index on token_version for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_token_version ON auth_users(token_version);

-- Add comments for documentation
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT token rotation and security';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA256 hash of the refresh token for secure storage';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Expiration timestamp for the refresh token';
COMMENT ON COLUMN refresh_tokens.revoked_at IS 'Timestamp when token was revoked (NULL if active)';
COMMENT ON COLUMN refresh_tokens.device_info IS 'JSON object containing device/browser information';
COMMENT ON COLUMN auth_users.token_version IS 'Version number for global token invalidation';

-- Grant permissions (adjust as needed for your user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON refresh_tokens TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE refresh_tokens_id_seq TO your_app_user;