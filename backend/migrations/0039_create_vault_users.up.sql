-- Create vault_users table for UserPass authentication
CREATE TABLE IF NOT EXISTS vault_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    policies TEXT[] DEFAULT '{}',
    ttl BIGINT DEFAULT 3600,
    max_ttl BIGINT DEFAULT 86400,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vault_users_username ON vault_users(username);

