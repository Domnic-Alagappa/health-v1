use crate::domain::repositories::KeyRepository;
use crate::infrastructure::encryption::DekManager;
use crate::shared::AppResult;
use uuid::Uuid;

pub struct RotateKeysUseCase {
    dek_manager: DekManager,
    key_repository: Box<dyn KeyRepository>,
}

impl RotateKeysUseCase {
    pub fn new(dek_manager: DekManager, key_repository: Box<dyn KeyRepository>) -> Self {
        Self {
            dek_manager,
            key_repository,
        }
    }

    pub async fn execute(&self, entity_id: Uuid, entity_type: &str) -> AppResult<()> {
        // Deactivate old keys
        self.key_repository.deactivate_all_for_entity(entity_id, entity_type).await?;

        // Generate new DEK
        let _new_dek = self.dek_manager.generate_dek(entity_id, entity_type).await?;

        // TODO: Re-encrypt all data with new DEK
        // This is a complex operation that requires:
        // 1. Finding all encrypted data for the entity
        // 2. Decrypting with old DEK
        // 3. Encrypting with new DEK
        // 4. Updating database records

        Ok(())
    }
}

