use crate::domain::entities::Group;
use crate::domain::repositories::GroupRepository;
use crate::infrastructure::database::queries::groups::*;
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
        sqlx::query_as::<_, Group>(GROUP_INSERT)
        .bind(group.id)
        .bind(&group.name)
        .bind(&group.description)
        .bind(group.organization_id)
        .bind(&group.metadata)
        .bind(group.created_at)
        .bind(group.updated_at)
        .bind(group.deleted_at)
        .bind(group.deleted_by)
        .bind(&group.request_id)
        .bind(group.created_by)
        .bind(group.updated_by)
        .bind(&group.system_id)
        .bind(group.version)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update(&self, group: Group) -> AppResult<Group> {
        sqlx::query_as::<_, Group>(GROUP_UPDATE)
        .bind(group.id)
        .bind(&group.name)
        .bind(&group.description)
        .bind(group.organization_id)
        .bind(&group.metadata)
        .bind(group.updated_at)
        .bind(&group.request_id)
        .bind(group.updated_by)
        .bind(&group.system_id)
        .bind(group.version)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Group>> {
        sqlx::query_as::<_, Group>(GROUP_FIND_BY_ID)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_name(&self, name: &str, organization_id: Option<Uuid>) -> AppResult<Option<Group>> {
        sqlx::query_as::<_, Group>(GROUP_FIND_BY_NAME)
        .bind(name)
        .bind(organization_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_organization(&self, organization_id: Uuid) -> AppResult<Vec<Group>> {
        sqlx::query_as::<_, Group>(GROUP_FIND_BY_ORGANIZATION)
        .bind(organization_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_all(&self) -> AppResult<Vec<Group>> {
        sqlx::query_as::<_, Group>(GROUP_FIND_ALL)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn soft_delete(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query(GROUP_SOFT_DELETE)
        .bind(id)
        .bind(deleted_by)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn restore(&self, id: Uuid) -> AppResult<()> {
        sqlx::query(GROUP_RESTORE)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }
}

