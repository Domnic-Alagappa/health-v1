/// Common SELECT field list for request_logs table
/// Note: ip_address is cast to text for manual parsing
pub const REQUEST_LOG_SELECT_ALL_FIELDS: &str = r#"
    id, session_id, request_id, user_id, method, path, query_string,
    ip_address::text as ip_address_str, user_agent, status_code, response_time_ms,
    request_size_bytes, response_size_bytes, created_at, metadata
"#;

/// Insert a new request log
pub const REQUEST_LOG_INSERT: &str = r#"
    INSERT INTO request_logs (
        id, session_id, request_id, user_id, method, path, query_string,
        ip_address, user_agent, status_code, response_time_ms,
        request_size_bytes, response_size_bytes, created_at, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9, $10, $11, $12, $13, $14, $15)
    RETURNING
        id, session_id, request_id, user_id, method, path, query_string,
        ip_address::text as ip_address_str, user_agent, status_code, response_time_ms,
        request_size_bytes, response_size_bytes, created_at, metadata
"#;

/// Find request logs by session ID
pub const REQUEST_LOG_FIND_BY_SESSION: &str = r#"
    SELECT id, session_id, request_id, user_id, method, path, query_string,
           ip_address::text as ip_address_str, user_agent, status_code, response_time_ms,
           request_size_bytes, response_size_bytes, created_at, metadata
    FROM request_logs
    WHERE session_id = $1
    ORDER BY created_at DESC
    LIMIT $2
"#;

/// Find request log by request ID
pub const REQUEST_LOG_FIND_BY_REQUEST_ID: &str = r#"
    SELECT id, session_id, request_id, user_id, method, path, query_string,
           ip_address::text as ip_address_str, user_agent, status_code, response_time_ms,
           request_size_bytes, response_size_bytes, created_at, metadata
    FROM request_logs
    WHERE request_id = $1
    ORDER BY created_at DESC
    LIMIT 1
"#;

