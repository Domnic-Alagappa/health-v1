use crate::domain::entities::Relationship;
use crate::infrastructure::encryption::DekManager;
use crate::shared::AppResult;
use uuid::Uuid;
use serde_json::Value;
use std::sync::Arc;

/// Relationship metadata encryption helper
/// Encrypts sensitive metadata in relationships using user's DEK
pub struct RelationshipEncryption {
    dek_manager: Arc<DekManager>,
}

impl RelationshipEncryption {
    pub fn new(dek_manager: Arc<DekManager>) -> Self {
        Self { dek_manager }
    }
    
    /// Encrypt relationship metadata with user's DEK
    /// Only encrypts the metadata JSONB field, not the relationship structure
    pub async fn encrypt_metadata(
        &self,
        relationship: &mut Relationship,
        user_id: Uuid,
    ) -> AppResult<()> {
        // Check if metadata needs encryption
        if relationship.metadata.is_null() || relationship.metadata.as_object().unwrap().is_empty() {
            return Ok(());
        }
        
        // Serialize metadata to JSON string
        let metadata_json = serde_json::to_string(&relationship.metadata)
            .map_err(|e| crate::shared::AppError::Encryption(
                format!("Failed to serialize metadata: {}", e)
            ))?;
        
        // Encrypt using user's DEK
        let encrypted = self.dek_manager
            .encrypt_field(user_id, "user", &metadata_json)
            .await?;
        
        // Store encrypted metadata
        relationship.metadata = serde_json::json!({
            "_encrypted": true,
            "data": encrypted
        });
        
        Ok(())
    }
    
    /// Decrypt relationship metadata using user's DEK
    pub async fn decrypt_metadata(
        &self,
        relationship: &mut Relationship,
        user_id: Uuid,
    ) -> AppResult<()> {
        // Check if metadata is encrypted
        if let Some(encrypted_data) = relationship.metadata.get("data").and_then(|v| v.as_str()) {
            if relationship.metadata.get("_encrypted").and_then(|v| v.as_bool()) == Some(true) {
                // Decrypt using user's DEK
                let decrypted = self.dek_manager
                    .decrypt_field(user_id, "user", encrypted_data)
                    .await?;
                
                // Parse back to JSON
                relationship.metadata = serde_json::from_str(&decrypted)
                    .map_err(|e| crate::shared::AppError::Encryption(
                        format!("Failed to parse decrypted metadata: {}", e)
                    ))?;
            }
        }
        
        Ok(())
    }
    
    /// Check if metadata contains sensitive data that should be encrypted
    pub fn should_encrypt_metadata(metadata: &Value) -> bool {
        // Check for sensitive keys
        if let Some(obj) = metadata.as_object() {
            let sensitive_keys = ["reason", "granted_by", "notes", "approval_id", "compliance_notes"];
            return obj.keys().any(|k| sensitive_keys.contains(&k.as_str()));
        }
        false
    }
}

