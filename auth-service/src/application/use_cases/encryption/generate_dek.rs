use crate::domain::entities::EncryptionKey;
use crate::domain::repositories::KeyRepository;
use crate::infrastructure::encryption::DekManager;
use crate::shared::AppResult;
use uuid::Uuid;

pub struct GenerateDekUseCase {
    dek_manager: DekManager,
    key_repository: Box<dyn KeyRepository>,
}

impl GenerateDekUseCase {
    pub fn new(dek_manager: DekManager, key_repository: Box<dyn KeyRepository>) -> Self {
        Self {
            dek_manager,
            key_repository,
        }
    }

    pub async fn execute(&self, entity_id: Uuid, entity_type: &str) -> AppResult<EncryptionKey> {
        // Generate DEK
        let _dek = self.dek_manager.generate_dek(entity_id, entity_type).await?;

        // Retrieve the encrypted key from vault to store in database
        // The DEK is already stored in vault by generate_dek
        // We need to create an EncryptionKey entity for tracking
        let key = EncryptionKey::new(
            entity_id,
            entity_type.to_string(),
            vec![], // Encrypted key is in vault
            "AES-256-GCM".to_string(),
        );

        self.key_repository.create(key).await
    }
}

