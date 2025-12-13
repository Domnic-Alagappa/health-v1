//! Policy structures and capability definitions for RustyVault
//!
//! Defines the core policy types including:
//! - Policy: Main policy structure with path rules
//! - PolicyPathRules: Rules for specific paths
//! - Permissions: Capability bitmap and parameter rules
//! - Capability: Operations that can be performed (read, write, delete, etc.)

use std::collections::HashMap;
use std::str::FromStr;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::errors::{VaultError, VaultResult};
use crate::logical::request::Operation;

/// Types of policies supported
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PolicyType {
    Acl,
    Rgp,
    Egp,
    Token,
}

impl Default for PolicyType {
    fn default() -> Self {
        PolicyType::Acl
    }
}

impl std::fmt::Display for PolicyType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PolicyType::Acl => write!(f, "acl"),
            PolicyType::Rgp => write!(f, "rgp"),
            PolicyType::Egp => write!(f, "egp"),
            PolicyType::Token => write!(f, "token"),
        }
    }
}

/// Capability represents individual operations that can be performed
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
#[repr(u32)]
pub enum Capability {
    Deny = 1 << 0,
    Create = 1 << 1,
    Read = 1 << 2,
    Update = 1 << 3,
    Delete = 1 << 4,
    List = 1 << 5,
    Sudo = 1 << 6,
    Patch = 1 << 7,
    Root = 1 << 8,
}

impl Capability {
    /// Convert capability to its bit representation
    pub fn to_bits(&self) -> u32 {
        *self as u32
    }

    /// Get all capabilities as an iterator
    pub fn all() -> impl Iterator<Item = Capability> {
        [
            Capability::Deny,
            Capability::Create,
            Capability::Read,
            Capability::Update,
            Capability::Delete,
            Capability::List,
            Capability::Sudo,
            Capability::Patch,
            Capability::Root,
        ]
        .into_iter()
    }
}

impl std::fmt::Display for Capability {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Capability::Deny => write!(f, "deny"),
            Capability::Create => write!(f, "create"),
            Capability::Read => write!(f, "read"),
            Capability::Update => write!(f, "update"),
            Capability::Delete => write!(f, "delete"),
            Capability::List => write!(f, "list"),
            Capability::Sudo => write!(f, "sudo"),
            Capability::Patch => write!(f, "patch"),
            Capability::Root => write!(f, "root"),
        }
    }
}

impl FromStr for Capability {
    type Err = VaultError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "deny" => Ok(Capability::Deny),
            "create" => Ok(Capability::Create),
            "read" => Ok(Capability::Read),
            "update" => Ok(Capability::Update),
            "delete" => Ok(Capability::Delete),
            "list" => Ok(Capability::List),
            "sudo" => Ok(Capability::Sudo),
            "patch" => Ok(Capability::Patch),
            "root" => Ok(Capability::Root),
            _ => Err(VaultError::Vault(format!("unknown capability: {}", s))),
        }
    }
}

/// Convert a capability bitmap to a list of capability strings
pub fn to_capability_strings(bitmap: u32) -> Vec<String> {
    let mut result = Vec::new();

    // If deny is set, only return deny
    if bitmap & Capability::Deny.to_bits() != 0 {
        result.push(Capability::Deny.to_string());
        return result;
    }

    for cap in Capability::all() {
        if cap != Capability::Deny && bitmap & cap.to_bits() != 0 {
            result.push(cap.to_string());
        }
    }

    result
}

/// Permissions for a policy path
#[derive(Debug, Clone, Default)]
pub struct Permissions {
    /// Bitmap of capabilities
    pub capabilities_bitmap: u32,
    /// Minimum wrapping TTL
    pub min_wrapping_ttl: Duration,
    /// Maximum wrapping TTL
    pub max_wrapping_ttl: Duration,
    /// Allowed parameters with their allowed values
    pub allowed_parameters: HashMap<String, Vec<Value>>,
    /// Denied parameters with their denied values
    pub denied_parameters: HashMap<String, Vec<Value>>,
    /// Required parameters that must be present
    pub required_parameters: Vec<String>,
}

impl Permissions {
    /// Check if an operation is allowed based on capabilities
    pub fn check_operation(&self, operation: &Operation) -> bool {
        // If deny is set, nothing is allowed
        if self.capabilities_bitmap & Capability::Deny.to_bits() != 0 {
            return false;
        }

        let required_cap = match operation {
            Operation::Read => Capability::Read,
            Operation::Write => Capability::Update,
            Operation::Delete => Capability::Delete,
            Operation::List => Capability::List,
        };

        // Check if the required capability is present
        if self.capabilities_bitmap & required_cap.to_bits() != 0 {
            return true;
        }

        // For write operations, also check create capability
        if matches!(operation, Operation::Write)
            && self.capabilities_bitmap & Capability::Create.to_bits() != 0
        {
            return true;
        }

        false
    }

    /// Check if root privileges are granted
    pub fn has_root_privs(&self) -> bool {
        self.capabilities_bitmap & Capability::Sudo.to_bits() != 0
    }

    /// Merge another set of permissions into this one
    pub fn merge(&mut self, other: &Permissions) {
        let deny = Capability::Deny.to_bits();

        // If we already have deny, don't add anything else
        if self.capabilities_bitmap & deny != 0 {
            return;
        }

        // If the other has deny, set only deny
        if other.capabilities_bitmap & deny != 0 {
            self.capabilities_bitmap = deny;
            self.allowed_parameters.clear();
            self.denied_parameters.clear();
            return;
        }

        // Merge capabilities
        self.capabilities_bitmap |= other.capabilities_bitmap;

        // Merge TTLs (use the more restrictive values)
        if other.max_wrapping_ttl > Duration::ZERO
            && (self.max_wrapping_ttl == Duration::ZERO
                || other.max_wrapping_ttl < self.max_wrapping_ttl)
        {
            self.max_wrapping_ttl = other.max_wrapping_ttl;
        }

        if other.min_wrapping_ttl > Duration::ZERO
            && (self.min_wrapping_ttl == Duration::ZERO
                || other.min_wrapping_ttl > self.min_wrapping_ttl)
        {
            self.min_wrapping_ttl = other.min_wrapping_ttl;
        }

        // Merge allowed parameters
        for (key, values) in &other.allowed_parameters {
            self.allowed_parameters
                .entry(key.clone())
                .or_default()
                .extend(values.iter().cloned());
        }

        // Merge denied parameters
        for (key, values) in &other.denied_parameters {
            self.denied_parameters
                .entry(key.clone())
                .or_default()
                .extend(values.iter().cloned());
        }

        // Merge required parameters
        for param in &other.required_parameters {
            if !self.required_parameters.contains(param) {
                self.required_parameters.push(param.clone());
            }
        }
    }
}

/// Rules for a specific path in a policy
#[derive(Debug, Clone, Default)]
pub struct PolicyPathRules {
    /// The path pattern
    pub path: String,
    /// Permissions for this path
    pub permissions: Permissions,
    /// List of capabilities (for easier iteration)
    pub capabilities: Vec<Capability>,
    /// Whether this is a prefix match (path ends with *)
    pub is_prefix: bool,
    /// Whether this path has segment wildcards (+)
    pub has_segment_wildcards: bool,
}

/// A policy containing rules for multiple paths
#[derive(Debug, Clone, Default)]
pub struct Policy {
    /// Policy name
    pub name: String,
    /// Raw policy text
    pub raw: String,
    /// Type of policy
    pub policy_type: PolicyType,
    /// Whether the policy uses templates
    pub templated: bool,
    /// Path rules
    pub paths: Vec<PolicyPathRules>,
}

/// JSON format for policy path configuration
#[derive(Debug, Clone, Deserialize)]
pub struct PolicyPathConfig {
    #[serde(default)]
    pub capabilities: Vec<String>,
    #[serde(default)]
    pub allowed_parameters: HashMap<String, Vec<Value>>,
    #[serde(default)]
    pub denied_parameters: HashMap<String, Vec<Value>>,
    #[serde(default)]
    pub required_parameters: Vec<String>,
    #[serde(default)]
    pub min_wrapping_ttl: Option<u64>,
    #[serde(default)]
    pub max_wrapping_ttl: Option<u64>,
}

/// JSON format for policy configuration
#[derive(Debug, Clone, Deserialize)]
pub struct PolicyConfig {
    #[serde(default)]
    pub name: String,
    pub path: HashMap<String, PolicyPathConfig>,
}

impl Policy {
    /// Create a new empty policy
    pub fn new(name: &str) -> Self {
        Policy {
            name: name.to_string(),
            ..Default::default()
        }
    }

    /// Parse a policy from JSON string
    pub fn from_json(json_str: &str) -> VaultResult<Self> {
        let config: PolicyConfig = serde_json::from_str(json_str)
            .map_err(|e| VaultError::Vault(format!("failed to parse policy JSON: {}", e)))?;

        let mut policy = Policy {
            name: config.name.clone(),
            raw: json_str.to_string(),
            policy_type: PolicyType::Acl,
            ..Default::default()
        };

        for (path, path_config) in config.path {
            let mut rules = PolicyPathRules::default();

            // Process path
            let mut processed_path = path.trim_start_matches('/').to_string();

            // Check for segment wildcards
            if processed_path.contains('+') {
                rules.has_segment_wildcards = true;
            }

            // Check for prefix match
            if processed_path.ends_with('*') && !rules.has_segment_wildcards {
                processed_path = processed_path.trim_end_matches('*').to_string();
                rules.is_prefix = true;
            }

            rules.path = processed_path;

            // Parse capabilities
            let mut capabilities_bitmap: u32 = 0;
            for cap_str in &path_config.capabilities {
                let cap = Capability::from_str(cap_str)?;
                capabilities_bitmap |= cap.to_bits();
                rules.capabilities.push(cap);
            }

            // If deny is set, clear all other capabilities
            if capabilities_bitmap & Capability::Deny.to_bits() != 0 {
                capabilities_bitmap = Capability::Deny.to_bits();
                rules.capabilities = vec![Capability::Deny];
            }

            rules.permissions = Permissions {
                capabilities_bitmap,
                min_wrapping_ttl: Duration::from_secs(path_config.min_wrapping_ttl.unwrap_or(0)),
                max_wrapping_ttl: Duration::from_secs(path_config.max_wrapping_ttl.unwrap_or(0)),
                allowed_parameters: path_config
                    .allowed_parameters
                    .into_iter()
                    .map(|(k, v)| (k.to_lowercase(), v))
                    .collect(),
                denied_parameters: path_config
                    .denied_parameters
                    .into_iter()
                    .map(|(k, v)| (k.to_lowercase(), v))
                    .collect(),
                required_parameters: path_config.required_parameters,
            };

            policy.paths.push(rules);
        }

        Ok(policy)
    }
}

/// Entry for storing a policy in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyEntry {
    pub version: u32,
    pub raw: String,
    pub templated: bool,
    #[serde(rename = "type")]
    pub policy_type: PolicyType,
}

impl PolicyEntry {
    pub fn from_policy(policy: &Policy) -> Self {
        PolicyEntry {
            version: 2,
            raw: policy.raw.clone(),
            templated: policy.templated,
            policy_type: policy.policy_type,
        }
    }
}

/// Default policy that all tokens get
pub const DEFAULT_POLICY: &str = r#"{
    "name": "default",
    "path": {
        "auth/token/lookup-self": {
            "capabilities": ["read"]
        },
        "auth/token/renew-self": {
            "capabilities": ["update"]
        },
        "auth/token/revoke-self": {
            "capabilities": ["update"]
        },
        "sys/capabilities-self": {
            "capabilities": ["update"]
        }
    }
}"#;

/// Immutable policies that cannot be modified or deleted
pub const IMMUTABLE_POLICIES: &[&str] = &["root", "default"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_capability_to_bits() {
        assert_eq!(Capability::Deny.to_bits(), 1);
        assert_eq!(Capability::Create.to_bits(), 2);
        assert_eq!(Capability::Read.to_bits(), 4);
        assert_eq!(Capability::Update.to_bits(), 8);
        assert_eq!(Capability::Delete.to_bits(), 16);
        assert_eq!(Capability::List.to_bits(), 32);
        assert_eq!(Capability::Sudo.to_bits(), 64);
    }

    #[test]
    fn test_to_capability_strings() {
        let bitmap = Capability::Read.to_bits() | Capability::List.to_bits();
        let caps = to_capability_strings(bitmap);
        assert!(caps.contains(&"read".to_string()));
        assert!(caps.contains(&"list".to_string()));
        assert_eq!(caps.len(), 2);

        // Deny overrides all
        let deny_bitmap = Capability::Deny.to_bits() | Capability::Read.to_bits();
        let caps = to_capability_strings(deny_bitmap);
        assert_eq!(caps, vec!["deny".to_string()]);
    }

    #[test]
    fn test_policy_from_json() {
        let json = r#"{
            "name": "test-policy",
            "path": {
                "secret/*": {
                    "capabilities": ["read", "list"]
                },
                "admin/config": {
                    "capabilities": ["read", "update", "sudo"]
                }
            }
        }"#;

        let policy = Policy::from_json(json).unwrap();
        assert_eq!(policy.name, "test-policy");
        assert_eq!(policy.paths.len(), 2);

        // Find the secret/* path
        let secret_path = policy.paths.iter().find(|p| p.path == "secret/").unwrap();
        assert!(secret_path.is_prefix);
        assert!(secret_path.permissions.check_operation(&Operation::Read));
        assert!(secret_path.permissions.check_operation(&Operation::List));
        assert!(!secret_path.permissions.check_operation(&Operation::Write));
    }

    #[test]
    fn test_permissions_merge() {
        let mut p1 = Permissions {
            capabilities_bitmap: Capability::Read.to_bits(),
            ..Default::default()
        };

        let p2 = Permissions {
            capabilities_bitmap: Capability::List.to_bits() | Capability::Update.to_bits(),
            ..Default::default()
        };

        p1.merge(&p2);
        assert!(p1.capabilities_bitmap & Capability::Read.to_bits() != 0);
        assert!(p1.capabilities_bitmap & Capability::List.to_bits() != 0);
        assert!(p1.capabilities_bitmap & Capability::Update.to_bits() != 0);
    }

    #[test]
    fn test_permissions_merge_deny() {
        let mut p1 = Permissions {
            capabilities_bitmap: Capability::Read.to_bits() | Capability::List.to_bits(),
            ..Default::default()
        };

        let p2 = Permissions {
            capabilities_bitmap: Capability::Deny.to_bits(),
            ..Default::default()
        };

        p1.merge(&p2);
        assert_eq!(p1.capabilities_bitmap, Capability::Deny.to_bits());
    }
}

