use crate::domain::entities::Role;
use crate::domain::repositories::{RoleRepository, PermissionRepository};
use crate::infrastructure::database::DatabaseService;
use crate::infrastructure::database::queries::roles::*;
use crate::infrastructure::zanzibar::RelationshipStore;
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::Row;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

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
        sqlx::query(ROLE_INSERT)
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
        let row = sqlx::query(ROLE_FIND_BY_ID)
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
        let row = sqlx::query(ROLE_FIND_BY_NAME)
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
        let rows = sqlx::query(ROLE_LIST)
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
        let row = sqlx::query(ROLE_FIND_BY_ID)
        .bind(role_id)
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        let role_name = if let Some(row) = row {
            row.get::<String, _>("name")
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

