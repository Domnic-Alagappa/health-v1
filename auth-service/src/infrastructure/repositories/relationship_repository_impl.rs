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
        .bind(relationship.created_at)
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
}

