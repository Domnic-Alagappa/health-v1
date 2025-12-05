use shared::domain::entities::Relationship;
use shared::domain::repositories::RelationshipRepository;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::infrastructure::encryption::{DekManager, RelationshipEncryption};
use shared::AppResult;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;
use std::sync::Arc;

pub struct CreatePermissionUseCase {
    relationship_repository: Box<dyn RelationshipRepository>,
    #[allow(dead_code)]
    relationship_store: Arc<RelationshipStore>,
    dek_manager: Arc<DekManager>,
}

impl CreatePermissionUseCase {
    pub fn new(
        relationship_repository: Box<dyn RelationshipRepository>,
        relationship_store: Arc<RelationshipStore>,
        dek_manager: Arc<DekManager>,
    ) -> Self {
        Self {
            relationship_repository,
            relationship_store,
            dek_manager,
        }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        relation: &str,
        object: &str,
        expires_at: Option<DateTime<Utc>>,
        valid_from: Option<DateTime<Utc>>,
        metadata: Option<Value>,
        encrypt_metadata: bool,
    ) -> AppResult<Relationship> {
        let user_str = format!("user:{}", user_id);
        
        // Create relationship
        let mut relationship = if let (Some(valid_from), Some(expires_at)) = (valid_from, expires_at) {
            Relationship::new_with_validity(
                user_str.clone(),
                relation.to_string(),
                object.to_string(),
                valid_from,
                Some(expires_at),
            )
        } else if let Some(expires_at) = expires_at {
            Relationship::new_with_expiration(
                user_str.clone(),
                relation.to_string(),
                object.to_string(),
                expires_at,
            )
        } else {
            Relationship::new(
                user_str.clone(),
                relation.to_string(),
                object.to_string(),
            )
        };
        
        // Set metadata
        if let Some(meta) = metadata {
            if encrypt_metadata && RelationshipEncryption::should_encrypt_metadata(&meta) {
                // Encrypt metadata with user's DEK
                let metadata_json = serde_json::to_string(&meta)
                    .map_err(|e| shared::AppError::Encryption(format!("Failed to serialize metadata: {}", e)))?;
                let encrypted = self.dek_manager
                    .encrypt_field(user_id, "user", &metadata_json)
                    .await?;
                relationship.metadata = serde_json::json!({
                    "_encrypted": true,
                    "data": encrypted
                });
            } else {
                relationship.set_metadata(meta, false);
            }
        }
        
        // Store relationship
        let created_relationship = self.relationship_repository.create(relationship).await?;
        
        Ok(created_relationship)
    }
}

