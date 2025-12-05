use crate::domain::entities::Permission;
use crate::domain::repositories::PermissionRepository;
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PermissionRepositoryImpl {
    pool: PgPool,
}

impl PermissionRepositoryImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PermissionRepository for PermissionRepositoryImpl {
    async fn create(&self, permission: Permission) -> AppResult<Permission> {
        sqlx::query_as!(
            Permission,
            r#"
            INSERT INTO permissions (id, name, resource, action, description, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (name) DO UPDATE SET resource = EXCLUDED.resource, action = EXCLUDED.action
            RETURNING id, name, resource, action, description, request_id, created_at, updated_at, created_by, updated_by, system_id, version
            "#,
            permission.id,
            permission.name,
            permission.resource,
            permission.action,
            permission.description
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Permission>> {
        sqlx::query_as!(
            Permission,
            r#"
            SELECT id, name, resource, action, description, request_id, created_at, updated_at, created_by, updated_by, system_id, version
            FROM permissions
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_name(&self, name: &str) -> AppResult<Option<Permission>> {
        sqlx::query_as!(
            Permission,
            r#"
            SELECT id, name, resource, action, description, request_id, created_at, updated_at, created_by, updated_by, system_id, version
            FROM permissions
            WHERE name = $1
            "#,
            name
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_resource_and_action(&self, resource: &str, action: &str) -> AppResult<Option<Permission>> {
        sqlx::query_as!(
            Permission,
            r#"
            SELECT id, name, resource, action, description, request_id, created_at, updated_at, created_by, updated_by, system_id, version
            FROM permissions
            WHERE resource = $1 AND action = $2
            "#,
            resource,
            action
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list(&self) -> AppResult<Vec<Permission>> {
        sqlx::query_as!(
            Permission,
            r#"
            SELECT id, name, resource, action, description, request_id, created_at, updated_at, created_by, updated_by, system_id, version
            FROM permissions
            ORDER BY resource, action
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list_by_resource(&self, resource: &str) -> AppResult<Vec<Permission>> {
        sqlx::query_as!(
            Permission,
            r#"
            SELECT id, name, resource, action, description, request_id, created_at, updated_at, created_by, updated_by, system_id, version
            FROM permissions
            WHERE resource = $1
            ORDER BY action
            "#,
            resource
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
}

