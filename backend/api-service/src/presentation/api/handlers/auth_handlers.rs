use axum::{Json, extract::{State, Request}, http::StatusCode, response::IntoResponse};
use authz_core::dto::{LoginRequest, RefreshTokenRequest};
use shared::RequestContext;
use super::super::AppState;
use std::sync::Arc;

pub async fn login(
    State(state): State<Arc<AppState>>,
    request: Request,
) -> impl IntoResponse {
    let location = concat!(file!(), ":", line!());
    
    // Split request into parts to access extensions and body separately
    let (parts, body) = request.into_parts();
    
    // Get session from request extensions (set by session_middleware)
    let session = parts.extensions.get::<shared::domain::entities::Session>().cloned();
    
    // Extract JSON from body
    let body_bytes = match axum::body::to_bytes(body, usize::MAX).await {
        Ok(bytes) => bytes,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": format!("Failed to read body: {}", e)}))).into_response();
        }
    };
    
    let login_request: LoginRequest = match serde_json::from_slice(&body_bytes) {
        Ok(req) => req,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error": format!("Invalid JSON: {}", e)}))).into_response();
        }
    };
    
    match state.login_use_case.execute(login_request).await {
        Ok(mut response) => {
            // If we have a session, authenticate it
            if let Some(sess) = session {
                // Extract user_id from login response
                if let Ok(user_id) = uuid::Uuid::parse_str(&response.user.id) {
                    // Get user's organization_id
                    use shared::domain::repositories::UserRepository;
                    use shared::infrastructure::repositories::UserRepositoryImpl;
                    let user_repository = UserRepositoryImpl::new(state.database_service.clone());
                    if let Ok(Some(user)) = user_repository.find_by_id(user_id).await {
                        // Authenticate the session
                        if let Err(e) = state.session_service.authenticate_session(
                            sess.id,
                            user_id,
                            user.organization_id,
                        ).await {
                            tracing::warn!("Failed to authenticate session on login: {}", e);
                        } else {
                            // Add session_token to response
                            response.session_token = Some(sess.session_token.clone());
                        }
                    }
                }
            }
            (StatusCode::OK, Json(response)).into_response()
        },
        Err(e) => {
            e.log_with_operation(location, "login");
            let status = match e {
                shared::AppError::Authentication(_) => StatusCode::UNAUTHORIZED,
                shared::AppError::NotFound(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            };
            (status, Json(serde_json::json!({"error": format!("{}", e)}))).into_response()
        }
    }
}

pub async fn logout(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> impl IntoResponse {
    // Extract refresh token from Authorization header
    // The client should send refresh token in Authorization header for logout
    let refresh_token = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .unwrap_or_default();

    // If token provided, revoke it
    if !refresh_token.is_empty() {
        let _ = state.logout_use_case.execute(&refresh_token).await;
    }

    (StatusCode::OK, Json(serde_json::json!({"message": "Logged out"}))).into_response()
}

pub async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(request): Json<RefreshTokenRequest>,
) -> impl IntoResponse {
    let location = concat!(file!(), ":", line!());
    match state.refresh_token_use_case.execute(request).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => {
            e.log_with_operation(location, "refresh_token");
            let status = match e {
                shared::AppError::Authentication(_) => StatusCode::UNAUTHORIZED,
                shared::AppError::NotFound(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            };
            (status, Json(serde_json::json!({"error": format!("{}", e)}))).into_response()
        }
    }
}

pub async fn userinfo(
    State(state): State<Arc<AppState>>,
    context: RequestContext,
) -> impl IntoResponse {
    let location = concat!(file!(), ":", line!());
    // Use user_id from request context (set by auth_middleware)
    match state.userinfo_use_case.execute(context.user_id).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => {
            let log_context = shared::infrastructure::logging::LogContext::from_request_context(&context)
                .with_operation("userinfo".to_string());
            e.log_with_context(location, &log_context);
            let status = match e {
                shared::AppError::NotFound(_) => StatusCode::NOT_FOUND,
                shared::AppError::Authentication(_) => StatusCode::UNAUTHORIZED,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            };
            (status, Json(serde_json::json!({"error": format!("{}", e)}))).into_response()
        }
    }
}

