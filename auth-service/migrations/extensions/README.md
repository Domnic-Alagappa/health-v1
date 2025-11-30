# PostgreSQL Extensions

This folder contains migration files for PostgreSQL extensions that may be needed for the auth service.

## Current Status

Currently, no extensions are required. The schema uses:
- `gen_random_uuid()` - Built-in in PostgreSQL 13+, otherwise requires `pgcrypto` extension
- `JSONB` type - Built-in PostgreSQL type

## Future Extensions

If you need to add PostgreSQL extensions in the future:

1. Create a migration file in this folder following the naming convention: `0001_extension_name.up.sql` and `0001_extension_name.down.sql`
2. Document the extension in `../SCHEMA_INDEX.md`
3. Update the main migration sequence if needed

### Common Extensions to Consider

- **pgcrypto** - Cryptographic functions (if PostgreSQL < 13 for UUID generation)
- **pg_trgm** - Trigram matching for text search
- **btree_gin** - GIN indexes for certain queries
- **uuid-ossp** - UUID generation functions (if not using pgcrypto)

## Usage

Extensions should be enabled before they are used in other migrations. If an extension is critical, consider adding it as an early migration.

