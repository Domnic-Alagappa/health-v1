use crate::shared::AppResult;
use crate::domain::entities::User;
use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub exp: i64,
    pub iat: i64,
    pub iss: String,
    pub aud: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permissions: Option<Vec<String>>,
}

pub struct TokenManager {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    issuer: String,
    expiration: u64,
}

impl TokenManager {
    pub fn new(secret: &str, issuer: String, expiration: u64) -> Self {
        let encoding_key = EncodingKey::from_secret(secret.as_ref());
        let decoding_key = DecodingKey::from_secret(secret.as_ref());
        Self {
            encoding_key,
            decoding_key,
            issuer,
            expiration,
        }
    }

    pub fn generate_access_token(&self, user: &User) -> AppResult<String> {
        self.generate_access_token_with_permissions(user, "", &[])
    }

    pub fn generate_access_token_with_permissions(
        &self,
        user: &User,
        role: &str,
        permissions: &[String],
    ) -> AppResult<String> {
        let now = Utc::now();
        let exp = now + Duration::seconds(self.expiration as i64);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            iss: self.issuer.clone(),
            aud: "auth-service".to_string(),
            role: if role.is_empty() { None } else { Some(role.to_string()) },
            permissions: if permissions.is_empty() { None } else { Some(permissions.to_vec()) },
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| crate::shared::AppError::Authentication(format!("Token generation failed: {}", e)))
    }

    pub fn generate_refresh_token(&self, user: &User) -> AppResult<String> {
        // Refresh tokens have longer expiration (7 days)
        let now = Utc::now();
        let exp = now + Duration::days(7);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
            iss: self.issuer.clone(),
            aud: "auth-service".to_string(),
            role: None,
            permissions: None,
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| crate::shared::AppError::Authentication(format!("Refresh token generation failed: {}", e)))
    }

    pub fn validate_token(&self, token: &str) -> AppResult<Claims> {
        let mut validation = Validation::default();
        validation.set_issuer(&[&self.issuer]);
        validation.set_audience(&["auth-service"]);

        let token_data = decode::<Claims>(token, &self.decoding_key, &validation)
            .map_err(|e| crate::shared::AppError::Authentication(format!("Token validation failed: {}", e)))?;

        Ok(token_data.claims)
    }
}

