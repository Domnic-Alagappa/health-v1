/// Common SELECT field list for sessions table
/// Note: ip_address is cast to text for manual parsing
pub const SESSION_SELECT_ALL_FIELDS: &str = r#"
    id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
    started_at, authenticated_at, last_activity_at, expires_at, ended_at,
    is_active, metadata, request_id, created_at, updated_at,
    created_by, updated_by, system_id, version
"#;

/// Insert a new session
pub const SESSION_INSERT: &str = r#"
    INSERT INTO sessions (
        id, session_token, user_id, organization_id, ip_address, user_agent,
        started_at, authenticated_at, last_activity_at, expires_at, ended_at,
        is_active, metadata, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
    )
    VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING
        id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
        started_at, authenticated_at, last_activity_at, expires_at, ended_at,
        is_active, metadata, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
"#;

/// Find session by token
pub const SESSION_FIND_BY_TOKEN: &str = r#"
    SELECT id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
           started_at, authenticated_at, last_activity_at, expires_at, ended_at,
           is_active, metadata, request_id, created_at, updated_at,
           created_by, updated_by, system_id, version
    FROM sessions
    WHERE session_token = $1 AND is_active = true
"#;

/// Find session by ID
pub const SESSION_FIND_BY_ID: &str = r#"
    SELECT id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
           started_at, authenticated_at, last_activity_at, expires_at, ended_at,
           is_active, metadata, request_id, created_at, updated_at,
           created_by, updated_by, system_id, version
    FROM sessions
    WHERE id = $1
"#;

/// Find active sessions by user ID
pub const SESSION_FIND_ACTIVE_BY_USER: &str = r#"
    SELECT id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
           started_at, authenticated_at, last_activity_at, expires_at, ended_at,
           is_active, metadata, request_id, created_at, updated_at,
           created_by, updated_by, system_id, version
    FROM sessions
    WHERE user_id = $1 AND is_active = true
    ORDER BY last_activity_at DESC
"#;

/// Update session
pub const SESSION_UPDATE: &str = r#"
    UPDATE sessions
    SET session_token = $2, user_id = $3, organization_id = $4, ip_address = $5::inet,
        user_agent = $6, started_at = $7, authenticated_at = $8, last_activity_at = $9,
        expires_at = $10, ended_at = $11, is_active = $12, metadata = $13,
        request_id = $14, updated_at = $15, updated_by = $16, version = $17
    WHERE id = $1 AND version = $18
    RETURNING
        id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
        started_at, authenticated_at, last_activity_at, expires_at, ended_at,
        is_active, metadata, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
"#;

/// End session
pub const SESSION_END: &str = r#"
    UPDATE sessions
    SET ended_at = $2, is_active = false, updated_at = NOW(), version = version + 1
    WHERE id = $1
"#;

/// Cleanup expired sessions
pub const SESSION_CLEANUP_EXPIRED: &str = r#"
    UPDATE sessions
    SET ended_at = NOW(), is_active = false, updated_at = NOW(), version = version + 1
    WHERE is_active = true AND expires_at < NOW()
    RETURNING id
"#;

