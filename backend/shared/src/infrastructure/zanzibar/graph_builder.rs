use crate::domain::entities::Relationship;
use crate::domain::repositories::RelationshipRepository;
use crate::infrastructure::zanzibar::graph_types::{GraphNode, RelationshipEdge, EntityType};
use crate::shared::AppResult;
use petgraph::graph::{DiGraph, NodeIndex};
use std::collections::HashMap;

/// Authorization graph built from relationships
pub struct AuthorizationGraph {
    pub graph: DiGraph<GraphNode, RelationshipEdge>,
    pub node_index: HashMap<String, NodeIndex>, // Entity string -> NodeIndex
    pub reverse_index: HashMap<NodeIndex, String>, // NodeIndex -> Entity string
}

impl AuthorizationGraph {
    pub fn new() -> Self {
        Self {
            graph: DiGraph::new(),
            node_index: HashMap::new(),
            reverse_index: HashMap::new(),
        }
    }
    
    /// Build graph from all relationships in the database
    pub async fn build_from_repository(
        repository: &dyn RelationshipRepository,
    ) -> AppResult<Self> {
        // Get all relationships from database
        let relationships = repository.list_all().await?;
        
        // Build graph from relationships
        Ok(Self::build_from_relationships(relationships))
    }
    
    /// Build graph from a list of relationships
    pub fn build_from_relationships(relationships: Vec<Relationship>) -> Self {
        let mut graph_builder = Self::new();
        
        for rel in relationships {
            graph_builder.add_relationship(rel);
        }
        
        graph_builder
    }
    
    /// Add a relationship to the graph
    pub fn add_relationship(&mut self, relationship: Relationship) {
        // Get or create source node
        let source_node = self.get_or_create_node(&relationship.user);
        
        // Get or create target node
        let target_node = self.get_or_create_node(&relationship.object);
        
        // Create edge
        let edge = RelationshipEdge {
            relation: relationship.relation.clone(),
            expires_at: relationship.expires_at,
            valid_from: relationship.valid_from,
            is_active: relationship.is_active,
            metadata: relationship.metadata.clone(),
            relationship_id: relationship.id,
        };
        
        // Add edge to graph
        self.graph.add_edge(source_node, target_node, edge);
    }
    
    /// Get or create a node for an entity
    fn get_or_create_node(&mut self, entity_str: &str) -> NodeIndex {
        if let Some(&node_idx) = self.node_index.get(entity_str) {
            return node_idx;
        }
        
        // Create new node
        let node = GraphNode::from_str(entity_str)
            .unwrap_or_else(|| {
                // If parsing fails, create a generic node
                // This handles unknown entity types
                GraphNode::new(EntityType::Resource(entity_str.to_string()))
            });
        
        let node_idx = self.graph.add_node(node);
        self.node_index.insert(entity_str.to_string(), node_idx);
        self.reverse_index.insert(node_idx, entity_str.to_string());
        
        node_idx
    }
    
    /// Get node index for an entity string
    pub fn get_node(&self, entity_str: &str) -> Option<NodeIndex> {
        self.node_index.get(entity_str).copied()
    }
    
    /// Get entity string for a node index
    pub fn get_entity(&self, node_idx: NodeIndex) -> Option<&str> {
        self.reverse_index.get(&node_idx).map(|s| s.as_str())
    }
    
    /// Get all outgoing edges from a node
    pub fn get_outgoing_edges(&self, node_idx: NodeIndex) -> Vec<(NodeIndex, &RelationshipEdge)> {
        self.graph
            .edges(node_idx)
            .map(|edge_ref| (edge_ref.target(), edge_ref.weight()))
            .collect()
    }
    
    /// Get all incoming edges to a node
    pub fn get_incoming_edges(&self, node_idx: NodeIndex) -> Vec<(NodeIndex, &RelationshipEdge)> {
        self.graph
            .edges_directed(node_idx, petgraph::Direction::Incoming)
            .map(|edge_ref| (edge_ref.source(), edge_ref.weight()))
            .collect()
    }
    
    /// Get statistics about the graph
    pub fn stats(&self) -> GraphStats {
        GraphStats {
            node_count: self.graph.node_count(),
            edge_count: self.graph.edge_count(),
        }
    }
    
    /// Detect cycles in the graph using strongly connected components
    pub fn detect_cycles(&self) -> Vec<Vec<String>> {
        use petgraph::algo::kosaraju_scc;
        
        // Find strongly connected components (SCCs) which indicate cycles
        let sccs = kosaraju_scc(&self.graph);
        
        let mut cycles = Vec::new();
        for scc in sccs {
            if scc.len() > 1 {
                // Component with more than one node indicates a cycle
                let cycle: Vec<String> = scc
                    .into_iter()
                    .filter_map(|idx| self.get_entity(idx))
                    .map(|s| s.to_string())
                    .collect();
                if cycle.len() > 1 {
                    cycles.push(cycle);
                }
            }
        }
        
        cycles
    }
    
    /// Check if graph has cycles
    pub fn has_cycles(&self) -> bool {
        !self.detect_cycles().is_empty()
    }
}

#[derive(Debug)]
pub struct GraphStats {
    pub node_count: usize,
    pub edge_count: usize,
}

