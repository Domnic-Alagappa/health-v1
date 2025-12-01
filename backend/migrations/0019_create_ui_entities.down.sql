-- Rollback migration for UI entities

DROP TRIGGER IF EXISTS update_ui_api_endpoints_updated_at ON ui_api_endpoints;
DROP TRIGGER IF EXISTS update_ui_fields_updated_at ON ui_fields;
DROP TRIGGER IF EXISTS update_ui_buttons_updated_at ON ui_buttons;
DROP TRIGGER IF EXISTS update_ui_pages_updated_at ON ui_pages;

DROP INDEX IF EXISTS idx_ui_api_endpoints_deleted_at;
DROP INDEX IF EXISTS idx_ui_api_endpoints_method;
DROP INDEX IF EXISTS idx_ui_api_endpoints_endpoint;

DROP INDEX IF EXISTS idx_ui_fields_deleted_at;
DROP INDEX IF EXISTS idx_ui_fields_field_id;
DROP INDEX IF EXISTS idx_ui_fields_page_id;

DROP INDEX IF EXISTS idx_ui_buttons_deleted_at;
DROP INDEX IF EXISTS idx_ui_buttons_button_id;
DROP INDEX IF EXISTS idx_ui_buttons_page_id;

DROP INDEX IF EXISTS idx_ui_pages_deleted_at;
DROP INDEX IF EXISTS idx_ui_pages_path;
DROP INDEX IF EXISTS idx_ui_pages_name;

DROP TABLE IF EXISTS ui_api_endpoints;
DROP TABLE IF EXISTS ui_fields;
DROP TABLE IF EXISTS ui_buttons;
DROP TABLE IF EXISTS ui_pages;

