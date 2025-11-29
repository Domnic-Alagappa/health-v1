use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub kms: KmsProviderConfig,
    pub storage: StorageProviderConfig,
    pub database: DatabaseProviderConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KmsProviderConfig {
    pub provider: KmsProvider,
    pub hashicorp: Option<HashiCorpConfig>,
    pub aws: Option<AwsKmsConfig>,
    pub gcp: Option<GcpKmsConfig>,
    pub azure: Option<AzureKeyVaultConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KmsProvider {
    HashiCorp,
    AwsKms,
    GcpKms,
    AzureKeyVault,
}

// Make enum variants public for pattern matching
pub use KmsProvider::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashiCorpConfig {
    pub addr: String,
    pub token: String,
    pub mount_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsKmsConfig {
    pub region: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub key_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcpKmsConfig {
    pub project_id: String,
    pub credentials_path: String,
    pub key_ring: String,
    pub key_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AzureKeyVaultConfig {
    pub tenant_id: String,
    pub client_id: String,
    pub client_secret: String,
    pub vault_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageProviderConfig {
    pub provider: StorageProvider,
    pub s3: Option<S3Config>,
    pub gcs: Option<GcsConfig>,
    pub azure_blob: Option<AzureBlobConfig>,
    pub local: Option<LocalStorageConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageProvider {
    Local,
    S3,
    Gcs,
    AzureBlob,
}

// Make enum variants public for pattern matching
pub use StorageProvider::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S3Config {
    pub region: String,
    pub bucket: String,
    pub access_key_id: String,
    pub secret_access_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GcsConfig {
    pub project_id: String,
    pub bucket: String,
    pub credentials_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AzureBlobConfig {
    pub storage_account: String,
    pub container: String,
    pub tenant_id: String,
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalStorageConfig {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseProviderConfig {
    pub local: SqliteConfig,
    pub live: PostgresConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SqliteConfig {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostgresConfig {
    pub url: String,
}

impl ProviderConfig {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        let kms_provider_str = env::var("KMS_PROVIDER").unwrap_or_else(|_| "hashicorp".to_string());
        let kms_provider = match kms_provider_str.as_str() {
            "hashicorp" => KmsProvider::HashiCorp,
            "aws_kms" => KmsProvider::AwsKms,
            "gcp_kms" => KmsProvider::GcpKms,
            "azure_keyvault" => KmsProvider::AzureKeyVault,
            _ => KmsProvider::HashiCorp,
        };

        let hashicorp = if matches!(kms_provider, KmsProvider::HashiCorp) {
            Some(HashiCorpConfig {
                addr: env::var("VAULT_ADDR").unwrap_or_else(|_| "http://localhost:8200".to_string()),
                token: env::var("VAULT_TOKEN").unwrap_or_else(|_| "".to_string()),
                mount_path: env::var("VAULT_MOUNT_PATH").unwrap_or_else(|_| "secret".to_string()),
            })
        } else {
            None
        };

        let aws = if matches!(kms_provider, KmsProvider::AwsKms) {
            Some(AwsKmsConfig {
                region: env::var("AWS_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
                access_key_id: env::var("AWS_ACCESS_KEY_ID").unwrap_or_else(|_| "".to_string()),
                secret_access_key: env::var("AWS_SECRET_ACCESS_KEY").unwrap_or_else(|_| "".to_string()),
                key_id: env::var("AWS_KMS_KEY_ID").unwrap_or_else(|_| "".to_string()),
            })
        } else {
            None
        };

        let gcp = if matches!(kms_provider, KmsProvider::GcpKms) {
            Some(GcpKmsConfig {
                project_id: env::var("GCP_PROJECT_ID").unwrap_or_else(|_| "".to_string()),
                credentials_path: env::var("GCP_CREDENTIALS_PATH").unwrap_or_else(|_| "".to_string()),
                key_ring: env::var("GCP_KMS_KEY_RING").unwrap_or_else(|_| "".to_string()),
                key_name: env::var("GCP_KMS_KEY_NAME").unwrap_or_else(|_| "".to_string()),
            })
        } else {
            None
        };

        let azure = if matches!(kms_provider, KmsProvider::AzureKeyVault) {
            Some(AzureKeyVaultConfig {
                tenant_id: env::var("AZURE_TENANT_ID").unwrap_or_else(|_| "".to_string()),
                client_id: env::var("AZURE_CLIENT_ID").unwrap_or_else(|_| "".to_string()),
                client_secret: env::var("AZURE_CLIENT_SECRET").unwrap_or_else(|_| "".to_string()),
                vault_url: env::var("AZURE_KEY_VAULT_URL").unwrap_or_else(|_| "".to_string()),
            })
        } else {
            None
        };

        let kms = KmsProviderConfig {
            provider: kms_provider,
            hashicorp,
            aws,
            gcp,
            azure,
        };

        let storage_provider_str = env::var("STORAGE_PROVIDER").unwrap_or_else(|_| "local".to_string());
        let storage_provider = match storage_provider_str.as_str() {
            "s3" => StorageProvider::S3,
            "gcs" => StorageProvider::Gcs,
            "azure_blob" => StorageProvider::AzureBlob,
            _ => StorageProvider::Local,
        };

        let s3 = if matches!(storage_provider, StorageProvider::S3) {
            Some(S3Config {
                region: env::var("AWS_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
                bucket: env::var("AWS_S3_BUCKET").unwrap_or_else(|_| "".to_string()),
                access_key_id: env::var("AWS_ACCESS_KEY_ID").unwrap_or_else(|_| "".to_string()),
                secret_access_key: env::var("AWS_SECRET_ACCESS_KEY").unwrap_or_else(|_| "".to_string()),
            })
        } else {
            None
        };

        let gcs = if matches!(storage_provider, StorageProvider::Gcs) {
            Some(GcsConfig {
                project_id: env::var("GCP_PROJECT_ID").unwrap_or_else(|_| "".to_string()),
                bucket: env::var("GCP_STORAGE_BUCKET").unwrap_or_else(|_| "".to_string()),
                credentials_path: env::var("GCP_CREDENTIALS_PATH").unwrap_or_else(|_| "".to_string()),
            })
        } else {
            None
        };

        let azure_blob = if matches!(storage_provider, StorageProvider::AzureBlob) {
            Some(AzureBlobConfig {
                storage_account: env::var("AZURE_STORAGE_ACCOUNT").unwrap_or_else(|_| "".to_string()),
                container: env::var("AZURE_STORAGE_CONTAINER").unwrap_or_else(|_| "data".to_string()),
                tenant_id: env::var("AZURE_TENANT_ID").unwrap_or_else(|_| "".to_string()),
                client_id: env::var("AZURE_CLIENT_ID").unwrap_or_else(|_| "".to_string()),
                client_secret: env::var("AZURE_CLIENT_SECRET").unwrap_or_else(|_| "".to_string()),
            })
        } else {
            None
        };

        let local = if matches!(storage_provider, StorageProvider::Local) {
            Some(LocalStorageConfig {
                path: env::var("LOCAL_STORAGE_PATH").unwrap_or_else(|_| "./storage".to_string()),
            })
        } else {
            None
        };

        let storage = StorageProviderConfig {
            provider: storage_provider,
            s3,
            gcs,
            azure_blob,
            local,
        };

        let database = DatabaseProviderConfig {
            local: SqliteConfig {
                path: env::var("LOCAL_DB_PATH").unwrap_or_else(|_| "./data/local.db".to_string()),
            },
            live: PostgresConfig {
                url: env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgresql://user:password@localhost:5432/auth_db".to_string()),
            },
        };

        Ok(ProviderConfig {
            kms,
            storage,
            database,
        })
    }
}

