use crate::shared::AppResult;

/// Row Level Security policy
pub struct RlsPolicy {
    pub table_name: String,
    pub policy_name: String,
    pub using_expression: String, // SQL expression for SELECT
    pub with_check_expression: Option<String>, // SQL expression for INSERT/UPDATE
}

impl RlsPolicy {
    pub fn new(table_name: String, policy_name: String, using_expression: String) -> Self {
        Self {
            table_name,
            policy_name,
            using_expression,
            with_check_expression: None,
        }
    }

    pub fn with_check(mut self, expression: String) -> Self {
        self.with_check_expression = Some(expression);
        self
    }

    /// Generate SQL to create policy
    pub fn to_sql(&self) -> String {
        let mut sql = format!(
            "CREATE POLICY {} ON {} USING ({})",
            self.policy_name, self.table_name, self.using_expression
        );

        if let Some(ref check) = self.with_check_expression {
            sql.push_str(&format!(" WITH CHECK ({})", check));
        }

        sql
    }
}

