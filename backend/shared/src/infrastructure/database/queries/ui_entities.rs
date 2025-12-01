// SQL queries for UI entity tables

/// Insert UI page
pub const UI_PAGE_INSERT: &str = r#"
    INSERT INTO ui_pages (id, name, path, description, metadata, created_at, updated_at, 
                          deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id, name, path, description, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Find UI page by ID
pub const UI_PAGE_FIND_BY_ID: &str = r#"
    SELECT id, name, path, description, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_pages
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Find UI page by name
pub const UI_PAGE_FIND_BY_NAME: &str = r#"
    SELECT id, name, path, description, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_pages
    WHERE name = $1 AND deleted_at IS NULL
"#;

/// Find UI page by path
pub const UI_PAGE_FIND_BY_PATH: &str = r#"
    SELECT id, name, path, description, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_pages
    WHERE path = $1 AND deleted_at IS NULL
"#;

/// List all UI pages
pub const UI_PAGE_LIST: &str = r#"
    SELECT id, name, path, description, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_pages
    WHERE deleted_at IS NULL
    ORDER BY name
"#;

/// Update UI page
pub const UI_PAGE_UPDATE: &str = r#"
    UPDATE ui_pages
    SET name = $2, path = $3, description = $4, metadata = $5, updated_at = $6,
        deleted_at = $7, deleted_by = $8, request_id = $9, updated_by = $10,
        system_id = $11, version = $12
    WHERE id = $1
    RETURNING id, name, path, description, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Soft delete UI page
pub const UI_PAGE_SOFT_DELETE: &str = r#"
    UPDATE ui_pages
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), version = version + 1
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Insert UI button
pub const UI_BUTTON_INSERT: &str = r#"
    INSERT INTO ui_buttons (id, page_id, button_id, label, action, metadata, created_at, updated_at,
                            deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, page_id, button_id, label, action, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Find UI button by ID
pub const UI_BUTTON_FIND_BY_ID: &str = r#"
    SELECT id, page_id, button_id, label, action, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_buttons
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Find UI button by page and button_id
pub const UI_BUTTON_FIND_BY_PAGE_AND_ID: &str = r#"
    SELECT id, page_id, button_id, label, action, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_buttons
    WHERE page_id = $1 AND button_id = $2 AND deleted_at IS NULL
"#;

/// List buttons for page
pub const UI_BUTTON_LIST_FOR_PAGE: &str = r#"
    SELECT id, page_id, button_id, label, action, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_buttons
    WHERE page_id = $1 AND deleted_at IS NULL
    ORDER BY label
"#;

/// Update UI button
pub const UI_BUTTON_UPDATE: &str = r#"
    UPDATE ui_buttons
    SET page_id = $2, button_id = $3, label = $4, action = $5, metadata = $6, updated_at = $7,
        deleted_at = $8, deleted_by = $9, request_id = $10, updated_by = $11,
        system_id = $12, version = $13
    WHERE id = $1
    RETURNING id, page_id, button_id, label, action, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Soft delete UI button
pub const UI_BUTTON_SOFT_DELETE: &str = r#"
    UPDATE ui_buttons
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), version = version + 1
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Insert UI field
pub const UI_FIELD_INSERT: &str = r#"
    INSERT INTO ui_fields (id, page_id, field_id, label, field_type, metadata, created_at, updated_at,
                           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, page_id, field_id, label, field_type, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Find UI field by ID
pub const UI_FIELD_FIND_BY_ID: &str = r#"
    SELECT id, page_id, field_id, label, field_type, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_fields
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Find UI field by page and field_id
pub const UI_FIELD_FIND_BY_PAGE_AND_ID: &str = r#"
    SELECT id, page_id, field_id, label, field_type, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_fields
    WHERE page_id = $1 AND field_id = $2 AND deleted_at IS NULL
"#;

/// List fields for page
pub const UI_FIELD_LIST_FOR_PAGE: &str = r#"
    SELECT id, page_id, field_id, label, field_type, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_fields
    WHERE page_id = $1 AND deleted_at IS NULL
    ORDER BY label
"#;

/// Update UI field
pub const UI_FIELD_UPDATE: &str = r#"
    UPDATE ui_fields
    SET page_id = $2, field_id = $3, label = $4, field_type = $5, metadata = $6, updated_at = $7,
        deleted_at = $8, deleted_by = $9, request_id = $10, updated_by = $11,
        system_id = $12, version = $13
    WHERE id = $1
    RETURNING id, page_id, field_id, label, field_type, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Soft delete UI field
pub const UI_FIELD_SOFT_DELETE: &str = r#"
    UPDATE ui_fields
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), version = version + 1
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Insert UI API endpoint
pub const UI_API_INSERT: &str = r#"
    INSERT INTO ui_api_endpoints (id, endpoint, method, description, metadata, created_at, updated_at,
                                   deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id, endpoint, method, description, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Find UI API endpoint by ID
pub const UI_API_FIND_BY_ID: &str = r#"
    SELECT id, endpoint, method, description, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_api_endpoints
    WHERE id = $1 AND deleted_at IS NULL
"#;

/// Find UI API endpoint by endpoint and method
pub const UI_API_FIND_BY_ENDPOINT_AND_METHOD: &str = r#"
    SELECT id, endpoint, method, description, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_api_endpoints
    WHERE endpoint = $1 AND method = $2 AND deleted_at IS NULL
"#;

/// List all UI API endpoints
pub const UI_API_LIST: &str = r#"
    SELECT id, endpoint, method, description, metadata, created_at, updated_at,
           deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
    FROM ui_api_endpoints
    WHERE deleted_at IS NULL
    ORDER BY method, endpoint
"#;

/// Update UI API endpoint
pub const UI_API_UPDATE: &str = r#"
    UPDATE ui_api_endpoints
    SET endpoint = $2, method = $3, description = $4, metadata = $5, updated_at = $6,
        deleted_at = $7, deleted_by = $8, request_id = $9, updated_by = $10,
        system_id = $11, version = $12
    WHERE id = $1
    RETURNING id, endpoint, method, description, metadata, created_at, updated_at,
              deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
"#;

/// Soft delete UI API endpoint
pub const UI_API_SOFT_DELETE: &str = r#"
    UPDATE ui_api_endpoints
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), version = version + 1
    WHERE id = $1 AND deleted_at IS NULL
"#;

