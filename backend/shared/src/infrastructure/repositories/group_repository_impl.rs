use crate::domain::entities::Group;
use crate::domain::repositories::GroupRepository;
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

pub struct GroupRepositoryImpl {
    pool: PgPool,
}

impl GroupRepositoryImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl GroupRepository for GroupRepositoryImpl {
    async fn create(&self, group: Group) -> AppResult<Group> {
        sqlx::query_as!(
            Group,
            r#"
            INSERT INTO groups (
                id, name, description, organization_id, metadata, created_at, updated_at,
                deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id, name, description, organization_id, metadata, created_at, updated_at,
                      deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
            "#,
            group.id,
            group.name,
            group.description,
            group.organization_id,
            group.metadata,
            group.created_at,
            group.updated_at,
            group.deleted_at,
            group.deleted_by,
            group.request_id,
            group.created_by,
            group.updated_by,
            group.system_id,
            group.version
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update(&self, group: Group) -> AppResult<Group> {
        sqlx::query_as!(
            Group,
            r#"
            UPDATE groups
            SET name = $2,
                description = $3,
                organization_id = $4,
                metadata = $5,
                updated_at = $6,
                request_id = $7,
                updated_by = $8,
                system_id = $9,
                version = $10
            WHERE id = $1
            RETURNING id, name, description, organization_id, metadata, created_at, updated_at,
                      deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
            "#,
            group.id,
            group.name,
            group.description,
            group.organization_id,
            group.metadata,
            group.updated_at,
            group.request_id,
            group.updated_by,
            group.system_id,
            group.version
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Group>> {
        sqlx::query_as!(
            Group,
            r#"
            SELECT id, name, description, organization_id, metadata, created_at, updated_at,
                   deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
            FROM groups
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_name(&self, name: &str, organization_id: Option<Uuid>) -> AppResult<Option<Group>> {
        sqlx::query_as!(
            Group,
            r#"
            SELECT id, name, description, organization_id, metadata, created_at, updated_at,
                   deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
            FROM groups
            WHERE name = $1 
            AND (organization_id = $2 OR ($2 IS NULL AND organization_id IS NULL))
            AND deleted_at IS NULL
            "#,
            name,
            organization_id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_organization(&self, organization_id: Uuid) -> AppResult<Vec<Group>> {
        sqlx::query_as!(
            Group,
            r#"
            SELECT id, name, description, organization_id, metadata, created_at, updated_at,
                   deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
            FROM groups
            WHERE organization_id = $1 AND deleted_at IS NULL
            ORDER BY name ASC
            "#,
            organization_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_all(&self) -> AppResult<Vec<Group>> {
        sqlx::query_as!(
            Group,
            r#"
            SELECT id, name, description, organization_id, metadata, created_at, updated_at,
                   deleted_at, deleted_by, request_id, created_by, updated_by, system_id, version
            FROM groups
            WHERE deleted_at IS NULL
            ORDER BY name ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn soft_delete(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE groups
            SET deleted_at = NOW(),
                deleted_by = $2,
                updated_at = NOW(),
                version = version + 1
            WHERE id = $1
            "#,
            id,
            deleted_by
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn restore(&self, id: Uuid) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE groups
            SET deleted_at = NULL,
                deleted_by = NULL,
                updated_at = NOW(),
                version = version + 1
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }
}

