# Code Standards and Production Rules

## Error Handling

### Production Code Rules

**❌ NEVER use in production code:**
- `unwrap()` - Always handle errors explicitly
- `expect()` - Use proper error handling instead  
- `panic!()` - Use proper error types
- `unreachable!()` - Only when absolutely certain

**✅ OK in test code:**
- `unwrap()` - Fine in `#[test]` functions
- `expect()` - Fine in tests with descriptive messages
- `panic!()` - OK for testing panic behavior

### Example

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

## Running Lints

```bash
# Check for unwrap/expect usage (will warn, tests are OK)
cargo clippy -- -W clippy::unwrap_used -W clippy::expect_used

# Full clippy check
cargo clippy --all-targets --all-features

# Format code
cargo fmt
```

## Important Rules

1. **Error Propagation**: Always use `?` operator
2. **Type Safety**: Use `Result<T, E>` for fallible operations
3. **Security**: Never log sensitive data
4. **Documentation**: Document all public APIs
5. **Testing**: Write tests for critical paths

See `PRODUCTION_RULES.md` for detailed guidelines.

