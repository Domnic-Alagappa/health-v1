/// Insert a new relationship
pub const RELATIONSHIP_INSERT: &str = r#"
    INSERT INTO relationships (id, user, relation, object, created_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user, relation, object) DO UPDATE SET id = EXCLUDED.id
    RETURNING id, user, relation, object, created_at
"#;

/// Find relationship by ID
pub const RELATIONSHIP_FIND_BY_ID: &str = r#"
    SELECT id, user, relation, object, created_at
    FROM relationships
    WHERE id = $1
"#;

/// Find relationships by user
pub const RELATIONSHIP_FIND_BY_USER: &str = r#"
    SELECT id, user, relation, object, created_at
    FROM relationships
    WHERE user = $1
    ORDER BY created_at DESC
"#;

/// Find relationships by object
pub const RELATIONSHIP_FIND_BY_OBJECT: &str = r#"
    SELECT id, user, relation, object, created_at
    FROM relationships
    WHERE object = $1
    ORDER BY created_at DESC
"#;

/// Find relationships by user and relation
pub const RELATIONSHIP_FIND_BY_USER_RELATION: &str = r#"
    SELECT id, user, relation, object, created_at
    FROM relationships
    WHERE user = $1 AND relation = $2
    ORDER BY created_at DESC
"#;

/// Find relationship by user, object, and relation
pub const RELATIONSHIP_FIND_BY_USER_OBJECT_RELATION: &str = r#"
    SELECT id, user, relation, object, created_at
    FROM relationships
    WHERE user = $1 AND object = $2 AND relation = $3
"#;

/// Delete relationship by ID
pub const RELATIONSHIP_DELETE: &str = r#"
    DELETE FROM relationships
    WHERE id = $1
"#;

/// Delete relationship by tuple (user, relation, object)
pub const RELATIONSHIP_DELETE_BY_TUPLE: &str = r#"
    DELETE FROM relationships
    WHERE user = $1 AND relation = $2 AND object = $3
"#;

