# Authentication & Authorization Service

Enterprise-grade authentication and authorization service built with Rust, featuring:

- **OIDC Authentication**: OpenID Connect compliant authentication
- **Zanzibar Authorization**: Relationship-based access control
- **Encryption**: Master key + individual DEKs (Data Encryption Keys)
- **CRDT Sync**: Conflict-free replicated data types for local/live sync
- **MUMPS-style Database**: Hierarchical data access patterns
- **RLS Integration**: Row Level Security with Zanzibar
- **Multi-Cloud Support**: Configurable providers for AWS, GCP, Azure
- **Clean Architecture**: Domain-driven design with clear separation of concerns

## Architecture

This service follows clean architecture principles with four main layers:

1. **Domain Layer**: Core business logic and entities
2. **Infrastructure Layer**: External dependencies (database, encryption, storage)
3. **Application Layer**: Use cases and DTOs
4. **Presentation Layer**: API handlers and middleware

## Features

### Security
- Master key encryption for DEKs
- Individual DEK per user/entity
- Field-level encryption
- Encrypted database columns
- Masked field display
- Signed JWT tokens
- Token revocation

### Authorization
- Zanzibar-style relationship-based access control
- ACLs for pages/APIs
- PostgreSQL Row Level Security (RLS)
- Permission caching

### Data Management
- SQLite (local) + PostgreSQL (live)
- CRDT-based conflict resolution
- Hybrid sync (real-time + offline queue)
- MUMPS-style hierarchical access patterns

### Providers (Configurable)
- **KMS**: HashiCorp Vault, AWS KMS, GCP KMS, Azure Key Vault
- **Storage**: AWS S3, GCP Cloud Storage, Azure Blob Storage, Local FS
- **Deployment**: AWS, GCP, Azure, or local

## Getting Started

1. Copy `.env.example` to `.env` and configure
2. Set up PostgreSQL database
3. Run migrations: `cargo run --bin migrate`
4. Start server: `cargo run`

## Configuration

All configuration is done through environment variables. See `.env.example` for details.

## Development

```bash
# Run in development mode
cargo run

# Run tests
cargo test

# Run with logging
RUST_LOG=debug cargo run
```

## License

Proprietary

