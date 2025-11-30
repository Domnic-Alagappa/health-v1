-- Remove schema_migrations table

DROP INDEX IF EXISTS idx_schema_migrations_executed_at;
DROP TABLE IF EXISTS schema_migrations;

