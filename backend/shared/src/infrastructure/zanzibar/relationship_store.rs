use crate::domain::entities::Relationship;
use crate::domain::repositories::RelationshipRepository;
use crate::shared::AppResult;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use serde_json::Value;
use tracing;

pub struct RelationshipStore {
    repository: Box<dyn RelationshipRepository>,
}

impl RelationshipStore {
    pub fn new(repository: Box<dyn RelationshipRepository>) -> Self {
        Self { repository }
    }

    pub async fn add(&self, user: &str, relation: &str, object: &str) -> AppResult<()> {
        self.add_with_organization(user, relation, object, None).await
    }
    
    /// Add relationship with organization scoping
    pub async fn add_with_organization(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        organization_id: Option<Uuid>,
    ) -> AppResult<()> {
        tracing::debug!("Creating relationship: {} → {} → {} [org: {:?}]", user, relation, object, organization_id);
        let relationship = Relationship::new_with_organization(
            user.to_string(),
            relation.to_string(),
            object.to_string(),
            organization_id,
        );
        match self.repository.create(relationship).await {
            Ok(created) => {
                tracing::debug!(
                    "Successfully created relationship: {} → {} → {} [org: {:?}] (id: {})",
                    created.user,
                    created.relation,
                    created.object,
                    created.organization_id,
                    created.id
                );
                Ok(())
            }
            Err(e) => {
                tracing::error!(
                    "Failed to create relationship: {} → {} → {} [org: {:?}]: {}",
                    user,
                    relation,
                    object,
                    organization_id,
                    e
                );
                Err(e)
            }
        }
    }
    
    /// Add relationship with optional expiration
    pub async fn add_with_expiration(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        expires_at: Option<DateTime<Utc>>,
    ) -> AppResult<()> {
        let relationship = if let Some(exp) = expires_at {
            Relationship::new_with_expiration(
                user.to_string(),
                relation.to_string(),
                object.to_string(),
                exp,
            )
        } else {
            Relationship::new(
                user.to_string(),
                relation.to_string(),
                object.to_string(),
            )
        };
        
        self.repository.create(relationship).await?;
        Ok(())
    }
    
    /// Add relationship with validity window
    pub async fn add_with_validity(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        valid_from: DateTime<Utc>,
        expires_at: Option<DateTime<Utc>>,
    ) -> AppResult<()> {
        let relationship = Relationship::new_with_validity(
            user.to_string(),
            relation.to_string(),
            object.to_string(),
            valid_from,
            expires_at,
        );
        
        self.repository.create(relationship).await?;
        Ok(())
    }
    
    /// Add relationship with metadata (optionally encrypted)
    pub async fn add_with_metadata(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        metadata: Option<Value>,
        expires_at: Option<DateTime<Utc>>,
    ) -> AppResult<()> {
        let mut relationship = if let Some(exp) = expires_at {
            Relationship::new_with_expiration(
                user.to_string(),
                relation.to_string(),
                object.to_string(),
                exp,
            )
        } else {
            Relationship::new(
                user.to_string(),
                relation.to_string(),
                object.to_string(),
            )
        };
        
        if let Some(meta) = metadata {
            relationship.set_metadata(meta, false); // Encryption handled in service layer
        }
        
        self.repository.create(relationship).await?;
        Ok(())
    }
    
    /// Extend relationship expiration
    pub async fn extend_expiration(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        new_expires_at: DateTime<Utc>,
    ) -> AppResult<()> {
        if let Some(mut rel) = self.repository
            .find_by_user_object_relation(user, object, relation)
            .await?
        {
            rel.extend_expiration(new_expires_at);
            self.repository.update(rel).await?;
        }
        Ok(())
    }
    
    /// Revoke relationship (soft delete)
    pub async fn revoke(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        revoked_by: Option<Uuid>,
    ) -> AppResult<()> {
        if let Some(mut rel) = self.repository
            .find_by_user_object_relation(user, object, relation)
            .await?
        {
            rel.revoke(revoked_by);
            self.repository.update(rel).await?;
        }
        Ok(())
    }
    
    /// Soft delete relationship
    pub async fn soft_delete(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        deleted_by: Option<Uuid>,
    ) -> AppResult<()> {
        if let Some(mut rel) = self.repository
            .find_by_user_object_relation(user, object, relation)
            .await?
        {
            rel.soft_delete(deleted_by);
            self.repository.update(rel).await?;
        }
        Ok(())
    }

    pub async fn remove(&self, user: &str, relation: &str, object: &str) -> AppResult<()> {
        // Use soft delete instead of hard delete
        self.soft_delete(user, relation, object, None).await
    }

    /// Check relationship (only returns true if valid and not expired/deleted)
    pub async fn check(&self, user: &str, relation: &str, object: &str) -> AppResult<bool> {
        self.check_with_organization(user, relation, object, None).await
    }
    
    /// Check relationship with organization scoping
    pub async fn check_with_organization(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        organization_id: Option<Uuid>,
    ) -> AppResult<bool> {
        if let Some(relationship) = self.repository
            .find_by_user_object_relation_org(user, object, relation, organization_id)
            .await?
        {
            return Ok(relationship.is_valid());
        }
        Ok(false)
    }

    pub async fn get_relationships(&self, user: &str) -> AppResult<Vec<Relationship>> {
        self.repository.find_by_user(user).await
    }
    
    /// Get relationships for user within organization
    pub async fn get_relationships_by_org(
        &self,
        user: &str,
        organization_id: Uuid,
    ) -> AppResult<Vec<Relationship>> {
        self.repository.find_by_user_and_org(user, organization_id).await
    }
    
    /// Get only valid relationships (filters expired and deleted)
    pub async fn get_valid_relationships(&self, user: &str) -> AppResult<Vec<Relationship>> {
        let all = self.repository.find_by_user(user).await?;
        Ok(all.into_iter().filter(|r| r.is_valid()).collect())
    }
    
    /// Get only valid relationships for user within organization
    pub async fn get_valid_relationships_by_org(
        &self,
        user: &str,
        organization_id: Uuid,
    ) -> AppResult<Vec<Relationship>> {
        let all = self.repository.find_by_user_and_org(user, organization_id).await?;
        Ok(all.into_iter().filter(|r| r.is_valid()).collect())
    }
    
    /// Get repository (for graph building)
    pub fn repository(&self) -> &dyn RelationshipRepository {
        self.repository.as_ref()
    }
}

