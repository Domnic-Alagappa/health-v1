use super::config::{LogFormat, LoggerConfig};
use std::env;

/// Initialize the logger with the given configuration
pub fn init_logger(config: &LoggerConfig) {
    let filter_string = config.get_filter_string();
    
    // Set RUST_LOG if not already set
    if env::var("RUST_LOG").is_err() && !filter_string.is_empty() {
        env::set_var("RUST_LOG", &filter_string);
    }

    match config.format {
        LogFormat::Json => {
            // JSON format for production
            tracing_subscriber::fmt()
                .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
                .json()
                .with_target(true)
                .with_file(config.include_location)
                .with_line_number(config.include_location)
                .init();
        }
        LogFormat::Pretty => {
            // Pretty format for development
            tracing_subscriber::fmt()
                .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
                .pretty()
                .with_target(true)
                .with_file(config.include_location)
                .with_line_number(config.include_location)
                .init();
        }
    }
}

/// Initialize logger with default configuration
pub fn init_default() {
    let config = LoggerConfig::default();
    init_logger(&config);
}
