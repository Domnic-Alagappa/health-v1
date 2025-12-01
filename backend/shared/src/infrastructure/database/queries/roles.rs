/// Insert a new role
pub const ROLE_INSERT: &str = r#"
    INSERT INTO roles (
        id, name, description, created_at, updated_at,
        request_id, created_by, updated_by, system_id, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
"#;

/// Find role by ID
pub const ROLE_FIND_BY_ID: &str = r#"
    SELECT id, name, description, request_id, created_at, updated_at,
           created_by, updated_by, system_id, version
    FROM roles
    WHERE id = $1
"#;

/// Find role by name
pub const ROLE_FIND_BY_NAME: &str = r#"
    SELECT id, name, description, request_id, created_at, updated_at,
           created_by, updated_by, system_id, version
    FROM roles
    WHERE name = $1
"#;

/// List all roles
pub const ROLE_LIST: &str = r#"
    SELECT id, name, description, request_id, created_at, updated_at,
           created_by, updated_by, system_id, version
    FROM roles
    ORDER BY name
"#;


