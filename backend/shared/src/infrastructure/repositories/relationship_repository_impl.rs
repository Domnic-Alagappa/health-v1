use crate::domain::entities::Relationship;
use crate::domain::repositories::RelationshipRepository;
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
        sqlx::query_as!(
            Relationship,
            r#"
            INSERT INTO relationships (
                id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                created_by, updated_by, system_id, version
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT ("user", relation, object, organization_id) 
            WHERE deleted_at IS NULL
            DO UPDATE SET 
                id = EXCLUDED.id,
                updated_at = EXCLUDED.updated_at,
                version = relationships.version + 1
            RETURNING id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                       is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                       created_by, updated_by, system_id, version
            "#,
            relationship.id,
            relationship.user,
            relationship.relation,
            relationship.object,
            relationship.organization_id,
            relationship.created_at,
            relationship.valid_from,
            relationship.expires_at,
            relationship.is_active,
            relationship.metadata,
            relationship.deleted_at,
            relationship.deleted_by,
            relationship.request_id,
            relationship.updated_at,
            relationship.created_by,
            relationship.updated_by,
            relationship.system_id,
            relationship.version
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_user(&self, user: &str) -> AppResult<Vec<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE "user" = $1
            ORDER BY created_at DESC
            "#,
            user
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_object(&self, object: &str) -> AppResult<Vec<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE object = $1
            ORDER BY created_at DESC
            "#,
            object
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_user_and_relation(&self, user: &str, relation: &str) -> AppResult<Vec<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE "user" = $1 AND relation = $2
            ORDER BY created_at DESC
            "#,
            user,
            relation
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_user_object_relation(&self, user: &str, object: &str, relation: &str) -> AppResult<Option<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE "user" = $1 AND object = $2 AND relation = $3
            AND deleted_at IS NULL
            "#,
            user,
            object,
            relation
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn delete(&self, id: Uuid) -> AppResult<()> {
        sqlx::query!(
            r#"
            DELETE FROM relationships
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn update(&self, relationship: Relationship) -> AppResult<Relationship> {
        sqlx::query_as!(
            Relationship,
            r#"
            UPDATE relationships
            SET valid_from = $2,
                expires_at = $3,
                is_active = $4,
                metadata = $5,
                deleted_at = $6,
                deleted_by = $7,
                request_id = $8,
                updated_at = $9,
                updated_by = $10,
                system_id = $11,
                version = $12
            WHERE id = $1
            RETURNING id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                       is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                       created_by, updated_by, system_id, version
            "#,
            relationship.id,
            relationship.valid_from,
            relationship.expires_at,
            relationship.is_active,
            relationship.metadata,
            relationship.deleted_at,
            relationship.deleted_by,
            relationship.request_id,
            relationship.updated_at,
            relationship.updated_by,
            relationship.system_id,
            relationship.version
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn delete_by_tuple(&self, user: &str, relation: &str, object: &str) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE relationships
            SET deleted_at = NOW(),
                is_active = false,
                updated_at = NOW(),
                version = version + 1
            WHERE "user" = $1 AND relation = $2 AND object = $3
            AND deleted_at IS NULL
            "#,
            user,
            relation,
            object
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }
    
    async fn soft_delete(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE relationships
            SET deleted_at = NOW(),
                deleted_by = $2,
                is_active = false,
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
    
    async fn list_all(&self) -> AppResult<Vec<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
    
    async fn find_by_user_and_org(&self, user: &str, organization_id: Uuid) -> AppResult<Vec<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE "user" = $1 AND organization_id = $2
            ORDER BY created_at DESC
            "#,
            user,
            organization_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
    
    async fn find_by_organization(&self, organization_id: Uuid) -> AppResult<Vec<Relationship>> {
        sqlx::query_as!(
            Relationship,
            r#"
            SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                   is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                   created_by, updated_by, system_id, version
            FROM relationships
            WHERE organization_id = $1
            AND deleted_at IS NULL
            ORDER BY created_at DESC
            "#,
            organization_id
        )
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
            sqlx::query_as!(
                Relationship,
                r#"
                SELECT id, "user", relation, object, organization_id, created_at, valid_from, expires_at, 
                       is_active, metadata, deleted_at, deleted_by, request_id, updated_at, 
                       created_by, updated_by, system_id, version
                FROM relationships
                WHERE "user" = $1 AND object = $2 AND relation = $3 AND organization_id = $4
                AND deleted_at IS NULL
                "#,
                user,
                object,
                relation,
                org_id
            )
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
        } else {
            self.find_by_user_object_relation(user, object, relation).await
        }
    }
}

