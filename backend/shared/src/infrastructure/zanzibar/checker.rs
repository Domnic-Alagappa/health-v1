use crate::infrastructure::zanzibar::{RelationshipStore, GraphPermissionChecker, GraphCache};
use crate::domain::repositories::RelationshipRepository;
use crate::shared::AppResult;
use std::collections::HashSet;
use std::sync::Arc;
use uuid::Uuid;

pub struct PermissionChecker {
    store: RelationshipStore,
    graph_cache: Option<Arc<GraphCache>>,
    use_graph_for_deep_queries: bool,
}

impl PermissionChecker {
    pub fn new(store: RelationshipStore) -> Self {
        Self {
            store,
            graph_cache: None,
            use_graph_for_deep_queries: false,
        }
    }
    
    /// Create with graph cache enabled
    pub fn with_graph_cache(
        store: RelationshipStore,
        graph_cache: Arc<GraphCache>,
        use_graph_for_deep_queries: bool,
    ) -> Self {
        Self {
            store,
            graph_cache: Some(graph_cache),
            use_graph_for_deep_queries,
        }
    }
    
    /// Check if query is complex enough to use graph (depth > 2)
    fn should_use_graph(&self) -> bool {
        self.use_graph_for_deep_queries && self.graph_cache.is_some()
    }

    /// Check if user has relation on object
    /// Supports multiple inheritance paths and UNION of permissions:
    /// 1. Wildcard permission: user#*@* (grants all permissions - checked first)
    /// 2. Direct user permissions: user#relation@resource
    /// 3. Role inheritance: user#has_role@role → role#relation@resource
    /// 4. Group membership: user#member@group → group#relation@resource
    /// 5. Group role inheritance: user#member@group → group#has_role@role → role#relation@resource
    /// Returns true if ANY path grants permission (union, not override)
    pub async fn check(&self, user: &str, relation: &str, object: &str) -> AppResult<bool> {
        self.check_with_organization(user, relation, object, None).await
    }
    
    /// Check if user has relation on object with organization scoping
    /// Supports hierarchical object format: organization:{org_id}/app:{app}/module:{module}/resource:{id}
    /// When organization_id is provided, filters relationships to that organization
    pub async fn check_with_organization(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        organization_id: Option<Uuid>,
    ) -> AppResult<bool> {
        // First, check for wildcard permission (super admin bypass)
        // This must be checked first to ensure super admins have access to everything
        // Note: Wildcard check doesn't filter by organization (global permission)
        if self.store.check(user, "*", "*").await? {
            return Ok(true);
        }

        // Use graph-based checker if available and enabled
        if self.should_use_graph() {
            if let Some(cache) = &self.graph_cache {
                // Try to get cached graph
                if let Some(graph) = cache.get_cached() {
                    let graph_checker = GraphPermissionChecker::new(graph);
                    if let Ok(result) = graph_checker.check(user, relation, object) {
                        // TODO: Add organization filtering to graph checker
                        return Ok(result);
                    }
                    // Fall through to database-based check if graph check fails
                }
            }
        }
        
        // Fallback to database-based check (original implementation)
        // 1. Direct user permission check (with organization filtering)
        if self.store.check_with_organization(user, relation, object, organization_id).await? {
            return Ok(true);
        }

        // 2. Get all user relationships (only valid ones, filtered by organization if provided)
        let user_relationships = if let Some(org_id) = organization_id {
            self.store.get_valid_relationships_by_org(user, org_id).await?
        } else {
            self.store.get_valid_relationships(user).await?
        };
        
        // 3. Check role-based permissions
        for rel in &user_relationships {
            if rel.relation == "has_role" {
                // User has a role, check if role has the relation
                let role_str = &rel.object; // e.g., "role:admin"
                // Check role permission with same organization context
                if self.store.check_with_organization(role_str, relation, object, organization_id).await? {
                    return Ok(true);
                }
            }
        }
        
        // 4. Check group-based permissions
        for rel in &user_relationships {
            if rel.relation == "member" {
                let group_str = &rel.object; // e.g., "group:doctors"
                
                // 4a. Direct group permission (with organization context)
                if self.store.check_with_organization(group_str, relation, object, organization_id).await? {
                    return Ok(true);
                }
                
                // 4b. Group role inheritance: group#has_role@role → role#relation@resource
                // Get group relationships (filtered by organization if provided)
                let group_relationships = if let Some(org_id) = organization_id {
                    // For groups, we need to check relationships in the same org
                    // Groups themselves might not have organization_id, but their relationships should
                    self.store.get_valid_relationships(group_str).await?
                        .into_iter()
                        .filter(|r| r.organization_id == organization_id || r.organization_id.is_none())
                        .collect()
                } else {
                    self.store.get_valid_relationships(group_str).await?
                };
                
                for group_rel in &group_relationships {
                    if group_rel.relation == "has_role" {
                        let role_str = &group_rel.object;
                        if self.store.check_with_organization(role_str, relation, object, organization_id).await? {
                            return Ok(true);
                        }
                    }
                }
            }
        }

        Ok(false)
    }
    
    /// Check permission using graph (for complex queries)
    pub async fn check_with_graph(
        &self,
        user: &str,
        relation: &str,
        object: &str,
        repository: &dyn RelationshipRepository,
    ) -> AppResult<bool> {
        if let Some(cache) = &self.graph_cache {
            let graph = cache.get_or_build(repository).await?;
            let graph_checker = GraphPermissionChecker::new(graph);
            graph_checker.check(user, relation, object)
        } else {
            // Fallback to regular check
            self.check(user, relation, object).await
        }
    }
    
    /// Check if user can access a specific app
    /// Supports all inheritance paths: user → role → app, user → group → role → app
    /// Uses hierarchical format: organization:{org_id}/app:{app_name}
    pub async fn can_access_app(&self, user: &str, app_name: &str) -> AppResult<bool> {
        // Legacy format for backward compatibility
        let app_str = format!("app:{}", app_name);
        self.check(user, "can_access", &app_str).await
    }
    
    /// Check if user can access a specific app within an organization
    /// Uses hierarchical format: organization:{org_id}/app:{app_name}
    pub async fn can_access_app_with_org(
        &self,
        user: &str,
        app_name: &str,
        organization_id: Uuid,
    ) -> AppResult<bool> {
        // Use hierarchical object format
        let app_str = format!("organization:{}/app:{}", organization_id, app_name);
        
        // Check with organization context
        self.check_with_organization(user, "can_access", &app_str, Some(organization_id)).await
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

