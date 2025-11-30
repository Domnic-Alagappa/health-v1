-- Migration: Create users table
-- Description: Core user table with authentication fields and super user flag
-- Related Entity: src/domain/entities/user.rs (User)
--
-- Tables Created:
--   - users
--
-- Indexes Created:
--   - idx_users_email (B-tree, on email)
--   - idx_users_username (B-tree, on username)
--   - idx_users_is_active (B-tree, on is_active)
--   - idx_users_is_super_user (B-tree, on is_super_user)
--
-- Functions Created:
--   - update_updated_at_column() - Trigger function for updating updated_at timestamp
--
-- Triggers Created:
--   - update_users_updated_at - Updates updated_at before row update

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_super_user BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_super_user ON users(is_super_user);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

