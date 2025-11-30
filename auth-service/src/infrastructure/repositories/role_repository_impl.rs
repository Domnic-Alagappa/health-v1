use crate::domain::entities::Role;
use crate::domain::repositories::RoleRepository;
use crate::infrastructure::database::DatabaseService;
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::Row;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

pub struct RoleRepositoryImpl {
    database_service: Arc<DatabaseService>,
}

impl RoleRepositoryImpl {
    pub fn new(database_service: Arc<DatabaseService>) -> Self {
        Self { database_service }
    }
}

#[async_trait]
impl RoleRepository for RoleRepositoryImpl {
    async fn create(&self, role: Role) -> AppResult<Role> {
        let role_id = role.id;
        
        // Insert role with audit fields
        sqlx::query(
            r#"
            INSERT INTO roles (
                id, name, description, created_at, updated_at,
                request_id, created_by, updated_by, system_id, version
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#
        )
        .bind(role.id)
        .bind(&role.name)
        .bind(&role.description)
        .bind(role.created_at)
        .bind(role.updated_at)
        .bind(&role.request_id)
        .bind(role.created_by)
        .bind(role.updated_by)
        .bind(&role.system_id)
        .bind(role.version)
        .execute(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        // Insert permissions
        let now = Utc::now();
        for permission_id in &role.permissions {
            sqlx::query(
                r#"
                INSERT INTO role_permissions (role_id, permission_id, created_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (role_id, permission_id) DO NOTHING
                "#
            )
            .bind(role_id)
            .bind(permission_id)
            .bind(now)
            .execute(self.database_service.pool())
            .await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        }

        // Fetch the created role with permissions
        self.find_by_id(role_id).await.map(|r| r.unwrap())
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Role>> {
        // Use query_as with FromRow - but we need to handle permissions separately
        // Since permissions are stored in a separate table, we'll fetch role first then permissions
        let row = sqlx::query(
            r#"
            SELECT id, name, description, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version
            FROM roles
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        if let Some(row) = row {
            let role_id: Uuid = row.get("id");
            let permissions = self.get_role_permissions(role_id).await?;
            Ok(Some(Role {
                id: role_id,
                name: row.get("name"),
                description: row.get("description"),
                permissions,
                request_id: row.get("request_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                updated_by: row.get("updated_by"),
                system_id: row.get("system_id"),
                version: row.get("version"),
            }))
        } else {
            Ok(None)
        }
    }

    async fn find_by_name(&self, name: &str) -> AppResult<Option<Role>> {
        let row = sqlx::query(
            r#"
            SELECT id, name, description, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version
            FROM roles
            WHERE name = $1
            "#
        )
        .bind(name)
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        if let Some(row) = row {
            let role_id: Uuid = row.get("id");
            let permissions = self.get_role_permissions(role_id).await?;
            Ok(Some(Role {
                id: role_id,
                name: row.get("name"),
                description: row.get("description"),
                permissions,
                request_id: row.get("request_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                updated_by: row.get("updated_by"),
                system_id: row.get("system_id"),
                version: row.get("version"),
            }))
        } else {
            Ok(None)
        }
    }

    async fn list(&self) -> AppResult<Vec<Role>> {
        let rows = sqlx::query(
            r#"
            SELECT id, name, description, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version
            FROM roles
            ORDER BY name
            "#
        )
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        let mut roles = Vec::new();
        for row in rows {
            let role_id: Uuid = row.get("id");
            let permissions = self.get_role_permissions(role_id).await?;
            roles.push(Role {
                id: role_id,
                name: row.get("name"),
                description: row.get("description"),
                permissions,
                request_id: row.get("request_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                updated_by: row.get("updated_by"),
                system_id: row.get("system_id"),
                version: row.get("version"),
            });
        }

        Ok(roles)
    }

    async fn add_permission_to_role(&self, role_id: Uuid, permission_id: Uuid) -> AppResult<()> {
        sqlx::query(
            r#"
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (role_id, permission_id) DO NOTHING
            "#
        )
        .bind(role_id)
        .bind(permission_id)
        .bind(Utc::now())
            .execute(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn remove_permission_from_role(&self, role_id: Uuid, permission_id: Uuid) -> AppResult<()> {
        sqlx::query(
            r#"
            DELETE FROM role_permissions
            WHERE role_id = $1 AND permission_id = $2
            "#
        )
        .bind(role_id)
        .bind(permission_id)
            .execute(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn get_role_permissions(&self, role_id: Uuid) -> AppResult<Vec<Uuid>> {
        let rows = sqlx::query(
            r#"
            SELECT permission_id
            FROM role_permissions
            WHERE role_id = $1
            ORDER BY created_at
            "#
        )
        .bind(role_id)
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(rows.into_iter().map(|r| {
            r.try_get::<Uuid, _>("permission_id")
                .unwrap_or_else(|_| Uuid::nil())
        }).filter(|id| *id != Uuid::nil()).collect())
    }

    async fn get_user_roles(&self, user_id: Uuid) -> AppResult<Vec<Role>> {
        let rows = sqlx::query(
            r#"
            SELECT r.id, r.name, r.description, r.request_id, r.created_at, r.updated_at,
                   r.created_by, r.updated_by, r.system_id, r.version
            FROM roles r
            INNER JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = $1
            ORDER BY r.name
            "#
        )
        .bind(user_id)
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        let mut roles = Vec::new();
        for row in rows {
            let role_id: Uuid = row.try_get("id")
                .map_err(|e| crate::shared::AppError::Database(sqlx::Error::ColumnDecode {
                    index: "id".to_string(),
                    source: Box::new(e),
                }))?;
            let permissions = self.get_role_permissions(role_id).await?;
            roles.push(Role {
                id: role_id,
                name: row.get("name"),
                description: row.get("description"),
                permissions,
                request_id: row.get("request_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                created_by: row.get("created_by"),
                updated_by: row.get("updated_by"),
                system_id: row.get("system_id"),
                version: row.get("version"),
            });
        }

        Ok(roles)
    }
}

