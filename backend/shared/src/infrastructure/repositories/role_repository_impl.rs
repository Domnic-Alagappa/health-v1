use crate::domain::entities::Role;
use crate::domain::repositories::{RoleRepository, PermissionRepository};
use crate::infrastructure::database::DatabaseService;
use crate::infrastructure::zanzibar::RelationshipStore;
use crate::shared::AppResult;
use async_trait::async_trait;
use std::sync::Arc;
use uuid::Uuid;

pub struct RoleRepositoryImpl {
    database_service: Arc<DatabaseService>,
    relationship_store: Arc<RelationshipStore>,
    permission_repository: Arc<dyn PermissionRepository>,
}

impl RoleRepositoryImpl {
    pub fn new(
        database_service: Arc<DatabaseService>,
        relationship_store: Arc<RelationshipStore>,
        permission_repository: Arc<dyn PermissionRepository>,
    ) -> Self {
        Self {
            database_service,
            relationship_store,
            permission_repository,
        }
    }
}

#[async_trait]
impl RoleRepository for RoleRepositoryImpl {
    async fn create(&self, role: Role) -> AppResult<Role> {
        let role_id = role.id;
        
        // Insert role with audit fields
        sqlx::query!(
            r#"
            INSERT INTO roles (
                id, name, description, created_at, updated_at,
                request_id, created_by, updated_by, system_id, version
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#,
            role.id,
            role.name,
            role.description,
            role.created_at,
            role.updated_at,
            role.request_id,
            role.created_by,
            role.updated_by,
            role.system_id,
            role.version
        )
        .execute(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        // Insert permissions into Zanzibar
        // Get permission details to create Zanzibar relationships
        for permission_id in &role.permissions {
            if let Some(permission) = self.permission_repository.find_by_id(*permission_id).await? {
                let role_str = format!("role:{}", role.name);
                let resource_str = format!("resource:{}", permission.resource);
                // Create relationship: role:{name}#{action}@{resource}
                self.relationship_store
                    .add(&role_str, &permission.action, &resource_str)
                    .await?;
            }
        }

        // Fetch the created role with permissions
        self.find_by_id(role_id).await.map(|r| r.unwrap())
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Role>> {
        // Use query_as with FromRow - but we need to handle permissions separately
        // Since permissions are stored in a separate table, we'll fetch role first then permissions
        let row = sqlx::query!(
            r#"
            SELECT id, name, description, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version
            FROM roles
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        if let Some(row) = row {
            let permissions = self.get_role_permissions(row.id).await?;
            Ok(Some(Role {
                id: row.id,
                name: row.name,
                description: row.description,
                permissions,
                request_id: row.request_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
                created_by: row.created_by,
                updated_by: row.updated_by,
                system_id: row.system_id,
                version: row.version,
            }))
        } else {
            Ok(None)
        }
    }

    async fn find_by_name(&self, name: &str) -> AppResult<Option<Role>> {
        let row = sqlx::query!(
            r#"
            SELECT id, name, description, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version
            FROM roles
            WHERE name = $1
            "#,
            name
        )
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        if let Some(row) = row {
            let permissions = self.get_role_permissions(row.id).await?;
            Ok(Some(Role {
                id: row.id,
                name: row.name,
                description: row.description,
                permissions,
                request_id: row.request_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
                created_by: row.created_by,
                updated_by: row.updated_by,
                system_id: row.system_id,
                version: row.version,
            }))
        } else {
            Ok(None)
        }
    }

    async fn list(&self) -> AppResult<Vec<Role>> {
        let rows = sqlx::query!(
            r#"
            SELECT id, name, description, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version
            FROM roles
            ORDER BY name
            "#,
        )
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        let mut roles = Vec::new();
        for row in rows {
            let permissions = self.get_role_permissions(row.id).await?;
            roles.push(Role {
                id: row.id,
                name: row.name,
                description: row.description,
                permissions,
                request_id: row.request_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
                created_by: row.created_by,
                updated_by: row.updated_by,
                system_id: row.system_id,
                version: row.version,
            });
        }

        Ok(roles)
    }

    async fn add_permission_to_role(&self, role_id: Uuid, permission_id: Uuid) -> AppResult<()> {
        // Get role and permission details
        let role = self.find_by_id(role_id).await?
            .ok_or_else(|| crate::shared::AppError::NotFound(
                format!("Role {} not found", role_id)
            ))?;
        
        let permission = self.permission_repository.find_by_id(permission_id).await?
            .ok_or_else(|| crate::shared::AppError::NotFound(
                format!("Permission {} not found", permission_id)
            ))?;
        
        // Create Zanzibar relationship: role:{name}#{action}@{resource}
        let role_str = format!("role:{}", role.name);
        let resource_str = format!("resource:{}", permission.resource);
        
        self.relationship_store
            .add(&role_str, &permission.action, &resource_str)
            .await?;
        
        Ok(())
    }

    async fn remove_permission_from_role(&self, role_id: Uuid, permission_id: Uuid) -> AppResult<()> {
        // Get role and permission details
        let role = self.find_by_id(role_id).await?
            .ok_or_else(|| crate::shared::AppError::NotFound(
                format!("Role {} not found", role_id)
            ))?;
        
        let permission = self.permission_repository.find_by_id(permission_id).await?
            .ok_or_else(|| crate::shared::AppError::NotFound(
                format!("Permission {} not found", permission_id)
            ))?;
        
        // Remove Zanzibar relationship: role:{name}#{action}@{resource}
        let role_str = format!("role:{}", role.name);
        let resource_str = format!("resource:{}", permission.resource);
        
        self.relationship_store
            .soft_delete(&role_str, &permission.action, &resource_str, None)
            .await?;
        
        Ok(())
    }

    async fn get_role_permissions(&self, role_id: Uuid) -> AppResult<Vec<Uuid>> {
        // Get role name directly from database to avoid recursion
        let row = sqlx::query!(
            r#"
            SELECT id, name, description, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version
            FROM roles
            WHERE id = $1
            "#,
            role_id
        )
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        let role_name = if let Some(row) = row {
            row.name
        } else {
            return Ok(Vec::new());
        };
        
        let role_str = format!("role:{}", role_name);
        
        // Get all relationships for this role
        let relationships = self.relationship_store
            .get_valid_relationships(&role_str)
            .await?;
        
        // Extract permissions from relationships
        // Format: role:{name}#{action}@{resource}
        let mut permission_ids = Vec::new();
        for rel in relationships {
            if rel.object.starts_with("resource:") {
                let resource = rel.object.strip_prefix("resource:").unwrap_or(&rel.object);
                let action = &rel.relation;
                
                // Find permission by resource and action
                if let Some(permission) = self.permission_repository
                    .find_by_resource_and_action(resource, action)
                    .await?
                {
                    permission_ids.push(permission.id);
                }
            }
        }
        
        Ok(permission_ids)
    }

    async fn get_user_roles(&self, user_id: Uuid) -> AppResult<Vec<Role>> {
        let user_str = format!("user:{}", user_id);
        
        // Get all relationships where user has_role
        let relationships = self.relationship_store
            .get_valid_relationships(&user_str)
            .await?;
        
        let mut roles = Vec::new();
        for rel in relationships {
            if rel.relation == "has_role" && rel.object.starts_with("role:") {
                let role_name = rel.object.strip_prefix("role:").unwrap_or(&rel.object);
                
                // Find role by name (this will call get_role_permissions, but that's OK)
                if let Some(role) = self.find_by_name(role_name).await? {
                    roles.push(role);
                }
            }
        }
        
        Ok(roles)
    }
}

