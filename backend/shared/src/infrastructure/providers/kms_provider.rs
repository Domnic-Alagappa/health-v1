use crate::config::providers::{KmsProviderConfig, KmsProvider};
use crate::infrastructure::encryption::vault::Vault;
use crate::infrastructure::encryption::vault_impl::*;
use crate::shared::AppResult;

pub fn create_kms_provider(config: &KmsProviderConfig) -> AppResult<Box<dyn Vault>> {
    match &config.provider {
        KmsProvider::HashiCorp => {
            if let Some(ref hc_config) = config.hashicorp {
                Ok(Box::new(HashiCorpVault::new(
                    &hc_config.addr,
                    &hc_config.token,
                    &hc_config.mount_path,
                )))
            } else {
                Err(crate::shared::AppError::Configuration(
                    "HashiCorp Vault config not provided".to_string(),
                ))
            }
        }
        KmsProvider::AwsKms => {
            if let Some(ref aws_config) = config.aws {
                Ok(Box::new(AwsKmsVault::new(&aws_config.region, &aws_config.key_id)))
            } else {
                Err(crate::shared::AppError::Configuration(
                    "AWS KMS config not provided".to_string(),
                ))
            }
        }
        KmsProvider::GcpKms => {
            if let Some(ref gcp_config) = config.gcp {
                Ok(Box::new(GcpKmsVault::new(
                    &gcp_config.project_id,
                    &gcp_config.key_ring,
                    &gcp_config.key_name,
                )))
            } else {
                Err(crate::shared::AppError::Configuration(
                    "GCP KMS config not provided".to_string(),
                ))
            }
        }
        KmsProvider::AzureKeyVault => {
            if let Some(ref azure_config) = config.azure {
                Ok(Box::new(AzureKeyVault::new(
                    &azure_config.vault_url,
                    &azure_config.tenant_id,
                    &azure_config.client_id,
                    &azure_config.client_secret,
                )))
            } else {
                Err(crate::shared::AppError::Configuration(
                    "Azure Key Vault config not provided".to_string(),
                ))
            }
        }
    }
}

