//! Access Control List (ACL) implementation
//!
//! The ACL evaluates policies to determine if operations are allowed.
//! It supports:
//! - Exact path matching
//! - Prefix matching (paths ending with *)
//! - Segment wildcard matching (paths containing +)

use std::sync::Arc;

use radix_trie::Trie;

use super::policy::{Capability, Permissions, Policy, PolicyPathRules, PolicyType};
use crate::errors::{VaultError, VaultResult};
use crate::logical::request::{Operation, Request};

/// Results from an ACL check
#[derive(Debug, Clone, Default)]
pub struct ACLResults {
    /// Whether the operation is allowed
    pub allowed: bool,
    /// Whether root privileges are granted
    pub root_privs: bool,
    /// Whether this is the root policy
    pub is_root: bool,
    /// Bitmap of capabilities for the path
    pub capabilities_bitmap: u32,
    /// Names of policies that granted access
    pub granting_policies: Vec<String>,
}

/// Access Control List for evaluating policy permissions
#[derive(Debug, Clone, Default)]
pub struct ACL {
    /// Rules for exact path matches
    exact_rules: Trie<String, Permissions>,
    /// Rules for prefix matches (paths ending with *)
    prefix_rules: Trie<String, Permissions>,
    /// Rules for paths with segment wildcards (+)
    segment_wildcard_paths: Vec<(String, Permissions, bool)>, // (path, perms, is_prefix)
    /// Whether this is the root policy
    root: bool,
}

impl ACL {
    /// Create a new ACL from a list of policies
    pub fn new(policies: &[Arc<Policy>]) -> VaultResult<Self> {
        let mut acl = ACL::default();

        for policy in policies {
            // Check for invalid policy types
            if policy.policy_type != PolicyType::Acl && policy.policy_type != PolicyType::Token {
                return Err(VaultError::Vault(
                    "unable to parse policy (wrong type)".to_string(),
                ));
            }

            // Handle root policy
            if policy.name == "root" {
                if policies.len() != 1 {
                    return Err(VaultError::Vault(
                        "other policies present along with root".to_string(),
                    ));
                }
                acl.root = true;
                return Ok(acl);
            }

            // Process each path rule
            for pr in &policy.paths {
                if let Some(mut existing_perms) = acl.get_permissions(pr)? {
                    // Merge with existing permissions
                    if existing_perms.capabilities_bitmap & Capability::Deny.to_bits() != 0 {
                        // Already denied, skip
                        continue;
                    }
                    existing_perms.merge(&pr.permissions);
                    acl.insert_permissions(pr, existing_perms)?;
                } else {
                    acl.insert_permissions(pr, pr.permissions.clone())?;
                }
            }
        }

        Ok(acl)
    }

    /// Get permissions for a path rule
    fn get_permissions(&self, pr: &PolicyPathRules) -> VaultResult<Option<Permissions>> {
        if pr.has_segment_wildcards {
            // Look up in segment wildcard paths
            for (path, perms, is_prefix) in &self.segment_wildcard_paths {
                if path == &pr.path && *is_prefix == pr.is_prefix {
                    return Ok(Some(perms.clone()));
                }
            }
        } else if pr.is_prefix {
            if let Some(perms) = self.prefix_rules.get(&pr.path) {
                return Ok(Some(perms.clone()));
            }
        } else if let Some(perms) = self.exact_rules.get(&pr.path) {
            return Ok(Some(perms.clone()));
        }

        Ok(None)
    }

    /// Insert permissions for a path rule
    fn insert_permissions(&mut self, pr: &PolicyPathRules, perms: Permissions) -> VaultResult<()> {
        if pr.has_segment_wildcards {
            // Update or insert segment wildcard path
            let mut found = false;
            for (path, existing_perms, is_prefix) in &mut self.segment_wildcard_paths {
                if path == &pr.path && *is_prefix == pr.is_prefix {
                    *existing_perms = perms.clone();
                    found = true;
                    break;
                }
            }
            if !found {
                self.segment_wildcard_paths
                    .push((pr.path.clone(), perms, pr.is_prefix));
            }
        } else if pr.is_prefix {
            self.prefix_rules.insert(pr.path.clone(), perms);
        } else {
            self.exact_rules.insert(pr.path.clone(), perms);
        }

        Ok(())
    }

    /// Check if an operation is allowed
    pub fn allow_operation(&self, req: &Request, check_only: bool) -> VaultResult<ACLResults> {
        // Root policy allows everything
        if self.root {
            return Ok(ACLResults {
                allowed: true,
                root_privs: true,
                is_root: true,
                granting_policies: vec!["root".to_string()],
                ..Default::default()
            });
        }

        let path = ensure_no_leading_slash(&req.path);

        // Try exact match first
        if let Some(perms) = self.exact_rules.get(&path) {
            return self.check_permissions(perms, req, check_only);
        }

        // For list operations, also try without trailing slash
        if req.operation == Operation::List {
            let trimmed = path.trim_end_matches('/');
            if let Some(perms) = self.exact_rules.get(trimmed) {
                return self.check_permissions(perms, req, check_only);
            }
        }

        // Try prefix match
        if let Some(perms) = self.get_prefix_permissions(&path) {
            return self.check_permissions(&perms, req, check_only);
        }

        // Try segment wildcard match
        if let Some(perms) = self.get_wildcard_permissions(&path) {
            return self.check_permissions(&perms, req, check_only);
        }

        // No match found, deny
        Ok(ACLResults::default())
    }

    /// Get permissions from prefix rules
    fn get_prefix_permissions(&self, path: &str) -> Option<Permissions> {
        // Find the longest matching prefix
        self.prefix_rules.get_ancestor_value(path).cloned()
    }

    /// Get permissions from segment wildcard rules
    fn get_wildcard_permissions(&self, path: &str) -> Option<Permissions> {
        let path_parts: Vec<&str> = path.split('/').collect();
        let mut best_match: Option<&Permissions> = None;
        let mut best_specificity = 0;

        for (wc_path, perms, is_prefix) in &self.segment_wildcard_paths {
            let wc_parts: Vec<&str> = wc_path.split('/').collect();

            // Check if this pattern matches
            if !*is_prefix && wc_parts.len() != path_parts.len() {
                continue;
            }

            if wc_parts.len() > path_parts.len() {
                continue;
            }

            let mut matches = true;
            let mut specificity = 0;

            for (i, wc_part) in wc_parts.iter().enumerate() {
                if *wc_part == "+" {
                    // Wildcard matches any segment
                    specificity += 1;
                } else if *wc_part == path_parts[i] {
                    // Exact match
                    specificity += 10;
                } else if *is_prefix && i == wc_parts.len() - 1 && path_parts[i].starts_with(wc_part)
                {
                    // Prefix match on last segment
                    specificity += 5;
                } else {
                    matches = false;
                    break;
                }
            }

            if matches && specificity > best_specificity {
                best_specificity = specificity;
                best_match = Some(perms);
            }
        }

        best_match.cloned()
    }

    /// Check if permissions allow the operation
    fn check_permissions(
        &self,
        perms: &Permissions,
        req: &Request,
        check_only: bool,
    ) -> VaultResult<ACLResults> {
        let mut result = ACLResults::default();

        result.root_privs = perms.has_root_privs();

        if check_only {
            result.capabilities_bitmap = perms.capabilities_bitmap;
            return Ok(result);
        }

        // Check if the operation is allowed by capabilities
        if perms.check_operation(&req.operation) {
            result.allowed = true;
            result.capabilities_bitmap = perms.capabilities_bitmap;
        }

        Ok(result)
    }

    /// Get capabilities for a path
    pub fn capabilities(&self, path: &str) -> Vec<String> {
        let req = Request {
            path: path.to_string(),
            operation: Operation::List,
            ..Default::default()
        };

        let deny_response = vec![Capability::Deny.to_string()];

        match self.allow_operation(&req, true) {
            Ok(result) => {
                if result.is_root {
                    return vec![Capability::Root.to_string()];
                }

                if result.capabilities_bitmap & Capability::Deny.to_bits() != 0 {
                    return deny_response;
                }

                let caps = super::policy::to_capability_strings(result.capabilities_bitmap);
                if caps.is_empty() {
                    deny_response
                } else {
                    caps
                }
            }
            Err(_) => deny_response,
        }
    }
}

/// Remove leading slash from path
fn ensure_no_leading_slash(path: &str) -> String {
    path.trim_start_matches('/').to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_policy(name: &str, json: &str) -> Policy {
        let mut policy = Policy::from_json(json).unwrap();
        policy.name = name.to_string();
        policy
    }

    #[test]
    fn test_acl_exact_match() {
        let policy = create_test_policy(
            "test",
            r#"{
                "path": {
                    "secret/data/test": {
                        "capabilities": ["read", "list"]
                    }
                }
            }"#,
        );

        let acl = ACL::new(&[Arc::new(policy)]).unwrap();

        // Exact match should work
        let req = Request {
            path: "secret/data/test".to_string(),
            operation: Operation::Read,
            ..Default::default()
        };
        let result = acl.allow_operation(&req, false).unwrap();
        assert!(result.allowed);

        // Different path should not work
        let req = Request {
            path: "secret/data/other".to_string(),
            operation: Operation::Read,
            ..Default::default()
        };
        let result = acl.allow_operation(&req, false).unwrap();
        assert!(!result.allowed);
    }

    #[test]
    fn test_acl_prefix_match() {
        let policy = create_test_policy(
            "test",
            r#"{
                "path": {
                    "secret/*": {
                        "capabilities": ["read", "list"]
                    }
                }
            }"#,
        );

        let acl = ACL::new(&[Arc::new(policy)]).unwrap();

        // Prefix match should work
        let req = Request {
            path: "secret/data/test".to_string(),
            operation: Operation::Read,
            ..Default::default()
        };
        let result = acl.allow_operation(&req, false).unwrap();
        assert!(result.allowed);

        // Should also work for nested paths
        let req = Request {
            path: "secret/data/nested/deep".to_string(),
            operation: Operation::Read,
            ..Default::default()
        };
        let result = acl.allow_operation(&req, false).unwrap();
        assert!(result.allowed);
    }

    #[test]
    fn test_acl_deny_overrides() {
        let policy1 = create_test_policy(
            "allow",
            r#"{
                "path": {
                    "secret/*": {
                        "capabilities": ["read", "list"]
                    }
                }
            }"#,
        );

        let policy2 = create_test_policy(
            "deny",
            r#"{
                "path": {
                    "secret/sensitive/*": {
                        "capabilities": ["deny"]
                    }
                }
            }"#,
        );

        let acl = ACL::new(&[Arc::new(policy1), Arc::new(policy2)]).unwrap();

        // Regular path should work
        let req = Request {
            path: "secret/data/test".to_string(),
            operation: Operation::Read,
            ..Default::default()
        };
        let result = acl.allow_operation(&req, false).unwrap();
        assert!(result.allowed);

        // Denied path should not work
        let req = Request {
            path: "secret/sensitive/data".to_string(),
            operation: Operation::Read,
            ..Default::default()
        };
        let result = acl.allow_operation(&req, false).unwrap();
        assert!(!result.allowed);
    }

    #[test]
    fn test_acl_root_policy() {
        let policy = Policy {
            name: "root".to_string(),
            ..Default::default()
        };

        let acl = ACL::new(&[Arc::new(policy)]).unwrap();

        // Root policy allows everything
        let req = Request {
            path: "any/path/at/all".to_string(),
            operation: Operation::Write,
            ..Default::default()
        };
        let result = acl.allow_operation(&req, false).unwrap();
        assert!(result.allowed);
        assert!(result.root_privs);
        assert!(result.is_root);
    }

    #[test]
    fn test_acl_capabilities() {
        let policy = create_test_policy(
            "test",
            r#"{
                "path": {
                    "secret/*": {
                        "capabilities": ["read", "list", "create"]
                    }
                }
            }"#,
        );

        let acl = ACL::new(&[Arc::new(policy)]).unwrap();

        let caps = acl.capabilities("secret/test");
        assert!(caps.contains(&"read".to_string()));
        assert!(caps.contains(&"list".to_string()));
        assert!(caps.contains(&"create".to_string()));
        assert!(!caps.contains(&"delete".to_string()));
    }
}

