use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::Serialize;
use shared::AppState;
use std::sync::Arc;

// Type aliases for convenience
type ConcreteAppState = shared::AppState<
    authz_core::auth::LoginUseCase,
    authz_core::auth::RefreshTokenUseCase,
    authz_core::auth::LogoutUseCase,
    authz_core::auth::UserInfoUseCase,
    admin_service::use_cases::setup::SetupOrganizationUseCase,
    admin_service::use_cases::setup::CreateSuperAdminUseCase,
>;

#[derive(Debug, Serialize)]
pub struct GraphStatsResponse {
    pub node_count: usize,
    pub edge_count: usize,
    pub has_cycles: bool,
    pub cycles: Vec<Vec<String>>,
}

/// Get graph statistics
pub async fn get_graph_stats(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    if let Some(cache) = &state.graph_cache {
        use shared::infrastructure::repositories::RelationshipRepositoryImpl;
        let relationship_repository = RelationshipRepositoryImpl::new(state.database_pool.as_ref().clone());
        
        match cache.get_or_build(&relationship_repository).await {
            Ok(graph) => {
                let stats = graph.stats();
                let cycles = graph.detect_cycles();
                (
                    StatusCode::OK,
                    Json(GraphStatsResponse {
                        node_count: stats.node_count,
                        edge_count: stats.edge_count,
                        has_cycles: !cycles.is_empty(),
                        cycles,
                    }),
                )
                    .into_response()
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to build graph: {}", e)
                })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({
                "error": "Graph cache not enabled"
            })),
        )
            .into_response()
    }
}

/// Refresh graph cache
pub async fn refresh_graph_cache(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    if let Some(cache) = &state.graph_cache {
        use shared::infrastructure::repositories::RelationshipRepositoryImpl;
        let relationship_repository = RelationshipRepositoryImpl::new(state.database_pool.as_ref().clone());
        
        match cache.refresh(&relationship_repository).await {
            Ok(_) => (
                StatusCode::OK,
                Json(serde_json::json!({
                    "success": true,
                    "message": "Graph cache refreshed"
                })),
            )
                .into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to refresh graph: {}", e)
                })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({
                "error": "Graph cache not enabled"
            })),
        )
            .into_response()
    }
}

/// Invalidate graph cache
pub async fn invalidate_graph_cache(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    if let Some(cache) = &state.graph_cache {
        cache.invalidate();
        (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "Graph cache invalidated"
            })),
        )
            .into_response()
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({
                "error": "Graph cache not enabled"
            })),
        )
            .into_response()
    }
}

/// Find permission paths for debugging
pub async fn find_permission_paths(
    State(state): State<Arc<ConcreteAppState>>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let user = params.get("user").map(|s| s.as_str());
    let relation = params.get("relation").map(|s| s.as_str());
    let object = params.get("object").map(|s| s.as_str());
    
    if user.is_none() || relation.is_none() || object.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "Missing required parameters: user, relation, object"
            })),
        )
            .into_response();
    }
    
    if let Some(cache) = &state.graph_cache {
        use shared::infrastructure::repositories::RelationshipRepositoryImpl;
        use shared::infrastructure::zanzibar::GraphPermissionChecker;
        let relationship_repository = RelationshipRepositoryImpl::new(state.database_pool.as_ref().clone());
        
        match cache.get_or_build(&relationship_repository).await {
            Ok(graph) => {
                let graph_checker = GraphPermissionChecker::new(graph);
                match graph_checker.find_permission_paths(user.unwrap(), relation.unwrap(), object.unwrap()) {
                    Ok(paths) => (
                        StatusCode::OK,
                        Json(serde_json::json!({
                            "user": user,
                            "relation": relation,
                            "object": object,
                            "paths": paths,
                            "path_count": paths.len()
                        })),
                    )
                        .into_response(),
                    Err(e) => (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(serde_json::json!({
                            "error": format!("Failed to find paths: {}", e)
                        })),
                    )
                        .into_response(),
                }
            }
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to build graph: {}", e)
                })),
            )
                .into_response(),
        }
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({
                "error": "Graph cache not enabled"
            })),
        )
            .into_response()
    }
}

