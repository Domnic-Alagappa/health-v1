use serde::{Deserialize, Serialize};
use std::env;

/// Parse a boolean environment variable.
/// Supports: "true", "1", "yes", "on" (case insensitive) → true
///           "false", "0", "no", "off", empty → false
fn parse_bool_env(key: &str, default: bool) -> bool {
    match env::var(key) {
        Ok(val) => {
            let lower = val.to_lowercase().trim().to_string();
            matches!(lower.as_str(), "true" | "1" | "yes" | "on")
        }
        Err(_) => default,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub kms: KmsProviderConfig,
    pub storage: StorageProviderConfig,
    pub database: DatabaseProviderConfig,
    pub messaging: MessagingProviderConfig,
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
    pub encrypted_local: Option<EncryptedLocalStorageConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageProvider {
    Local,
    EncryptedLocal,
    S3,
    Gcs,
    AzureBlob,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S3Config {
    pub region: String,
    pub bucket: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    #[serde(default)]
    pub endpoint: Option<String>, // For LocalStack or custom S3-compatible endpoints
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
pub struct EncryptedLocalStorageConfig {
    pub path: String,
    /// Enable encryption (default: true)
    #[serde(default = "default_encryption_enabled")]
    pub encryption_enabled: bool,
    /// Enable per-realm DEK isolation (default: true)
    #[serde(default = "default_realm_isolation")]
    pub realm_dek_isolation: bool,
    /// Enable per-service DEK isolation (default: true)
    #[serde(default = "default_service_isolation")]
    pub service_dek_isolation: bool,
}

fn default_encryption_enabled() -> bool { true }
fn default_realm_isolation() -> bool { true }
fn default_service_isolation() -> bool { true }

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagingProviderConfig {
    pub nats: Option<NatsConfig>,
    pub kafka: Option<KafkaConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NatsConfig {
    pub url: String,
    pub enable_jetstream: bool,
    pub http_port: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KafkaConfig {
    pub bootstrap_servers: String,
    pub client_id: Option<String>,
}

impl ProviderConfig {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        // Check enable flags first (boolean flags take precedence)
        let enable_hashicorp = parse_bool_env("ENABLE_HASHICORP_OPENBAO", true);
        let enable_aws_kms = parse_bool_env("ENABLE_AWS_KMS", false);
        let enable_gcp_kms = parse_bool_env("ENABLE_GCP_KMS", false);
        let enable_azure_vault = parse_bool_env("ENABLE_AZURE_VAULT", false);

        // Determine which provider to use based on enable flags
        // First enabled provider in order becomes active (mutually exclusive)
        let (kms_provider, hashicorp, aws, gcp, azure) = if enable_hashicorp {
            let config = Some(HashiCorpConfig {
                addr: env::var("VAULT_ADDR").unwrap_or_else(|_| "http://localhost:8200".to_string()),
                token: env::var("VAULT_TOKEN").unwrap_or_else(|_| "".to_string()),
                mount_path: env::var("VAULT_MOUNT_PATH").unwrap_or_else(|_| "secret".to_string()),
            });
            (KmsProvider::HashiCorp, config, None, None, None)
        } else if enable_aws_kms {
            let config = Some(AwsKmsConfig {
                region: env::var("AWS_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
                access_key_id: env::var("AWS_ACCESS_KEY_ID").unwrap_or_else(|_| "".to_string()),
                secret_access_key: env::var("AWS_SECRET_ACCESS_KEY").unwrap_or_else(|_| "".to_string()),
                key_id: env::var("AWS_KMS_KEY_ID").unwrap_or_else(|_| "".to_string()),
            });
            (KmsProvider::AwsKms, None, config, None, None)
        } else if enable_gcp_kms {
            let config = Some(GcpKmsConfig {
                project_id: env::var("GCP_PROJECT_ID").unwrap_or_else(|_| "".to_string()),
                credentials_path: env::var("GCP_CREDENTIALS_PATH").unwrap_or_else(|_| "".to_string()),
                key_ring: env::var("GCP_KMS_KEY_RING").unwrap_or_else(|_| "".to_string()),
                key_name: env::var("GCP_KMS_KEY_NAME").unwrap_or_else(|_| "".to_string()),
            });
            (KmsProvider::GcpKms, None, None, config, None)
        } else if enable_azure_vault {
            let config = Some(AzureKeyVaultConfig {
                tenant_id: env::var("AZURE_TENANT_ID").unwrap_or_else(|_| "".to_string()),
                client_id: env::var("AZURE_CLIENT_ID").unwrap_or_else(|_| "".to_string()),
                client_secret: env::var("AZURE_CLIENT_SECRET").unwrap_or_else(|_| "".to_string()),
                vault_url: env::var("AZURE_KEY_VAULT_URL").unwrap_or_else(|_| "".to_string()),
            });
            (KmsProvider::AzureKeyVault, None, None, None, config)
        } else {
            // Fallback to KMS_PROVIDER env var for backward compatibility
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

            (kms_provider, hashicorp, aws, gcp, azure)
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
            "encrypted_local" => StorageProvider::EncryptedLocal,
            _ => StorageProvider::Local,
        };

        let s3 = if matches!(storage_provider, StorageProvider::S3) {
            Some(S3Config {
                region: env::var("AWS_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
                bucket: env::var("AWS_S3_BUCKET").unwrap_or_else(|_| "".to_string()),
                access_key_id: env::var("AWS_ACCESS_KEY_ID").unwrap_or_else(|_| "".to_string()),
                secret_access_key: env::var("AWS_SECRET_ACCESS_KEY").unwrap_or_else(|_| "".to_string()),
                endpoint: env::var("AWS_S3_ENDPOINT").ok(), // For LocalStack: http://localhost:4566
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

        let encrypted_local = if matches!(storage_provider, StorageProvider::EncryptedLocal) {
            Some(EncryptedLocalStorageConfig {
                path: env::var("LOCAL_STORAGE_PATH").unwrap_or_else(|_| "./storage".to_string()),
                encryption_enabled: parse_bool_env("STORAGE_ENCRYPTION_ENABLED", true),
                realm_dek_isolation: parse_bool_env("ENABLE_REALM_DEK_ISOLATION", true),
                service_dek_isolation: parse_bool_env("ENABLE_SERVICE_DEK_ISOLATION", true),
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
            encrypted_local,
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

        // NATS Configuration
        let nats = env::var("NATS_URL").ok().map(|url| {
            NatsConfig {
                url,
                enable_jetstream: env::var("NATS_ENABLE_JETSTREAM")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                http_port: env::var("NATS_HTTP_PORT")
                    .ok()
                    .and_then(|p| p.parse().ok()),
            }
        });

        // Kafka Configuration
        let kafka = env::var("KAFKA_BOOTSTRAP_SERVERS").ok().map(|bootstrap_servers| {
            KafkaConfig {
                bootstrap_servers,
                client_id: env::var("KAFKA_CLIENT_ID").ok(),
            }
        });

        let messaging = MessagingProviderConfig {
            nats,
            kafka,
        };

        Ok(ProviderConfig {
            kms,
            storage,
            database,
            messaging,
        })
    }
}

