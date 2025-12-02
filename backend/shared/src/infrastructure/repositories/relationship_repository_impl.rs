use crate::domain::entities::Relationship;
use crate::domain::repositories::RelationshipRepository;
use crate::infrastructure::database::queries::relationships::*;
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

pub struct RelationshipRepositoryImpl {
    pool: PgPool,
}

impl RelationshipRepositoryImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl RelationshipRepository for RelationshipRepositoryImpl {
    async fn create(&self, relationship: Relationship) -> AppResult<Relationship> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_INSERT)
        .bind(relationship.id)
        .bind(&relationship.user)
        .bind(&relationship.relation)
        .bind(&relationship.object)
        .bind(relationship.organization_id)
        .bind(relationship.created_at)
        .bind(relationship.valid_from)
        .bind(relationship.expires_at)
        .bind(relationship.is_active)
        .bind(&relationship.metadata)
        .bind(relationship.deleted_at)
        .bind(relationship.deleted_by)
        .bind(&relationship.request_id)
        .bind(relationship.updated_at)
        .bind(relationship.created_by)
        .bind(relationship.updated_by)
        .bind(&relationship.system_id)
        .bind(relationship.version)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_ID)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_user(&self, user: &str) -> AppResult<Vec<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_USER)
        .bind(user)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_object(&self, object: &str) -> AppResult<Vec<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_OBJECT)
        .bind(object)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_user_and_relation(&self, user: &str, relation: &str) -> AppResult<Vec<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_USER_RELATION)
        .bind(user)
        .bind(relation)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_user_object_relation(&self, user: &str, object: &str, relation: &str) -> AppResult<Option<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_USER_OBJECT_RELATION)
        .bind(user)
        .bind(object)
        .bind(relation)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn delete(&self, id: Uuid) -> AppResult<()> {
        sqlx::query(RELATIONSHIP_DELETE)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn update(&self, relationship: Relationship) -> AppResult<Relationship> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_UPDATE)
        .bind(relationship.id)
        .bind(relationship.valid_from)
        .bind(relationship.expires_at)
        .bind(relationship.is_active)
        .bind(&relationship.metadata)
        .bind(relationship.deleted_at)
        .bind(relationship.deleted_by)
        .bind(&relationship.request_id)
        .bind(relationship.updated_at)
        .bind(relationship.updated_by)
        .bind(&relationship.system_id)
        .bind(relationship.version)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn delete_by_tuple(&self, user: &str, relation: &str, object: &str) -> AppResult<()> {
        sqlx::query(RELATIONSHIP_DELETE_BY_TUPLE)
        .bind(user)
        .bind(relation)
        .bind(object)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }
    
    async fn soft_delete(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query(RELATIONSHIP_SOFT_DELETE)
        .bind(id)
        .bind(deleted_by)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }
    
    async fn list_all(&self) -> AppResult<Vec<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_LIST_ALL)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
    
    async fn find_by_user_and_org(&self, user: &str, organization_id: Uuid) -> AppResult<Vec<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_USER_AND_ORG)
        .bind(user)
        .bind(organization_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
    
    async fn find_by_organization(&self, organization_id: Uuid) -> AppResult<Vec<Relationship>> {
        sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_ORGANIZATION)
        .bind(organization_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
    
    async fn find_by_user_object_relation_org(
        &self,
        user: &str,
        object: &str,
        relation: &str,
        organization_id: Option<Uuid>,
    ) -> AppResult<Option<Relationship>> {
        if let Some(org_id) = organization_id {
            sqlx::query_as::<_, Relationship>(RELATIONSHIP_FIND_BY_USER_OBJECT_RELATION_ORG)
            .bind(user)
            .bind(object)
            .bind(relation)
            .bind(org_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
        } else {
            self.find_by_user_object_relation(user, object, relation).await
        }
    }
}

