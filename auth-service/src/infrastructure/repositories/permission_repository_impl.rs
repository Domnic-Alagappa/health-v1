use crate::domain::entities::Permission;
use crate::domain::repositories::PermissionRepository;
use crate::infrastructure::database::queries::permissions::*;
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
        sqlx::query_as::<_, Permission>(PERMISSION_INSERT)
        .bind(permission.id)
        .bind(&permission.name)
        .bind(&permission.resource)
        .bind(&permission.action)
        .bind(&permission.description)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Permission>> {
        sqlx::query_as::<_, Permission>(PERMISSION_FIND_BY_ID)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_name(&self, name: &str) -> AppResult<Option<Permission>> {
        sqlx::query_as::<_, Permission>(PERMISSION_FIND_BY_NAME)
        .bind(name)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_resource_and_action(&self, resource: &str, action: &str) -> AppResult<Option<Permission>> {
        sqlx::query_as::<_, Permission>(PERMISSION_FIND_BY_RESOURCE_ACTION)
        .bind(resource)
        .bind(action)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list(&self) -> AppResult<Vec<Permission>> {
        sqlx::query_as::<_, Permission>(PERMISSION_LIST)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list_by_resource(&self, resource: &str) -> AppResult<Vec<Permission>> {
        sqlx::query_as::<_, Permission>(PERMISSION_LIST_BY_RESOURCE)
        .bind(resource)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
}

