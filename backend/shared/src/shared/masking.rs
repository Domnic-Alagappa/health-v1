/// Mask sensitive field values for display
pub fn mask_field(value: &str, mask_char: char, visible_chars: usize) -> String {
    if value.len() <= visible_chars {
        return value.to_string();
    }

    let visible = &value[value.len() - visible_chars..];
    let masked_len = value.len() - visible_chars;
    let masked = mask_char.to_string().repeat(masked_len);

    format!("{}{}", masked, visible)
}

/// Mask email addresses
pub fn mask_email(email: &str) -> String {
    if let Some(at_pos) = email.find('@') {
        let (local, domain) = email.split_at(at_pos);
        let masked_local = mask_field(local, '*', 2);
        format!("{}@{}", masked_local, domain)
    } else {
        mask_field(email, '*', 2)
    }
}

/// Mask phone numbers
pub fn mask_phone(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() >= 4 {
        let last_four = &digits[digits.len() - 4..];
        format!("***-***-{}", last_four)
    } else {
        mask_field(phone, '*', 0)
    }
}

/// Mask SSN
pub fn mask_ssn(ssn: &str) -> String {
    let digits: String = ssn.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() == 9 {
        format!("***-**-{}", &digits[digits.len() - 4..])
    } else {
        mask_field(ssn, '*', 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mask_field() {
        assert_eq!(mask_field("1234567890", '*', 4), "******7890");
        assert_eq!(mask_field("short", '*', 4), "short");
    }

    #[test]
    fn test_mask_email() {
        assert_eq!(mask_email("test@example.com"), "**st@example.com");
    }

    #[test]
    fn test_mask_phone() {
        assert_eq!(mask_phone("123-456-7890"), "***-***-7890");
    }

    #[test]
    fn test_mask_ssn() {
        assert_eq!(mask_ssn("123-45-6789"), "***-**-6789");
    }
}

