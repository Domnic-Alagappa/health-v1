-- Migration: Drop request_logs table
-- Description: Remove request_logs table and all related indexes

DROP INDEX IF EXISTS idx_request_logs_status_code;
DROP INDEX IF EXISTS idx_request_logs_method_path;
DROP INDEX IF EXISTS idx_request_logs_ip_address;
DROP INDEX IF EXISTS idx_request_logs_created_at;
DROP INDEX IF EXISTS idx_request_logs_user_id;
DROP INDEX IF EXISTS idx_request_logs_request_id;
DROP INDEX IF EXISTS idx_request_logs_session_id;
DROP TABLE IF EXISTS request_logs;

