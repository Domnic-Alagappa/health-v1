pub mod config;
pub mod context;
pub mod formatter;

pub use config::{LogFormat, LoggerConfig};
pub use context::{LogContext, span_with_context, span_from_request_context};
pub use formatter::{init_logger, init_default};

use crate::config::settings::LoggingConfig;

/// Initialize the logger from application settings
pub fn init_from_settings(settings: &LoggingConfig) {
    let config = LoggerConfig::from_settings(settings);
    formatter::init_logger(&config);
}

