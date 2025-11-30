/// Insert a new encryption key
pub const ENCRYPTION_KEY_INSERT: &str = r#"
    INSERT INTO encryption_keys (id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active
"#;

/// Find encryption key by ID
pub const ENCRYPTION_KEY_FIND_BY_ID: &str = r#"
    SELECT id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active
    FROM encryption_keys
    WHERE id = $1
"#;

/// Find encryption key by entity
pub const ENCRYPTION_KEY_FIND_BY_ENTITY: &str = r#"
    SELECT id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active
    FROM encryption_keys
    WHERE entity_id = $1 AND entity_type = $2
    ORDER BY created_at DESC
    LIMIT 1
"#;

/// Find active encryption key by entity
pub const ENCRYPTION_KEY_FIND_ACTIVE_BY_ENTITY: &str = r#"
    SELECT id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active
    FROM encryption_keys
    WHERE entity_id = $1 AND entity_type = $2 AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
"#;

/// Update encryption key
pub const ENCRYPTION_KEY_UPDATE: &str = r#"
    UPDATE encryption_keys
    SET encrypted_key = $2, nonce = $3, key_algorithm = $4, rotated_at = $5, is_active = $6
    WHERE id = $1
    RETURNING id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active
"#;

/// Deactivate all encryption keys for an entity
pub const ENCRYPTION_KEY_DEACTIVATE_ALL: &str = r#"
    UPDATE encryption_keys
    SET is_active = false
    WHERE entity_id = $1 AND entity_type = $2 AND is_active = true
"#;

