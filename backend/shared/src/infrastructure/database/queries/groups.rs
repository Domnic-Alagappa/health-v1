/// Insert a new group
pub const GROUP_INSERT: &str = r#"
    INSERT INTO groups (
        id, name, description, organization_id, metadata, created_at, updated_at,
        deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id, name, description, organization_id, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Find group by ID (only non-deleted)
pub const GROUP_FIND_BY_ID: &str = r#"
    SELECT id, name, description, organization_id, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM groups
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Find group by name and organization (only non-deleted)
pub const GROUP_FIND_BY_NAME: &str = r#"
    SELECT id, name, description, organization_id, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM groups
    WHERE name = $1 
    AND (organization_id = $2 OR ($2 IS NULL AND organization_id IS NULL))
    AND deleted_at IS NULL
"#;

/// Find groups by organization (only non-deleted)
pub const GROUP_FIND_BY_ORGANIZATION: &str = r#"
    SELECT id, name, description, organization_id, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM groups
    WHERE organization_id = $1 AND deleted_at IS NULL
    ORDER BY name ASC
"#;

/// Find all groups (only non-deleted)
pub const GROUP_FIND_ALL: &str = r#"
    SELECT id, name, description, organization_id, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM groups
    WHERE deleted_at IS NULL
    ORDER BY name ASC
"#;

/// Update group
pub const GROUP_UPDATE: &str = r#"
    UPDATE groups
    SET name = $2,
        description = $3,
        organization_id = $4,
        metadata = $5,
        updated_at = $6,
        request_id = $7,
        updated_by = $8,
        system_id = $9,
        version = $10
    WHERE id = $1
    RETURNING id, name, description, organization_id, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Soft delete group
pub const GROUP_SOFT_DELETE: &str = r#"
    UPDATE groups
    SET deleted_at = NOW(),
        deleted_by = $2,
        updated_at = NOW(),
        version = version + 1
    WHERE id = $1
"#;

/// Restore soft-deleted group
pub const GROUP_RESTORE: &str = r#"
    UPDATE groups
    SET deleted_at = NULL,
        deleted_by = NULL,
        updated_at = NOW(),
        version = version + 1
    WHERE id = $1
"#;

