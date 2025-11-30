/// Insert a new role
pub const ROLE_INSERT: &str = r#"
    INSERT INTO roles (
        id, name, description, created_at, updated_at,
        request_id, created_by, updated_by, system_id, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
"#;

/// Insert role permission relationship
pub const ROLE_PERMISSION_INSERT: &str = r#"
    INSERT INTO role_permissions (role_id, permission_id, created_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (role_id, permission_id) DO NOTHING
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

/// Delete permission from role
pub const ROLE_PERMISSION_DELETE: &str = r#"
    DELETE FROM role_permissions
    WHERE role_id = $1 AND permission_id = $2
"#;

/// Get permissions for a role
pub const ROLE_PERMISSIONS_SELECT: &str = r#"
    SELECT permission_id
    FROM role_permissions
    WHERE role_id = $1
    ORDER BY created_at
"#;

/// Get roles for a user
pub const USER_ROLES_SELECT: &str = r#"
    SELECT r.id, r.name, r.description, r.request_id, r.created_at, r.updated_at,
           r.created_by, r.updated_by, r.system_id, r.version
    FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
    ORDER BY r.name
"#;

