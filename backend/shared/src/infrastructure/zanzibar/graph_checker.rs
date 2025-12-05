use crate::infrastructure::zanzibar::graph_builder::AuthorizationGraph;
use crate::infrastructure::zanzibar::graph_types::RelationshipEdge;
use crate::shared::AppResult;
use petgraph::graph::NodeIndex;
use std::collections::{HashSet, VecDeque, HashMap};

/// Graph-based permission checker
pub struct GraphPermissionChecker {
    graph: std::sync::Arc<AuthorizationGraph>,
    max_depth: usize,
}

impl GraphPermissionChecker {
    pub fn new(graph: std::sync::Arc<AuthorizationGraph>) -> Self {
        Self {
            graph,
            max_depth: 10, // Default max depth to prevent infinite loops
        }
    }
    
    pub fn with_max_depth(mut self, max_depth: usize) -> Self {
        self.max_depth = max_depth;
        self
    }
    
    /// Check if user has relation on object using graph traversal
    pub fn check(&self, user: &str, relation: &str, object: &str) -> AppResult<bool> {
        // First, check for wildcard permission (super admin bypass)
        // Check if user has wildcard: user#*@*
        if let Some(user_node) = self.graph.get_node(user) {
            // Check all outgoing edges from user node for wildcard
            for (target_node, edge) in self.graph.get_outgoing_edges(user_node) {
                if edge.relation == "*" {
                    // Check if target is "*" by looking at the entity
                    if let Some(target_entity) = self.graph.get_entity(target_node) {
                        if target_entity == "*" && edge.is_valid() {
                            // Wildcard exists, user has all permissions
                            return Ok(true);
                        }
                    }
                }
            }
        }
        
        let user_node = self.graph.get_node(user);
        let object_node = self.graph.get_node(object);
        
        if user_node.is_none() || object_node.is_none() {
            return Ok(false);
        }
        
        let user_idx = user_node.unwrap();
        let object_idx = object_node.unwrap();
        
        // Check direct edge first
        if let Some(edge) = self.get_edge(user_idx, object_idx) {
            if edge.matches_relation(relation) && edge.is_valid() {
                return Ok(true);
            }
        }
        
        // Find all paths from user to object
        // We need to check if any path exists AND any edge leading to object has the relation
        let paths = self.find_paths(user_idx, object_idx, relation)?;
        
        if !paths.is_empty() {
            // Check if any path ends with an edge that has the relation
            for path in paths {
                if path.len() >= 2 {
                    let last_node = path[path.len() - 2];
                    if let Some(edge) = self.get_edge(last_node, object_idx) {
                        if edge.matches_relation(relation) && edge.is_valid() {
                            return Ok(true);
                        }
                    }
                }
            }
        }
        
        Ok(false)
    }
    
    /// Find all paths from source to target matching a relation
    /// In Zanzibar, we find paths to the target and check if any edge leading to it has the relation
    pub fn find_paths(
        &self,
        source: NodeIndex,
        target: NodeIndex,
        target_relation: &str,
    ) -> AppResult<Vec<Vec<NodeIndex>>> {
        let mut paths = Vec::new();
        let mut current_path = Vec::new();
        
        self.dfs_paths(
            source,
            target,
            target_relation,
            &mut paths,
            &mut current_path,
            0,
        )?;
        
        Ok(paths)
    }
    
    /// DFS to find all paths
    fn dfs_paths(
        &self,
        current: NodeIndex,
        target: NodeIndex,
        target_relation: &str,
        paths: &mut Vec<Vec<NodeIndex>>,
        current_path: &mut Vec<NodeIndex>,
        depth: usize,
    ) -> AppResult<()> {
        // Check max depth
        if depth > self.max_depth {
            return Ok(());
        }
        
        // Check for cycles (if node already in current path)
        if current_path.contains(&current) {
            return Ok(()); // Cycle detected, skip
        }
        
        // Add to current path
        current_path.push(current);
        
        // Check if we reached target
        if current == target {
            // Found a path to target, check if any incoming edge has the relation
            // Actually, we need to check all edges that could grant this relation
            // For now, accept any path to target (relation check happens elsewhere)
            paths.push(current_path.clone());
            current_path.pop();
            return Ok(());
        }
        
        // Explore neighbors
        for (neighbor, edge) in self.graph.get_outgoing_edges(current) {
            // Only traverse valid edges
            if !edge.is_valid() {
                continue;
            }
            
            // Special case: if neighbor is target and edge matches relation, we found a path
            if neighbor == target && edge.matches_relation(target_relation) {
                current_path.push(neighbor);
                paths.push(current_path.clone());
                current_path.pop();
                continue;
            }
            
            // Recursively explore
            self.dfs_paths(
                neighbor,
                target,
                target_relation,
                paths,
                current_path,
                depth + 1,
            )?;
        }
        
        // Backtrack
        current_path.pop();
        
        Ok(())
    }
    
    /// Get edge between two nodes
    fn get_edge(&self, source: NodeIndex, target: NodeIndex) -> Option<&RelationshipEdge> {
        self.graph
            .graph
            .edges_connecting(source, target)
            .next()
            .map(|edge_ref| edge_ref.weight())
    }
    
    /// Find shortest path using BFS
    #[allow(unused_variables)]
    pub fn shortest_path(
        &self,
        source: &str,
        target: &str,
        target_relation: &str,
    ) -> AppResult<Option<Vec<String>>> {
        let source_node = self.graph.get_node(source);
        let target_node = self.graph.get_node(target);
        
        if source_node.is_none() || target_node.is_none() {
            return Ok(None);
        }
        
        let source_idx = source_node.unwrap();
        let target_idx = target_node.unwrap();
        
        // BFS to find shortest path
        let mut queue = VecDeque::new();
        let mut visited = HashSet::new();
        let mut parent = HashMap::new();
        
        queue.push_back(source_idx);
        visited.insert(source_idx);
        
        while let Some(current) = queue.pop_front() {
            if current == target_idx {
                // Reconstruct path
                let mut path = Vec::new();
                let mut node = current;
                
                while let Some(&parent_node) = parent.get(&node) {
                    path.push(self.graph.get_entity(node).unwrap_or("unknown").to_string());
                    node = parent_node;
                    if node == source_idx {
                        break;
                    }
                }
                
                path.push(self.graph.get_entity(source_idx).unwrap_or("unknown").to_string());
                path.reverse();
                
                // Check if last edge matches relation
                if path.len() >= 2 {
                    if let Some(entity_str) = self.graph.get_entity(target_idx) {
                        path.push(entity_str.to_string());
                    }
                }
                
                return Ok(Some(path));
            }
            
            // Explore neighbors
            for (neighbor, edge) in self.graph.get_outgoing_edges(current) {
                if !edge.is_valid() {
                    continue;
                }
                
                if !visited.contains(&neighbor) {
                    visited.insert(neighbor);
                    parent.insert(neighbor, current);
                    queue.push_back(neighbor);
                }
            }
        }
        
        Ok(None)
    }
    
    /// Get all entities accessible by user through a specific relation
    pub fn find_accessible_entities(&self, user: &str, relation: &str) -> AppResult<HashSet<String>> {
        let user_node = self.graph.get_node(user);
        if user_node.is_none() {
            return Ok(HashSet::new());
        }
        
        let user_idx = user_node.unwrap();
        let mut accessible = HashSet::new();
        let mut visited = HashSet::new();
        
        self.dfs_accessible(user_idx, relation, &mut accessible, &mut visited, 0)?;
        
        Ok(accessible)
    }
    
    /// DFS to find all accessible entities
    fn dfs_accessible(
        &self,
        current: NodeIndex,
        target_relation: &str,
        accessible: &mut HashSet<String>,
        visited: &mut HashSet<NodeIndex>,
        depth: usize,
    ) -> AppResult<()> {
        if depth > self.max_depth {
            return Ok(());
        }
        
        if visited.contains(&current) {
            return Ok(());
        }
        
        visited.insert(current);
        
        // Check all outgoing edges
        for (neighbor, edge) in self.graph.get_outgoing_edges(current) {
            if !edge.is_valid() {
                continue;
            }
            
            // If edge matches relation, add target to accessible set
            if edge.matches_relation(target_relation) {
                if let Some(entity_str) = self.graph.get_entity(neighbor) {
                    accessible.insert(entity_str.to_string());
                }
            }
            
            // Continue traversal (even if relation doesn't match, might lead to matching edge)
            self.dfs_accessible(neighbor, target_relation, accessible, visited, depth + 1)?;
        }
        
        Ok(())
    }
    
    /// Find all permission paths for a user
    pub fn find_permission_paths(&self, user: &str, relation: &str, object: &str) -> AppResult<Vec<Vec<String>>> {
        let user_node = self.graph.get_node(user);
        let object_node = self.graph.get_node(object);
        
        if user_node.is_none() || object_node.is_none() {
            return Ok(Vec::new());
        }
        
        let paths = self.find_paths(user_node.unwrap(), object_node.unwrap(), relation)?;
        
        // Convert NodeIndex paths to String paths
        let string_paths: Vec<Vec<String>> = paths
            .into_iter()
            .map(|path| {
                path.into_iter()
                    .filter_map(|idx| self.graph.get_entity(idx))
                    .map(|s| s.to_string())
                    .collect()
            })
            .collect();
        
        Ok(string_paths)
    }
    
    /// Batch check multiple permissions using graph
    pub fn check_batch(&self, checks: Vec<(String, String, String)>) -> AppResult<Vec<bool>> {
        let mut results = Vec::with_capacity(checks.len());
        
        for (user, relation, object) in checks {
            match self.check(&user, &relation, &object) {
                Ok(result) => results.push(result),
                Err(_) => results.push(false),
            }
        }
        
        Ok(results)
    }
    
    /// Find all accessible entities for a user with a specific relation
    /// Useful for "find all resources user can view"
    pub fn find_accessible_entities_by_relation(
        &self,
        user: &str,
        relation: &str,
    ) -> AppResult<HashSet<String>> {
        self.find_accessible_entities(user, relation)
    }
}


