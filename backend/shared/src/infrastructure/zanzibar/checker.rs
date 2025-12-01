use crate::infrastructure::zanzibar::RelationshipStore;
use crate::shared::AppResult;
use std::collections::HashSet;

pub struct PermissionChecker {
    store: RelationshipStore,
}

impl PermissionChecker {
    pub fn new(store: RelationshipStore) -> Self {
        Self { store }
    }

    /// Check if user has relation on object
    /// Supports multiple inheritance paths and UNION of permissions:
    /// 1. Direct user permissions: user#relation@resource
    /// 2. Role inheritance: user#has_role@role → role#relation@resource
    /// 3. Group membership: user#member@group → group#relation@resource
    /// 4. Group role inheritance: user#member@group → group#has_role@role → role#relation@resource
    /// Returns true if ANY path grants permission (union, not override)
    pub async fn check(&self, user: &str, relation: &str, object: &str) -> AppResult<bool> {
        // 1. Direct user permission check
        if self.store.check(user, relation, object).await? {
            return Ok(true);
        }

        // 2. Get all user relationships (only valid ones)
        let user_relationships = self.store.get_valid_relationships(user).await?;
        
        // 3. Check role-based permissions
        for rel in &user_relationships {
            if rel.relation == "has_role" {
                // User has a role, check if role has the relation
                let role_str = &rel.object; // e.g., "role:admin"
                if self.store.check(role_str, relation, object).await? {
                    return Ok(true);
                }
            }
        }
        
        // 4. Check group-based permissions
        for rel in &user_relationships {
            if rel.relation == "member" {
                let group_str = &rel.object; // e.g., "group:doctors"
                
                // 4a. Direct group permission
                if self.store.check(group_str, relation, object).await? {
                    return Ok(true);
                }
                
                // 4b. Group role inheritance: group#has_role@role → role#relation@resource
                let group_relationships = self.store.get_valid_relationships(group_str).await?;
                for group_rel in &group_relationships {
                    if group_rel.relation == "has_role" {
                        let role_str = &group_rel.object;
                        if self.store.check(role_str, relation, object).await? {
                            return Ok(true);
                        }
                    }
                }
            }
        }

        Ok(false)
    }
    
    /// Check if user can access a specific app
    /// Supports all inheritance paths: user → role → app, user → group → role → app
    pub async fn can_access_app(&self, user: &str, app_name: &str) -> AppResult<bool> {
        let app_str = format!("app:{}", app_name);
        
        // 1. Direct user-to-app check
        if self.check(user, "can_access", &app_str).await? {
            return Ok(true);
        }
        
        // The check() method already handles all inheritance paths
        // So we can just use it
        Ok(false)
    }
    
    /// Get all permissions for a user (union of all sources)
    /// Returns a set of (relation, object) tuples
    pub async fn get_all_permissions(&self, user: &str) -> AppResult<HashSet<(String, String)>> {
        let mut permissions = HashSet::new();
        
        // Get all valid user relationships
        let user_relationships = self.store.get_valid_relationships(user).await?;
        
        // Direct user permissions
        for rel in &user_relationships {
            if rel.relation != "member" && rel.relation != "has_role" {
                permissions.insert((rel.relation.clone(), rel.object.clone()));
            }
        }
        
        // Role-based permissions
        for rel in &user_relationships {
            if rel.relation == "has_role" {
                let role_str = &rel.object;
                let role_relationships = self.store.get_valid_relationships(role_str).await?;
                for role_rel in &role_relationships {
                    permissions.insert((role_rel.relation.clone(), role_rel.object.clone()));
                }
            }
        }
        
        // Group-based permissions
        for rel in &user_relationships {
            if rel.relation == "member" {
                let group_str = &rel.object;
                
                // Direct group permissions
                let group_relationships = self.store.get_valid_relationships(group_str).await?;
                for group_rel in &group_relationships {
                    if group_rel.relation != "has_role" {
                        permissions.insert((group_rel.relation.clone(), group_rel.object.clone()));
                    }
                }
                
                // Group role permissions
                for group_rel in &group_relationships {
                    if group_rel.relation == "has_role" {
                        let role_str = &group_rel.object;
                        let role_relationships = self.store.get_valid_relationships(role_str).await?;
                        for role_rel in &role_relationships {
                            permissions.insert((role_rel.relation.clone(), role_rel.object.clone()));
                        }
                    }
                }
            }
        }
        
        Ok(permissions)
    }

    /// Batch check multiple permissions
    pub async fn check_batch(&self, checks: Vec<(String, String, String)>) -> AppResult<Vec<bool>> {
        let mut results = Vec::new();
        for (user, relation, object) in checks {
            let result = self.check(&user, &relation, &object).await?;
            results.push(result);
        }
        Ok(results)
    }
}

