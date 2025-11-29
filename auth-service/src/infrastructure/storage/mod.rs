pub mod storage_trait;
pub mod s3;
pub mod gcs;
pub mod azure_blob;
pub mod local_fs;

pub use storage_trait::Storage;
pub use s3::S3Storage;
pub use gcs::GcsStorage;
pub use azure_blob::AzureBlobStorage;
pub use local_fs::LocalFsStorage;

