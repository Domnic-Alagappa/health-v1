-- Migration: Create junction tables for user-roles and role-permissions
-- Description: Many-to-many relationships for RBAC
-- Related Entities: None (junction tables)
--
-- Tables Created:
--   - user_roles (junction: users <-> roles)
--   - role_permissions (junction: roles <-> permissions)
--
-- Indexes Created:
--   - idx_user_roles_user_id (B-tree, on user_roles.user_id)
--   - idx_user_roles_role_id (B-tree, on user_roles.role_id)
--   - idx_role_permissions_role_id (B-tree, on role_permissions.role_id)
--   - idx_role_permissions_permission_id (B-tree, on role_permissions.permission_id)
--
-- Unique Constraints:
--   - user_roles: (user_id, role_id)
--   - role_permissions: (role_id, permission_id)

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

