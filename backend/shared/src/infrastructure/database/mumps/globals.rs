/// MUMPS-style global variable representation
/// Examples: ^PATIENT(123), ^ORDER(456,789)
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Global {
    pub name: String,
    pub subscripts: Vec<String>,
}

impl Global {
    pub fn new(name: String) -> Self {
        Self {
            name,
            subscripts: Vec::new(),
        }
    }

    pub fn with_subscript(mut self, subscript: String) -> Self {
        self.subscripts.push(subscript);
        self
    }

    pub fn with_subscripts(mut self, subscripts: Vec<String>) -> Self {
        self.subscripts = subscripts;
        self
    }

    /// Format as MUMPS global: ^PATIENT(123)
    pub fn to_string(&self) -> String {
        if self.subscripts.is_empty() {
            format!("^{}", self.name)
        } else {
            let subs = self.subscripts
                .iter()
                .map(|s| format!("\"{}\"", s))
                .collect::<Vec<_>>()
                .join(",");
            format!("^{}({})", self.name, subs)
        }
    }

    /// Parse from MUMPS global string
    pub fn from_string(s: &str) -> Result<Self, String> {
        if !s.starts_with('^') {
            return Err("Global must start with ^".to_string());
        }

        let rest = &s[1..];
        if let Some(pos) = rest.find('(') {
            let name = rest[..pos].to_string();
            let subscripts_str = &rest[pos + 1..];
            if !subscripts_str.ends_with(')') {
                return Err("Invalid global format".to_string());
            }
            let subscripts_str = &subscripts_str[..subscripts_str.len() - 1];
            let subscripts: Vec<String> = subscripts_str
                .split(',')
                .map(|s| s.trim_matches('"').to_string())
                .collect();
            Ok(Self { name, subscripts })
        } else {
            Ok(Self {
                name: rest.to_string(),
                subscripts: Vec::new(),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_global_to_string() {
        let global = Global::new("PATIENT".to_string())
            .with_subscript("123".to_string());
        assert_eq!(global.to_string(), "^PATIENT(\"123\")");
    }

    #[test]
    fn test_global_from_string() {
        let global = Global::from_string("^PATIENT(\"123\")").unwrap();
        assert_eq!(global.name, "PATIENT");
        assert_eq!(global.subscripts, vec!["123"]);
    }
}

