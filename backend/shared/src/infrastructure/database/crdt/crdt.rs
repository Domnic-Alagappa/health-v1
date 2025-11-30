use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum CrdtType {
    LWWRegister, // Last-Write-Wins Register
    ORSet,       // Observed-Remove Set
    Counter,     // CRDT Counter
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrdtValue {
    pub crdt_type: CrdtType,
    pub value: serde_json::Value,
    pub timestamp: i64,
    pub vector_clock: Vec<(String, u64)>,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct Crdt {
    pub id: String,
    pub crdt_type: CrdtType,
    pub value: CrdtValue,
}

impl Crdt {
    pub fn new(id: String, crdt_type: CrdtType, value: serde_json::Value) -> Self {
        Self {
            id,
            crdt_type,
            value: CrdtValue {
                crdt_type: crdt_type.clone(),
                value,
                timestamp: chrono::Utc::now().timestamp_millis(),
                vector_clock: Vec::new(),
                metadata: serde_json::json!({}),
            },
        }
    }

    pub fn update_vector_clock(&mut self, node_id: String, timestamp: u64) {
        if let Some(pos) = self.value.vector_clock.iter().position(|(id, _)| id == &node_id) {
            if self.value.vector_clock[pos].1 < timestamp {
                self.value.vector_clock[pos].1 = timestamp;
            }
        } else {
            self.value.vector_clock.push((node_id, timestamp));
        }
    }
}

/// Last-Write-Wins Register implementation
#[derive(Debug, Clone)]
pub struct LWWRegister {
    pub value: String,
    pub timestamp: i64,
}

impl LWWRegister {
    pub fn new(value: String, timestamp: i64) -> Self {
        Self { value, timestamp }
    }

    pub fn merge(&self, other: &Self) -> Self {
        if other.timestamp > self.timestamp {
            other.clone()
        } else {
            self.clone()
        }
    }
}

/// Observed-Remove Set implementation
pub struct ORSet {
    pub elements: HashSet<String>,
    pub tombstones: HashSet<String>,
}

impl ORSet {
    pub fn new() -> Self {
        Self {
            elements: HashSet::new(),
            tombstones: HashSet::new(),
        }
    }

    pub fn add(&mut self, element: String) {
        self.tombstones.remove(&element);
        self.elements.insert(element);
    }

    pub fn remove(&mut self, element: &str) {
        self.elements.remove(element);
        self.tombstones.insert(element.to_string());
    }

    pub fn merge(&mut self, other: &Self) {
        // Remove elements that are in other's tombstones
        for element in &other.tombstones {
            self.elements.remove(element);
            self.tombstones.insert(element.clone());
        }

        // Add elements from other that aren't in our tombstones
        for element in &other.elements {
            if !self.tombstones.contains(element) {
                self.elements.insert(element.clone());
            }
        }
    }

    pub fn contains(&self, element: &str) -> bool {
        self.elements.contains(element) && !self.tombstones.contains(element)
    }
}

impl Default for ORSet {
    fn default() -> Self {
        Self::new()
    }
}

