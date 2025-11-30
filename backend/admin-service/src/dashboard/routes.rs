use axum::Router;
use axum::routing::get;

pub fn create_dashboard_router() -> Router {
    Router::new()
        .route("/dashboard/users", get(list_users))
        .route("/dashboard/roles", get(list_roles))
        .route("/dashboard/permissions", get(list_permissions))
        .route("/dashboard/keys", get(list_keys))
        .route("/dashboard/audit", get(get_audit_logs))
}

async fn list_users() -> &'static str {
    "Users list"
}

async fn list_roles() -> &'static str {
    "Roles list"
}

async fn list_permissions() -> &'static str {
    "Permissions list"
}

async fn list_keys() -> &'static str {
    "Keys list"
}

async fn get_audit_logs() -> &'static str {
    "Audit logs"
}

