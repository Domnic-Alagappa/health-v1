use crate::shared::AppResult;
use crate::domain::entities::Relationship;

/// Bridge between Zanzibar relationships and PostgreSQL RLS
pub trait ZanzibarRlsBridge {
    /// Generate RLS policy from Zanzibar relationship
    fn relationship_to_policy(&self, relationship: &Relationship) -> AppResult<String>;
    
    /// Check if user has access based on relationships
    #[allow(async_fn_in_trait)]
    async fn check_access(&self, user_id: &str, resource: &str, action: &str) -> AppResult<bool>;
    
    /// Generate RLS USING expression from relationships
    fn generate_using_expression(&self, user_id: &str, relationships: &[Relationship]) -> String;
}

