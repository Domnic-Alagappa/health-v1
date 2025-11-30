-- Migration: Create refresh_tokens table
-- Description: Store refresh tokens for JWT token revocation
-- Related Entity: None (infrastructure table)
--
-- Tables Created:
--   - refresh_tokens
--
-- Indexes Created:
--   - idx_refresh_tokens_user_id (B-tree, on user_id)
--   - idx_refresh_tokens_token_hash (B-tree, on token_hash - unique)
--   - idx_refresh_tokens_expires_at (B-tree, on expires_at)
--   - idx_refresh_tokens_is_revoked (B-tree, on is_revoked)
--   - idx_refresh_tokens_expired_revoked (B-tree Partial, on expires_at, is_revoked WHERE expires_at < NOW() OR is_revoked = true)

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- Index for cleanup of expired/revoked tokens
-- Note: We can't use NOW() in index predicate (not IMMUTABLE), so we index on is_revoked
-- and expires_at separately. Queries can filter by expires_at < NOW() at query time.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expired_revoked 
    ON refresh_tokens(expires_at, is_revoked) 
    WHERE is_revoked = true;

