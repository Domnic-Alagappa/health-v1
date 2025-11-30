-- Migration: Create passkey_credentials table
-- Description: Store WebAuthn/Passkey credentials for dashboard authentication
-- Related Entity: None (infrastructure table)
--
-- Tables Created:
--   - passkey_credentials
--
-- Indexes Created:
--   - idx_passkey_credentials_user_id (B-tree, on user_id)
--   - idx_passkey_credentials_credential_id (B-tree, on credential_id - unique)
--   - idx_passkey_credentials_is_active (B-tree, on is_active)

CREATE TABLE IF NOT EXISTS passkey_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id VARCHAR(512) NOT NULL UNIQUE,
    public_key BYTEA NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON passkey_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON passkey_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_is_active ON passkey_credentials(is_active);

