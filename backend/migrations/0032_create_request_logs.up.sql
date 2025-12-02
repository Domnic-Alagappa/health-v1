-- Migration: Create request_logs table
-- Description: Track all HTTP requests with IP addresses, request IDs, and session context
-- Related Entity: src/domain/entities/request_log.rs (RequestLog)

-- Tables Created:
--   - request_logs

-- Indexes Created:
--   - idx_request_logs_session_id (B-tree, on session_id)
--   - idx_request_logs_request_id (B-tree, on request_id)
--   - idx_request_logs_user_id (B-tree, on user_id WHERE user_id IS NOT NULL)
--   - idx_request_logs_created_at (B-tree, on created_at)
--   - idx_request_logs_ip_address (B-tree, on ip_address)

CREATE TABLE IF NOT EXISTS request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    request_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    query_string TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    status_code INT NOT NULL,
    response_time_ms INT,
    request_size_bytes INT,
    response_size_bytes INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_request_logs_session_id ON request_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_request_id ON request_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON request_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_ip_address ON request_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_request_logs_method_path ON request_logs(method, path);
CREATE INDEX IF NOT EXISTS idx_request_logs_status_code ON request_logs(status_code);

