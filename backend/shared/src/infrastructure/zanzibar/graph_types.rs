use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;
use std::hash::{Hash, Hasher};

/// Entity type in the authorization graph
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EntityType {
    User(Uuid),
    Group(Uuid),
    Role(String),
    Resource(String),
    App(String),
    Organization(Uuid),
}

impl Hash for EntityType {
    fn hash<H: Hasher>(&self, state: &mut H) {
        match self {
            EntityType::User(id) => {
                0u8.hash(state);
                id.hash(state);
            }
            EntityType::Group(id) => {
                1u8.hash(state);
                id.hash(state);
            }
            EntityType::Role(name) => {
                2u8.hash(state);
                name.hash(state);
            }
            EntityType::Resource(name) => {
                3u8.hash(state);
                name.hash(state);
            }
            EntityType::App(name) => {
                4u8.hash(state);
                name.hash(state);
            }
            EntityType::Organization(id) => {
                5u8.hash(state);
                id.hash(state);
            }
        }
    }
}

impl EntityType {
    /// Create EntityType from Zanzibar string format (e.g., "user:123", "role:admin")
    pub fn from_str(s: &str) -> Option<Self> {
        let parts: Vec<&str> = s.split(':').collect();
        if parts.len() != 2 {
            return None;
        }
        
        match parts[0] {
            "user" => Uuid::parse_str(parts[1]).ok().map(EntityType::User),
            "group" => Uuid::parse_str(parts[1]).ok().map(EntityType::Group),
            "role" => Some(EntityType::Role(parts[1].to_string())),
            "resource" => Some(EntityType::Resource(parts[1].to_string())),
            "app" => Some(EntityType::App(parts[1].to_string())),
            "organization" => Uuid::parse_str(parts[1]).ok().map(EntityType::Organization),
            _ => None,
        }
    }
    
    /// Convert to Zanzibar string format
    pub fn to_string(&self) -> String {
        match self {
            EntityType::User(id) => format!("user:{}", id),
            EntityType::Group(id) => format!("group:{}", id),
            EntityType::Role(name) => format!("role:{}", name),
            EntityType::Resource(name) => format!("resource:{}", name),
            EntityType::App(name) => format!("app:{}", name),
            EntityType::Organization(id) => format!("organization:{}", id),
        }
    }
}

/// Relationship edge in the authorization graph
#[derive(Debug, Clone)]
pub struct RelationshipEdge {
    pub relation: String,
    pub expires_at: Option<DateTime<Utc>>,
    pub valid_from: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub metadata: Value,
    pub relationship_id: Uuid,
}

impl RelationshipEdge {
    /// Check if edge is currently valid (not expired, active, within validity window)
    pub fn is_valid(&self) -> bool {
        if !self.is_active {
            return false;
        }
        
        let now = Utc::now();
        
        // Check valid_from
        if let Some(valid_from) = self.valid_from {
            if now < valid_from {
                return false;
            }
        }
        
        // Check expires_at
        if let Some(expires_at) = self.expires_at {
            if now >= expires_at {
                return false;
            }
        }
        
        true
    }
    
    /// Check if edge matches a specific relation
    pub fn matches_relation(&self, relation: &str) -> bool {
        self.relation == relation
    }
    
    /// Check conditional permissions (time-based, context-based)
    /// Evaluates conditions in metadata
    pub fn evaluate_condition(&self, context: Option<&Value>) -> bool {
        // Check if metadata contains conditions
        if let Some(conditions) = self.metadata.get("conditions") {
            // Example conditions:
            // - time_based: { "time_range": { "start": "...", "end": "..." } }
            // - context_based: { "requires": { "department": "cardiology" } }
            
            // For now, return true (conditions can be implemented later)
            // In a full implementation, evaluate conditions against context
        }
        
        true
    }
    
    /// Check if edge is valid with context
    pub fn is_valid_with_context(&self, context: Option<&Value>) -> bool {
        self.is_valid() && self.evaluate_condition(context)
    }
}

/// Graph node data
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GraphNode {
    pub entity: EntityType,
}

impl Hash for GraphNode {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.entity.hash(state);
    }
}

impl GraphNode {
    pub fn new(entity: EntityType) -> Self {
        Self { entity }
    }
    
    pub fn from_str(s: &str) -> Option<Self> {
        EntityType::from_str(s).map(GraphNode::new)
    }
    
    pub fn to_string(&self) -> String {
        self.entity.to_string()
    }
}

