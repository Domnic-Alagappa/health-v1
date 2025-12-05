-- Create UI entity registration tables for Zanzibar-based access control
-- These tables store metadata about UI components (pages, buttons, fields, APIs)
-- that can be controlled via Zanzibar relationships

-- UI Pages table
CREATE TABLE IF NOT EXISTS ui_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE, -- e.g., "users", "organizations"
    path VARCHAR(255) NOT NULL, -- e.g., "/users", "/organizations"
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store additional page metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    -- Audit fields
    request_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL
);

-- UI Buttons table
CREATE TABLE IF NOT EXISTS ui_buttons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES ui_pages(id) ON DELETE CASCADE,
    button_id VARCHAR(255) NOT NULL, -- e.g., "create-user", "delete-user"
    label VARCHAR(255) NOT NULL,
    action VARCHAR(255), -- e.g., "create", "delete", "edit"
    metadata JSONB DEFAULT '{}'::jsonb, -- Store button-specific metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    -- Audit fields
    request_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL,
    -- Unique constraint: button_id per page
    UNIQUE(page_id, button_id)
);

-- UI Fields table
CREATE TABLE IF NOT EXISTS ui_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES ui_pages(id) ON DELETE CASCADE,
    field_id VARCHAR(255) NOT NULL, -- e.g., "user-email", "user-password"
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- e.g., "text", "password", "select", "checkbox"
    metadata JSONB DEFAULT '{}'::jsonb, -- Store field-specific metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    -- Audit fields
    request_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL,
    -- Unique constraint: field_id per page
    UNIQUE(page_id, field_id)
);

-- UI API Endpoints table
CREATE TABLE IF NOT EXISTS ui_api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(500) NOT NULL, -- e.g., "/api/admin/users", "/api/admin/users/:id"
    method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE, PATCH
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store API-specific metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    -- Audit fields
    request_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    system_id VARCHAR(255),
    version BIGINT DEFAULT 1 NOT NULL,
    -- Unique constraint: endpoint + method combination
    UNIQUE(endpoint, method)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ui_pages_name ON ui_pages(name);
CREATE INDEX IF NOT EXISTS idx_ui_pages_path ON ui_pages(path);
CREATE INDEX IF NOT EXISTS idx_ui_pages_deleted_at ON ui_pages(deleted_at);

CREATE INDEX IF NOT EXISTS idx_ui_buttons_page_id ON ui_buttons(page_id);
CREATE INDEX IF NOT EXISTS idx_ui_buttons_button_id ON ui_buttons(button_id);
CREATE INDEX IF NOT EXISTS idx_ui_buttons_deleted_at ON ui_buttons(deleted_at);

CREATE INDEX IF NOT EXISTS idx_ui_fields_page_id ON ui_fields(page_id);
CREATE INDEX IF NOT EXISTS idx_ui_fields_field_id ON ui_fields(field_id);
CREATE INDEX IF NOT EXISTS idx_ui_fields_deleted_at ON ui_fields(deleted_at);

CREATE INDEX IF NOT EXISTS idx_ui_api_endpoints_endpoint ON ui_api_endpoints(endpoint);
CREATE INDEX IF NOT EXISTS idx_ui_api_endpoints_method ON ui_api_endpoints(method);
CREATE INDEX IF NOT EXISTS idx_ui_api_endpoints_deleted_at ON ui_api_endpoints(deleted_at);

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_ui_pages_updated_at BEFORE UPDATE ON ui_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ui_buttons_updated_at BEFORE UPDATE ON ui_buttons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ui_fields_updated_at BEFORE UPDATE ON ui_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ui_api_endpoints_updated_at BEFORE UPDATE ON ui_api_endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

