/// Insert a new refresh token
pub const REFRESH_TOKEN_INSERT: &str = r#"
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
"#;

/// Find refresh token by token hash
pub const REFRESH_TOKEN_FIND_BY_HASH: &str = r#"
    SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked
    FROM refresh_tokens
    WHERE token_hash = $1 AND is_revoked = false AND expires_at > NOW()
"#;

/// Find refresh tokens by user ID
pub const REFRESH_TOKEN_FIND_BY_USER_ID: &str = r#"
    SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked
    FROM refresh_tokens
    WHERE user_id = $1
    ORDER BY created_at DESC
"#;

/// Revoke a refresh token
pub const REFRESH_TOKEN_REVOKE: &str = r#"
    UPDATE refresh_tokens
    SET is_revoked = true, revoked_at = NOW()
    WHERE token_hash = $1 AND is_revoked = false
"#;

/// Revoke all refresh tokens for a user
pub const REFRESH_TOKEN_REVOKE_ALL_USER: &str = r#"
    UPDATE refresh_tokens
    SET is_revoked = true, revoked_at = NOW()
    WHERE user_id = $1 AND is_revoked = false
"#;

/// Delete expired refresh tokens
pub const REFRESH_TOKEN_DELETE_EXPIRED: &str = r#"
    DELETE FROM refresh_tokens
    WHERE expires_at < NOW() AND is_revoked = true
"#;

