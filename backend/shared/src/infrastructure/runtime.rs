//! Shared Tokio runtime configuration
//! Provides a consistent runtime setup across all services

/// Create a configured Tokio runtime for low-memory systems
/// 
/// Configuration:
/// - Worker threads: Controlled by `TOKIO_WORKER_THREADS` env var (default: 2)
/// - Max blocking threads: 2
/// - Thread stack size: 256KB
/// - All features enabled
/// 
/// # Returns
/// A configured `tokio::runtime::Runtime` ready to use
/// 
/// # Errors
/// Returns an error string if runtime creation fails
pub fn create_runtime() -> Result<tokio::runtime::Runtime, String> {
    let tokio_worker_threads: usize = std::env::var("TOKIO_WORKER_THREADS")
        .unwrap_or_else(|_| "2".to_string())
        .parse()
        .unwrap_or(2);
    
    tokio::runtime::Builder::new_multi_thread()
        .worker_threads(tokio_worker_threads)
        .max_blocking_threads(2)
        .thread_stack_size(256 * 1024) // 256KB stack size
        .enable_all()
        .build()
        .map_err(|e| format!("Failed to create Tokio runtime: {}", e))
}
