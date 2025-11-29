use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Email {
    value: String,
}

impl Email {
    pub fn new(email: String) -> Result<Self, String> {
        if Self::is_valid(&email) {
            Ok(Self { value: email })
        } else {
            Err("Invalid email format".to_string())
        }
    }

    pub fn as_str(&self) -> &str {
        &self.value
    }

    fn is_valid(email: &str) -> bool {
        // Basic email validation
        email.contains('@') && email.len() > 3 && email.len() < 255
    }
}

impl fmt::Display for Email {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.value)
    }
}

impl From<String> for Email {
    fn from(value: String) -> Self {
        Self::new(value).unwrap_or_else(|_| Self {
            value: "invalid@example.com".to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_email() {
        let email = Email::new("test@example.com".to_string());
        assert!(email.is_ok());
    }

    #[test]
    fn test_invalid_email() {
        let email = Email::new("invalid".to_string());
        assert!(email.is_err());
    }
}

