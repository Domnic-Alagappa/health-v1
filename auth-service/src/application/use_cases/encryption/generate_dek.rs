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
        // Generate random 256-bit DEK
        use aes_gcm::KeyInit;
        use aes_gcm::Aes256Gcm;
        use aes_gcm::aead::rand_core::OsRng;
        let dek = Aes256Gcm::generate_key(&mut OsRng);
        let dek_bytes = dek.as_slice().to_vec();

        // Encrypt DEK with master key and get encrypted + nonce separately for database storage
        let (encrypted_key, nonce) = self.dek_manager.encrypt_dek_for_storage(entity_id, entity_type, &dek_bytes).await?;

        // Create EncryptionKey entity with encrypted_key and nonce stored separately
        let key = EncryptionKey::new(
            entity_id,
            entity_type.to_string(),
            encrypted_key,
            nonce,
            "AES-256-GCM".to_string(),
        );

        self.key_repository.create(key).await
    }
}

