use crate::shared::AppResult;
use crate::domain::entities::User;

pub struct OidcProvider {
    issuer: String,
    client_id: String,
    client_secret: String,
}

impl OidcProvider {
    pub fn new(issuer: String, client_id: String, client_secret: String) -> Self {
        Self {
            issuer,
            client_id,
            client_secret,
        }
    }

    pub fn authorization_endpoint(&self) -> String {
        format!("{}/auth/authorize", self.issuer)
    }

    pub fn token_endpoint(&self) -> String {
        format!("{}/auth/token", self.issuer)
    }

    pub fn userinfo_endpoint(&self) -> String {
        format!("{}/auth/userinfo", self.issuer)
    }

    pub fn jwks_endpoint(&self) -> String {
        format!("{}/.well-known/jwks.json", self.issuer)
    }

    pub async fn validate_authorization_code(&self, _code: &str) -> AppResult<User> {
        // TODO: Implement authorization code validation
        Err(crate::shared::AppError::Authentication(
            "Authorization code validation not yet implemented".to_string(),
        ))
    }
}

