use crate::domain::repositories::setup_repository::{OrganizationInfo, SetupRepository};
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

pub struct SetupRepositoryImpl {
    pool: PgPool,
}

impl SetupRepositoryImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl SetupRepository for SetupRepositoryImpl {
    async fn is_setup_completed(&self) -> AppResult<bool> {
        let result: Option<bool> = sqlx::query_scalar(
            "SELECT setup_completed FROM setup_status ORDER BY created_at DESC LIMIT 1"
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(result.unwrap_or(false))
    }

    async fn mark_setup_completed(&self, completed_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE setup_status
            SET setup_completed = true,
                setup_completed_at = NOW(),
                setup_completed_by = $1,
                updated_at = NOW()
            WHERE id = (SELECT id FROM setup_status ORDER BY created_at DESC LIMIT 1)
            "#
        )
        .bind(completed_by)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(())
    }

    async fn create_organization(
        &self,
        name: &str,
        slug: &str,
        domain: Option<&str>,
    ) -> AppResult<Uuid> {
        let org_id = Uuid::new_v4();
        
        sqlx::query(
            r#"
            INSERT INTO organizations (id, name, slug, domain, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            "#
        )
        .bind(org_id)
        .bind(name)
        .bind(slug)
        .bind(domain)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(org_id)
    }

    async fn get_organization(&self, id: &Uuid) -> AppResult<Option<OrganizationInfo>> {
        let result = sqlx::query_as::<_, (Uuid, String, String, Option<String>)>(
            r#"
            SELECT id, name, slug, domain
            FROM organizations
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(result.map(|(id, name, slug, domain)| OrganizationInfo {
            id,
            name,
            slug,
            domain,
        }))
    }
}

