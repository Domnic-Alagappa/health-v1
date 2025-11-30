# Database Schema Index

This document provides a comprehensive overview of the database schema, including all tables, indexes, partitions, extensions, and their relationships to domain entities.

## Table of Contents

- [Tables](#tables)
- [Indexes](#indexes)
- [Entity Mapping](#entity-mapping)
- [Foreign Keys](#foreign-keys)
- [Triggers](#triggers)
- [Extensions](#extensions)
- [Partitions](#partitions)
- [Quick Reference](#quick-reference)

---

## Tables

### Core Tables

| Table Name | Migration File | Description | Entity File |
|------------|---------------|-------------|-------------|
| `users` | `0001_create_users.up.sql` | Core user table with authentication fields and super user flag | `src/domain/entities/user.rs` |
| `roles` | `0002_create_roles_permissions.up.sql` | RBAC roles table | `src/domain/entities/role.rs` |
| `permissions` | `0002_create_roles_permissions.up.sql` | RBAC permissions table | `src/domain/entities/permission.rs` |
| `user_roles` | `0003_create_user_roles.up.sql` | Junction table for user-role many-to-many relationships | N/A (junction table) |
| `role_permissions` | `0003_create_user_roles.up.sql` | Junction table for role-permission many-to-many relationships | N/A (junction table) |

### Security & Encryption Tables

| Table Name | Migration File | Description | Entity File |
|------------|---------------|-------------|-------------|
| `encryption_keys` | `0004_create_encryption_keys.up.sql` | Data Encryption Keys (DEKs) encrypted with master key | `src/domain/entities/encryption_key.rs` |
| `refresh_tokens` | `0005_create_refresh_tokens.up.sql` | Store refresh tokens for JWT token revocation | N/A (no entity) |
| `passkey_credentials` | `0009_create_passkey_credentials.up.sql` | WebAuthn/Passkey credentials for dashboard authentication | N/A (no entity) |

### Authorization Tables

| Table Name | Migration File | Description | Entity File |
|------------|---------------|-------------|-------------|
| `relationships` | `0006_create_relationships.up.sql` | Zanzibar-style relationship tuples for RBAC | `src/domain/entities/relationship.rs` |

### Organization & Multi-Tenancy Tables

| Table Name | Migration File | Description | Entity File |
|------------|---------------|-------------|-------------|
| `organizations` | `0010_create_organizations.up.sql` | Organization/tenant management for multi-tenant support | `src/domain/entities/organization.rs` (to be created) |

### Audit & System Tables

| Table Name | Migration File | Description | Entity File |
|------------|---------------|-------------|-------------|
| `audit_logs` | `0008_create_audit_logs.up.sql` | Audit trail for key management and security operations | N/A (no entity) |
| `setup_status` | `0012_create_setup_status.up.sql` | Track one-time initial setup completion | N/A (no entity) |

### Schema Modifications

| Migration File | Description |
|----------------|-------------|
| `0011_add_organization_to_users.up.sql` | Adds `organization_id` foreign key to `users` table |
| `0013_add_audit_fields.up.sql` | Adds audit fields to all tables (request_id, created_by, updated_by, system_id, version) |

---

## Indexes

### Users Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_users_email` | `email` | B-tree | Unique email lookups | `0001_create_users.up.sql` |
| `idx_users_username` | `username` | B-tree | Unique username lookups | `0001_create_users.up.sql` |
| `idx_users_is_active` | `is_active` | B-tree | Filter active/inactive users | `0001_create_users.up.sql` |
| `idx_users_is_super_user` | `is_super_user` | B-tree | Filter super users | `0001_create_users.up.sql` |
| `idx_users_organization_id` | `organization_id` | B-tree | Organization-based user lookups | `0011_add_organization_to_users.up.sql` |
| `idx_users_request_id` | `request_id` | B-tree | Audit trail lookups | `0013_add_audit_fields.up.sql` |
| `idx_users_created_by` | `created_by` | B-tree | Track record creators | `0013_add_audit_fields.up.sql` |
| `idx_users_updated_by` | `updated_by` | B-tree | Track record updaters | `0013_add_audit_fields.up.sql` |

### Roles Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_roles_name` | `name` | B-tree | Role name lookups | `0002_create_roles_permissions.up.sql` |
| `idx_roles_request_id` | `request_id` | B-tree | Audit trail lookups | `0013_add_audit_fields.up.sql` |

### Permissions Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_permissions_name` | `name` | B-tree | Permission name lookups | `0002_create_roles_permissions.up.sql` |
| `idx_permissions_resource_action` | `resource, action` | B-tree (composite) | Resource-action lookups | `0002_create_roles_permissions.up.sql` |
| `idx_permissions_request_id` | `request_id` | B-tree | Audit trail lookups | `0013_add_audit_fields.up.sql` |

### User Roles Junction Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_user_roles_user_id` | `user_id` | B-tree | Find roles for a user | `0003_create_user_roles.up.sql` |
| `idx_user_roles_role_id` | `role_id` | B-tree | Find users with a role | `0003_create_user_roles.up.sql` |

### Role Permissions Junction Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_role_permissions_role_id` | `role_id` | B-tree | Find permissions for a role | `0003_create_user_roles.up.sql` |
| `idx_role_permissions_permission_id` | `permission_id` | B-tree | Find roles with a permission | `0003_create_user_roles.up.sql` |

### Encryption Keys Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_encryption_keys_entity_id` | `entity_id` | B-tree | Entity-based key lookups | `0004_create_encryption_keys.up.sql` |
| `idx_encryption_keys_entity_type` | `entity_type` | B-tree | Entity type filtering | `0004_create_encryption_keys.up.sql` |
| `idx_encryption_keys_entity_composite` | `entity_id, entity_type` | B-tree (composite) | Composite entity lookups | `0004_create_encryption_keys.up.sql` |
| `idx_encryption_keys_is_active` | `is_active` | B-tree | Filter active keys | `0004_create_encryption_keys.up.sql` |
| `idx_encryption_keys_active_unique` | `entity_id, entity_type` | Unique Partial | Ensure one active key per entity | `0004_create_encryption_keys.up.sql` (WHERE is_active = true) |

### Refresh Tokens Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_refresh_tokens_user_id` | `user_id` | B-tree | Find tokens for a user | `0005_create_refresh_tokens.up.sql` |
| `idx_refresh_tokens_token_hash` | `token_hash` | B-tree | Token validation lookups | `0005_create_refresh_tokens.up.sql` |
| `idx_refresh_tokens_expires_at` | `expires_at` | B-tree | Expiration-based queries | `0005_create_refresh_tokens.up.sql` |
| `idx_refresh_tokens_is_revoked` | `is_revoked` | B-tree | Filter revoked tokens | `0005_create_refresh_tokens.up.sql` |
| `idx_refresh_tokens_expired_revoked` | `expires_at, is_revoked` | B-tree Partial | Cleanup of expired/revoked tokens | `0005_create_refresh_tokens.up.sql` (WHERE expires_at < NOW() OR is_revoked = true) |

### Relationships Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_relationships_user` | `user` | B-tree | User-based relationship queries | `0006_create_relationships.up.sql` |
| `idx_relationships_relation` | `relation` | B-tree | Relation type filtering | `0006_create_relationships.up.sql` |
| `idx_relationships_object` | `object` | B-tree | Object-based queries | `0006_create_relationships.up.sql` |
| `idx_relationships_user_relation` | `user, relation` | B-tree (composite) | User-relation queries | `0006_create_relationships.up.sql` |
| `idx_relationships_object_relation` | `object, relation` | B-tree (composite) | Object-relation queries | `0006_create_relationships.up.sql` |
| `idx_relationships_composite` | `user, relation, object` | B-tree (composite) | Full tuple lookups | `0006_create_relationships.up.sql` |

### Audit Logs Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_audit_logs_user_id` | `user_id` | B-tree | User action history | `0008_create_audit_logs.up.sql` |
| `idx_audit_logs_action` | `action` | B-tree | Action type filtering | `0008_create_audit_logs.up.sql` |
| `idx_audit_logs_resource` | `resource` | B-tree | Resource type filtering | `0008_create_audit_logs.up.sql` |
| `idx_audit_logs_resource_id` | `resource_id` | B-tree | Specific resource history | `0008_create_audit_logs.up.sql` |
| `idx_audit_logs_created_at` | `created_at` | B-tree | Time-based queries | `0008_create_audit_logs.up.sql` |
| `idx_audit_logs_resource_action` | `resource, action` | B-tree (composite) | Resource-action queries | `0008_create_audit_logs.up.sql` |

### Passkey Credentials Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_passkey_credentials_user_id` | `user_id` | B-tree | Find credentials for a user | `0009_create_passkey_credentials.up.sql` |
| `idx_passkey_credentials_credential_id` | `credential_id` | B-tree | Credential validation | `0009_create_passkey_credentials.up.sql` |
| `idx_passkey_credentials_is_active` | `is_active` | B-tree | Filter active credentials | `0009_create_passkey_credentials.up.sql` |

### Organizations Table Indexes

| Index Name | Columns | Type | Purpose | Migration File |
|------------|---------|------|---------|----------------|
| `idx_organizations_slug` | `slug` | B-tree | Unique slug lookups | `0010_create_organizations.up.sql` |
| `idx_organizations_domain` | `domain` | B-tree | Domain-based lookups | `0010_create_organizations.up.sql` |

---

## Entity Mapping

This section maps database tables to their corresponding domain entity files in `src/domain/entities/`.

| Entity File | Table Name | Status |
|-------------|------------|--------|
| `user.rs` | `users` | ✅ Complete |
| `role.rs` | `roles` | ✅ Complete |
| `permission.rs` | `permissions` | ✅ Complete |
| `relationship.rs` | `relationships` | ✅ Complete |
| `encryption_key.rs` | `encryption_keys` | ✅ Complete |
| `organization.rs` | `organizations` | ⚠️ Missing (to be created) |

**Junction Tables** (no entities): `user_roles`, `role_permissions`

**Tables without entities** (used only for infrastructure):
- `refresh_tokens` - Internal token management
- `passkey_credentials` - Internal credential storage
- `audit_logs` - Audit trail
- `setup_status` - System setup tracking

---

## Foreign Keys

### Users Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `organization_id` | `organizations(id)` | SET NULL | `0011_add_organization_to_users.up.sql` |
| `created_by` | `users(id)` | (audit field) | `0013_add_audit_fields.up.sql` |
| `updated_by` | `users(id)` | (audit field) | `0013_add_audit_fields.up.sql` |

### User Roles Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `user_id` | `users(id)` | CASCADE | `0003_create_user_roles.up.sql` |
| `role_id` | `roles(id)` | CASCADE | `0003_create_user_roles.up.sql` |

### Role Permissions Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `role_id` | `roles(id)` | CASCADE | `0003_create_user_roles.up.sql` |
| `permission_id` | `permissions(id)` | CASCADE | `0003_create_user_roles.up.sql` |

### Refresh Tokens Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `user_id` | `users(id)` | CASCADE | `0005_create_refresh_tokens.up.sql` |

### Passkey Credentials Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `user_id` | `users(id)` | CASCADE | `0009_create_passkey_credentials.up.sql` |

### Audit Logs Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `user_id` | `users(id)` | SET NULL | `0008_create_audit_logs.up.sql` |

### Setup Status Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `setup_completed_by` | `users(id)` | SET NULL | `0012_create_setup_status.up.sql` |

### Organizations Table

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `created_by` | `users(id)` | (audit field) | `0013_add_audit_fields.up.sql` |
| `updated_by` | `users(id)` | (audit field) | `0013_add_audit_fields.up.sql` |

### Audit Fields (All Tables)

All tables with audit fields have these foreign keys:

| Column | References | On Delete | Migration File |
|--------|------------|-----------|----------------|
| `created_by` | `users(id)` | (nullable) | `0013_add_audit_fields.up.sql` |
| `updated_by` | `users(id)` | (nullable) | `0013_add_audit_fields.up.sql` |

---

## Triggers

### Update Timestamp Triggers

All tables have triggers that automatically update the `updated_at` timestamp on row updates:

| Trigger Name | Table | Function | Migration File |
|--------------|-------|----------|----------------|
| `update_users_updated_at` | `users` | `update_updated_at_column()` | `0001_create_users.up.sql` (updated in `0013`) |
| `update_roles_updated_at` | `roles` | `update_updated_at_column()` | `0002_create_roles_permissions.up.sql` (updated in `0013`) |
| `update_permissions_updated_at` | `permissions` | `update_updated_at_column()` | `0013_add_audit_fields.up.sql` |
| `update_relationships_updated_at` | `relationships` | `update_updated_at_column()` | `0013_add_audit_fields.up.sql` |
| `update_encryption_keys_updated_at` | `encryption_keys` | `update_updated_at_column()` | `0013_add_audit_fields.up.sql` |
| `update_organizations_updated_at` | `organizations` | `update_updated_at_column()` | `0010_create_organizations.up.sql` |
| `update_setup_status_updated_at` | `setup_status` | `update_updated_at_column()` | `0012_create_setup_status.up.sql` |

### Trigger Function

**Function**: `update_updated_at_column()`

**Purpose**: Automatically updates `updated_at` timestamp and increments `version` on row updates.

**Location**: Defined in migration `0001_create_users.up.sql`, updated in `0013_add_audit_fields.up.sql`

**Behavior** (after migration 0013):
- Sets `updated_at` to `CURRENT_TIMESTAMP`
- Increments `version` by 1

---

## Extensions

Currently, no PostgreSQL extensions are explicitly enabled in migrations.

**Note**: The schema uses:
- `gen_random_uuid()` function (built-in in PostgreSQL 13+, otherwise requires `pgcrypto` extension)
- `JSONB` type (built-in)

If you need to add extensions in the future, create them in a dedicated migration or in the `extensions/` folder.

---

## Partitions

Currently, no tables are partitioned.

**Potential candidates for future partitioning**:
- `audit_logs` - Partition by `created_at` (time-based partitioning)
- `relationships` - Partition by organization or time

---

## Quick Reference

### Indexes by Table

| Table Name | Total Indexes | Unique Indexes | Composite Indexes | Partial Indexes |
|------------|---------------|----------------|-------------------|-----------------|
| `users` | 8 | 2 (email, username) | 0 | 0 |
| `roles` | 2 | 1 (name) | 0 | 0 |
| `permissions` | 3 | 2 (name, resource+action) | 1 | 0 |
| `user_roles` | 2 | 1 (user_id+role_id) | 0 | 0 |
| `role_permissions` | 2 | 1 (role_id+permission_id) | 0 | 0 |
| `encryption_keys` | 5 | 1 (entity_id+entity_type+is_active, partial) | 1 | 1 |
| `refresh_tokens` | 5 | 1 (token_hash) | 0 | 1 |
| `relationships` | 6 | 1 (user+relation+object) | 3 | 0 |
| `audit_logs` | 6 | 0 | 1 | 0 |
| `passkey_credentials` | 3 | 1 (credential_id) | 0 | 0 |
| `organizations` | 2 | 1 (slug) | 0 | 0 |

### Tables with Audit Fields

All of the following tables have audit fields added in migration `0013_add_audit_fields.up.sql`:

- ✅ `users`
- ✅ `roles`
- ✅ `permissions`
- ✅ `relationships`
- ✅ `encryption_keys`
- ✅ `organizations`

**Audit fields include**:
- `request_id` (VARCHAR(255))
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK to users)
- `updated_by` (UUID, FK to users)
- `system_id` (VARCHAR(255))
- `version` (BIGINT)

---

## Migration Sequence

1. `0001_create_users` - Core user table
2. `0002_create_roles_permissions` - RBAC tables
3. `0003_create_user_roles` - Junction tables
4. `0004_create_encryption_keys` - Encryption management
5. `0005_create_refresh_tokens` - Token management
6. `0006_create_relationships` - Zanzibar authorization
7. `0007_seed_roles_permissions` - Initial data seeding
8. `0008_create_audit_logs` - Audit trail
9. `0009_create_passkey_credentials` - WebAuthn support
10. `0010_create_organizations` - Multi-tenant support
11. `0011_add_organization_to_users` - Link users to organizations
12. `0012_create_setup_status` - Setup tracking
13. `0013_add_audit_fields` - Add audit fields to all tables

---

## Notes

- All UUIDs use PostgreSQL's `gen_random_uuid()` function
- All timestamps use `TIMESTAMPTZ` (timezone-aware)
- Junction tables use composite unique constraints to prevent duplicates
- Most foreign keys use `CASCADE` delete for data consistency
- Organization foreign keys use `SET NULL` to preserve user records
- Audit logs use `SET NULL` to preserve audit history even if users are deleted

---

*Last updated: Generated from migration files*

