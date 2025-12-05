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
    Module(String), // Module within an app
    /// Hierarchical resource path: organization:{org_id}/app:{app}/module:{module}/resource:{type}:{id}
    HierarchicalResource {
        organization_id: Option<Uuid>,
        app_name: Option<String>,
        module_name: Option<String>,
        resource_type: String,
        resource_id: String,
    },
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
            EntityType::Module(name) => {
                6u8.hash(state);
                name.hash(state);
            }
            EntityType::HierarchicalResource { organization_id, app_name, module_name, resource_type, resource_id } => {
                7u8.hash(state);
                organization_id.hash(state);
                app_name.hash(state);
                module_name.hash(state);
                resource_type.hash(state);
                resource_id.hash(state);
            }
        }
    }
}

impl EntityType {
    /// Create EntityType from Zanzibar string format
    /// Supports both simple format (e.g., "user:123", "role:admin") 
    /// and hierarchical format (e.g., "organization:123/app:admin-ui/module:users/page:list")
    pub fn from_str(s: &str) -> Option<Self> {
        // Check for hierarchical format first
        if s.contains('/') {
            return Self::from_hierarchical_str(s);
        }
        
        // Simple format: "type:id"
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
            "module" => Some(EntityType::Module(parts[1].to_string())),
            _ => None,
        }
    }
    
    /// Parse hierarchical format: organization:{org_id}/app:{app}/module:{module}/{type}:{id}
    /// Examples:
    /// - "organization:123/app:admin-ui"
    /// - "organization:123/app:admin-ui/module:users"
    /// - "organization:123/app:admin-ui/module:users/page:list"
    fn from_hierarchical_str(s: &str) -> Option<Self> {
        let parts: Vec<&str> = s.split('/').collect();
        if parts.is_empty() {
            return None;
        }
        
        let mut organization_id = None;
        let mut app_name = None;
        let mut module_name = None;
        let mut resource_type = None;
        let mut resource_id = None;
        
        for part in parts {
            if part.starts_with("organization:") {
                let org_part = part.strip_prefix("organization:")?;
                organization_id = Uuid::parse_str(org_part).ok();
            } else if part.starts_with("app:") {
                app_name = Some(part.strip_prefix("app:")?.to_string());
            } else if part.starts_with("module:") {
                module_name = Some(part.strip_prefix("module:")?.to_string());
            } else if part.contains(':') {
                // Resource: "type:id"
                let resource_parts: Vec<&str> = part.split(':').collect();
                if resource_parts.len() == 2 {
                    resource_type = Some(resource_parts[0].to_string());
                    resource_id = Some(resource_parts[1].to_string());
                }
            }
        }
        
        // If we have a resource type and id, create hierarchical resource
        if let (Some(rt), Some(rid)) = (resource_type, resource_id) {
            Some(EntityType::HierarchicalResource {
                organization_id,
                app_name,
                module_name,
                resource_type: rt,
                resource_id: rid,
            })
        } else if module_name.is_some() {
            // Just a module reference
            Some(EntityType::Module(module_name.unwrap()))
        } else if app_name.is_some() {
            // Just an app reference
            Some(EntityType::App(app_name.unwrap()))
        } else {
            None
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
            EntityType::Module(name) => format!("module:{}", name),
            EntityType::HierarchicalResource {
                organization_id,
                app_name,
                module_name,
                resource_type,
                resource_id,
            } => {
                let mut parts = Vec::new();
                if let Some(org_id) = organization_id {
                    parts.push(format!("organization:{}", org_id));
                }
                if let Some(app) = app_name {
                    parts.push(format!("app:{}", app));
                }
                if let Some(module) = module_name {
                    parts.push(format!("module:{}", module));
                }
                parts.push(format!("{}:{}", resource_type, resource_id));
                parts.join("/")
            }
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
    #[allow(unused_variables)]
    pub fn evaluate_condition(&self, context: Option<&Value>) -> bool {
        // Check if metadata contains conditions
        if let Some(_conditions) = self.metadata.get("conditions") {
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

