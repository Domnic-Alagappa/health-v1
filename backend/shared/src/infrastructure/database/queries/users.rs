/// Common SELECT field list for users table
/// Order must match User struct field order for sqlx::FromRow
/// Note: Database column order differs, so we must explicitly list columns in struct order
pub const USER_SELECT_ALL_FIELDS: &str = r#"
    id, email, username, password_hash, is_active, is_verified, is_super_user, 
    organization_id, last_login, request_id, created_at, updated_at,
    created_by, updated_by, system_id, version
"#;

/// Insert a new user
pub const USER_INSERT: &str = r#"
    INSERT INTO users (
        id, email, username, password_hash, is_active, is_verified, is_super_user, 
        organization_id, created_at, updated_at, last_login,
        request_id, created_by, updated_by, system_id, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING 
        id, email, username, password_hash, is_active, is_verified, is_super_user, 
        organization_id, last_login, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
"#;

/// Find user by ID
pub const USER_FIND_BY_ID: &str = r#"
    SELECT id, email, username, password_hash, is_active, is_verified, is_super_user, 
           organization_id, last_login, request_id, created_at, updated_at,
           created_by, updated_by, system_id, version
    FROM users
    WHERE id = $1
"#;

/// Find user by email
/// Column order matches User struct: id, email, username, password_hash, is_active, is_verified, 
/// is_super_user, organization_id, last_login, request_id, created_at, updated_at,
/// created_by, updated_by, system_id, version
pub const USER_FIND_BY_EMAIL: &str = r#"
    SELECT 
        id, email, username, password_hash, is_active, is_verified, is_super_user, 
        organization_id, last_login, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
    FROM users
    WHERE email = $1
"#;

/// Find user by username
pub const USER_FIND_BY_USERNAME: &str = r#"
    SELECT 
        id, email, username, password_hash, is_active, is_verified, is_super_user, 
        organization_id, last_login, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
    FROM users
    WHERE username = $1
"#;

/// Update user
pub const USER_UPDATE: &str = r#"
    UPDATE users
    SET email = $2, username = $3, password_hash = $4, is_active = $5, is_verified = $6, 
        is_super_user = $7, organization_id = $8, updated_at = $9, last_login = $10,
        request_id = $11, updated_by = $12, version = $13
    WHERE id = $1 AND version = $14
    RETURNING 
        id, email, username, password_hash, is_active, is_verified, is_super_user, 
        organization_id, last_login, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
"#;

/// Delete user by ID
pub const USER_DELETE: &str = r#"
    DELETE FROM users
    WHERE id = $1
"#;

/// List users with pagination
pub const USER_LIST: &str = r#"
    SELECT 
        id, email, username, password_hash, is_active, is_verified, is_super_user, 
        organization_id, last_login, request_id, created_at, updated_at,
        created_by, updated_by, system_id, version
    FROM users
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
"#;

