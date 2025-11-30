/// Insert a new permission
pub const PERMISSION_INSERT: &str = r#"
    INSERT INTO permissions (id, name, resource, action, description, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (name) DO UPDATE SET resource = EXCLUDED.resource, action = EXCLUDED.action
    RETURNING id, name, resource, action, description
"#;

/// Find permission by ID
pub const PERMISSION_FIND_BY_ID: &str = r#"
    SELECT id, name, resource, action, description
    FROM permissions
    WHERE id = $1
"#;

/// Find permission by name
pub const PERMISSION_FIND_BY_NAME: &str = r#"
    SELECT id, name, resource, action, description
    FROM permissions
    WHERE name = $1
"#;

/// Find permission by resource and action
pub const PERMISSION_FIND_BY_RESOURCE_ACTION: &str = r#"
    SELECT id, name, resource, action, description
    FROM permissions
    WHERE resource = $1 AND action = $2
"#;

/// List all permissions
pub const PERMISSION_LIST: &str = r#"
    SELECT id, name, resource, action, description
    FROM permissions
    ORDER BY resource, action
"#;

/// List permissions by resource
pub const PERMISSION_LIST_BY_RESOURCE: &str = r#"
    SELECT id, name, resource, action, description
    FROM permissions
    WHERE resource = $1
    ORDER BY action
"#;

