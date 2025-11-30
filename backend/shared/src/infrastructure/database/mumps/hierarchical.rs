use crate::infrastructure::database::mumps::Global;
use crate::shared::AppResult;

/// Hierarchical data access pattern (MUMPS-style)
pub trait HierarchicalAccess {
    /// Get value at global path
    async fn get(&self, global: &Global) -> AppResult<Option<String>>;
    
    /// Set value at global path
    async fn set(&self, global: &Global, value: &str) -> AppResult<()>;
    
    /// Delete global and all subscripts
    async fn kill(&self, global: &Global) -> AppResult<()>;
    
    /// Get all subscripts at a level
    async fn order(&self, global: &Global) -> AppResult<Vec<String>>;
    
    /// Query with pattern matching
    async fn query(&self, pattern: &str) -> AppResult<Vec<(Global, String)>>;
}

