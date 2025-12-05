use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::Serialize;
use std::sync::Arc;

// Type aliases for convenience
type ConcreteAppState = shared::AppState<
    authz_core::auth::LoginUseCase,
    authz_core::auth::RefreshTokenUseCase,
    authz_core::auth::LogoutUseCase,
    authz_core::auth::UserInfoUseCase,
    crate::use_cases::setup::SetupOrganizationUseCase,
    crate::use_cases::setup::CreateSuperAdminUseCase,
>;

#[derive(Debug, Serialize)]
pub struct DashboardStatsResponse {
    pub organizations_count: i64,
    pub users_count: i64,
    pub permissions_count: i64,
}

/// Get dashboard statistics
pub async fn get_dashboard_stats(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    let location = concat!(file!(), ":", line!());
    
    let pool = state.database_pool.as_ref();
    
    // Count organizations
    let org_result = sqlx::query!(
        r#"
        SELECT COUNT(*)::bigint as count
        FROM organizations
        "#
    )
    .fetch_one(pool)
    .await;
    
    let organizations_count = match org_result {
        Ok(row) => row.count.unwrap_or(0),
        Err(e) => {
            let error = shared::AppError::Database(e);
            error.log_with_operation(location, "get_dashboard_stats - organizations count");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to get organizations count: {}", error)
                })),
            )
                .into_response();
        }
    };
    
    // Count users
    let users_result = sqlx::query!(
        r#"
        SELECT COUNT(*)::bigint as count
        FROM users
        "#
    )
    .fetch_one(pool)
    .await;
    
    let users_count = match users_result {
        Ok(row) => row.count.unwrap_or(0),
        Err(e) => {
            let error = shared::AppError::Database(e);
            error.log_with_operation(location, "get_dashboard_stats - users count");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to get users count: {}", error)
                })),
            )
                .into_response();
        }
    };
    
    // Count active permissions (relationships that are permissions, not roles or groups)
    // Permissions are typically relationships where the relation is not "member" or "has_role"
    let permissions_result = sqlx::query!(
        r#"
        SELECT COUNT(DISTINCT (relation, object))::bigint as count
        FROM relationships
        WHERE deleted_at IS NULL
        AND is_active = true
        AND relation NOT IN ('member', 'has_role')
        "#
    )
    .fetch_one(pool)
    .await;
    
    let permissions_count = match permissions_result {
        Ok(row) => row.count.unwrap_or(0),
        Err(e) => {
            let error = shared::AppError::Database(e);
            error.log_with_operation(location, "get_dashboard_stats - permissions count");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to get permissions count: {}", error)
                })),
            )
                .into_response();
        }
    };
    
    (
        StatusCode::OK,
        Json(DashboardStatsResponse {
            organizations_count,
            users_count,
            permissions_count,
        }),
    )
        .into_response()
}

