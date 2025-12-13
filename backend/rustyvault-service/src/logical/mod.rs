//! Logical layer for vault operations
//!
//! This module contains Request, Response, and Backend traits
//! adapted from RustyVault for use with health-v1 infrastructure

pub mod request;
pub mod response;
pub mod backend;

pub use request::{Request, Operation};
pub use response::{Response, ResponseAuth};
pub use backend::Backend;

