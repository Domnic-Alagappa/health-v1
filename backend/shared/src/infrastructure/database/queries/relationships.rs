/// Insert a new relationship
pub const RELATIONSHIP_INSERT: &str = r#"
    INSERT INTO relationships (
        id, "user", relation, object, created_at, valid_from, expires_at, 
        is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
        created_by, updated_by, system_id, version
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT ("user", relation, object) 
    WHERE deleted_at IS NULL
    DO UPDATE SET 
        id = EXCLUDED.id,
        updated_at = EXCLUDED.updated_at,
        version = relationships.version + 1
    RETURNING id, "user", relation, object, created_at, valid_from, expires_at, 
               is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
               created_by, updated_by, system_id, version
"#;

/// Find relationship by ID (only non-deleted)
pub const RELATIONSHIP_FIND_BY_ID: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Find valid relationships by user (non-deleted, non-expired, active)
pub const RELATIONSHIP_FIND_VALID_BY_USER: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE "user" = $1
    AND deleted_at IS NULL
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
"#;

/// Find relationships by user (all, including deleted/expired)
pub const RELATIONSHIP_FIND_BY_USER: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE "user" = $1
    ORDER BY created_at DESC
"#;

/// Find relationships by object (only valid)
pub const RELATIONSHIP_FIND_VALID_BY_OBJECT: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE object = $1
    AND deleted_at IS NULL
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
"#;

/// Find relationships by object (all)
pub const RELATIONSHIP_FIND_BY_OBJECT: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE object = $1
    ORDER BY created_at DESC
"#;

/// Find relationships by user and relation (only valid)
pub const RELATIONSHIP_FIND_VALID_BY_USER_RELATION: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE "user" = $1 AND relation = $2
    AND deleted_at IS NULL
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
"#;

/// Find relationships by user and relation (all)
pub const RELATIONSHIP_FIND_BY_USER_RELATION: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE "user" = $1 AND relation = $2
    ORDER BY created_at DESC
"#;

/// Find relationship by user, object, and relation (only valid)
pub const RELATIONSHIP_FIND_VALID_BY_USER_OBJECT_RELATION: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE "user" = $1 AND object = $2 AND relation = $3
    AND deleted_at IS NULL
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
"#;

/// Find relationship by user, object, and relation (all)
pub const RELATIONSHIP_FIND_BY_USER_OBJECT_RELATION: &str = r#"
    SELECT id, "user", relation, object, created_at, valid_from, expires_at, 
           is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
           created_by, updated_by, system_id, version
    FROM relationships
    WHERE "user" = $1 AND object = $2 AND relation = $3
    AND deleted_at IS NULL
"#;

/// Update relationship
pub const RELATIONSHIP_UPDATE: &str = r#"
    UPDATE relationships
    SET valid_from = $2,
        expires_at = $3,
        is_active = $4,
        metadata = $5,
        deleted_at = $6,
        deleted_by = $7,
        request_id = $8,
        updated_at = $9,
        updated_by = $10,
        system_id = $11,
        version = $12
    WHERE id = $1
    RETURNING id, "user", relation, object, created_at, valid_from, expires_at, 
               is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
               created_by, updated_by, system_id, version
"#;

/// Soft delete relationship by ID
pub const RELATIONSHIP_SOFT_DELETE: &str = r#"
    UPDATE relationships
    SET deleted_at = NOW(),
        deleted_by = $2,
        is_active = false,
        updated_at = NOW(),
        version = version + 1
    WHERE id = $1
"#;

/// Delete relationship by ID (hard delete)
pub const RELATIONSHIP_DELETE: &str = r#"
    DELETE FROM relationships
    WHERE id = $1
"#;

/// Delete relationship by tuple (user, relation, object) - soft delete
pub const RELATIONSHIP_DELETE_BY_TUPLE: &str = r#"
    UPDATE relationships
    SET deleted_at = NOW(),
        is_active = false,
        updated_at = NOW(),
        version = version + 1
    WHERE "user" = $1 AND relation = $2 AND object = $3
    AND deleted_at IS NULL
"#;

