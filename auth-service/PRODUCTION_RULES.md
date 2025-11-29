# Production Code Rules

This document outlines the coding standards and rules enforced in this codebase for production-ready code.

## Error Handling

### ❌ Forbidden in Production Code

- **`unwrap()`** - Never use in production code. Always handle errors explicitly.
- **`expect()`** - Never use in production code. Use proper error handling instead.
- **`panic!()`** - Never use in production code. Use proper error types.
- **`unreachable!()`** - Only use when absolutely certain, prefer exhaustive matching.

### ✅ Allowed in Test Code

- **`unwrap()`** - OK in `#[test]` functions and test modules
- **`expect()`** - OK in `#[test]` functions with descriptive messages
- **`panic!()`** - OK in tests for testing panic behavior

### ✅ Production Code Patterns

```rust
// ❌ BAD - Production code
let value = result.unwrap();

// ✅ GOOD - Production code
let value = result.map_err(|e| AppError::Internal(format!("Failed: {}", e)))?;

// ✅ GOOD - Test code
#[test]
fn test_something() {
    let value = result.unwrap(); // OK in tests
}
```

## Error Propagation

Always use `?` operator for error propagation:

```rust
// ✅ GOOD
pub fn do_something() -> AppResult<()> {
    let data = read_file("path")?;
    process(data)?;
    Ok(())
}
```

## Type Safety

- Use `Result<T, E>` for operations that can fail
- Use `Option<T>` for nullable values
- Never use `unwrap()` to extract values
- Use pattern matching or `?` operator

## Async Code

- Always handle `await` errors properly
- Use `?` operator for error propagation in async functions
- Never use `unwrap()` on futures

## Security

- Never log sensitive data (passwords, keys, tokens)
- Always validate input data
- Use proper encryption for sensitive data
- Never hardcode secrets

## Performance

- Avoid unnecessary allocations
- Use appropriate data structures
- Profile before optimizing
- Use `clippy` warnings for performance hints

## Code Quality

- Keep functions small and focused
- Use descriptive names
- Add documentation for public APIs
- Write tests for critical paths

## Clippy Rules

Run `cargo clippy` before committing. The following are enforced:

- `unwrap_used` - Deny in production, allow in tests
- `expect_used` - Deny in production, allow in tests
- `panic` - Deny in production
- `unused_must_use` - Warn
- `cognitive_complexity` - Warn if > 30
- `too_many_arguments` - Warn if > 7
- `too_many_lines` - Warn if > 1000

## Testing

- Write unit tests for all public functions
- Write integration tests for API endpoints
- Use `unwrap()` freely in test code
- Test error cases explicitly

## Documentation

- Document all public APIs
- Use `///` for public documentation
- Use `//` for internal comments
- Include examples in documentation

## Examples

### Good Production Code

```rust
pub fn process_data(input: &str) -> AppResult<ProcessedData> {
    let parsed = parse_input(input)
        .map_err(|e| AppError::Validation(format!("Invalid input: {}", e)))?;
    
    let processed = transform(parsed)
        .map_err(|e| AppError::Internal(format!("Processing failed: {}", e)))?;
    
    Ok(processed)
}
```

### Good Test Code

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_data() {
        let input = "test data";
        let result = process_data(input).unwrap();
        assert_eq!(result.value, "expected");
    }
}
```

