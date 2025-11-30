use shared::infrastructure::database::migrations::MigrationConfig;

#[test]
fn test_migration_config_defaults() {
    let config = MigrationConfig::default();
    assert_eq!(config.query_timeout.as_secs(), 30);
    assert_eq!(config.statement_delay.as_millis(), 10);
    assert_eq!(config.max_retries, 3);
    assert_eq!(config.retry_delay_base.as_millis(), 100);
}

#[test]
fn test_migration_config_custom() {
    let config = MigrationConfig {
        query_timeout: std::time::Duration::from_secs(60),
        statement_delay: std::time::Duration::from_millis(50),
        max_retries: 5,
        retry_delay_base: std::time::Duration::from_millis(200),
    };
    assert_eq!(config.query_timeout.as_secs(), 60);
    assert_eq!(config.statement_delay.as_millis(), 50);
    assert_eq!(config.max_retries, 5);
    assert_eq!(config.retry_delay_base.as_millis(), 200);
}

#[test]
fn test_parse_simple_statements() {
    let sql = "CREATE TABLE users (id INT); CREATE TABLE roles (id INT);";
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 2);
    assert!(statements[0].contains("CREATE TABLE users"));
    assert!(statements[1].contains("CREATE TABLE roles"));
}

#[test]
fn test_parse_with_dollar_quotes() {
    let sql = r#"
        CREATE FUNCTION test_func() RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    "#;
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 1);
    assert!(statements[0].contains("CREATE FUNCTION"));
    assert!(statements[0].contains("$$"));
    assert!(statements[0].contains("RETURN NEW"));
}

#[test]
fn test_parse_do_block() {
    let sql = r#"
        DO $$ 
        BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test') THEN
                DROP TABLE test;
            END IF;
        END $$;
    "#;
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 1);
    assert!(statements[0].contains("DO $$"));
    assert!(statements[0].contains("IF EXISTS"));
}

#[test]
fn test_parse_tagged_dollar_quotes() {
    let sql = r#"
        CREATE FUNCTION test() RETURNS TEXT AS $func$
        SELECT 'test';
        $func$ LANGUAGE sql;
    "#;
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 1);
    assert!(statements[0].contains("CREATE FUNCTION"));
    assert!(statements[0].contains("$func$"));
}

#[test]
fn test_parse_with_comments() {
    let sql = r#"
        -- This is a comment
        CREATE TABLE users (id INT);
        -- Another comment
        CREATE TABLE roles (id INT);
    "#;
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 2);
    assert!(!statements[0].contains("--"));
    assert!(!statements[1].contains("--"));
}

#[test]
fn test_parse_empty_file() {
    let sql = "";
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 0);
}

#[test]
fn test_parse_multiline_function() {
    let sql = r#"
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            NEW.version = OLD.version + 1;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    "#;
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 2);
    assert!(statements[0].contains("CREATE OR REPLACE FUNCTION"));
    assert!(statements[1].contains("CREATE TRIGGER"));
}

#[test]
fn test_migration_config_defaults() {
    let config = MigrationConfig::default();
    assert_eq!(config.query_timeout.as_secs(), 30);
    assert_eq!(config.statement_delay.as_millis(), 10);
    assert_eq!(config.max_retries, 3);
    assert_eq!(config.retry_delay_base.as_millis(), 100);
}

#[test]
fn test_parse_complex_migration() {
    let sql = r#"
        -- Migration: Add audit fields
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS request_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
        
        CREATE INDEX IF NOT EXISTS idx_users_request_id ON users(request_id);
        
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    "#;
    let statements = parse_sql_statements(sql);
    assert_eq!(statements.len(), 3);
    assert!(statements[0].contains("ALTER TABLE"));
    assert!(statements[1].contains("CREATE INDEX"));
    assert!(statements[2].contains("CREATE OR REPLACE FUNCTION"));
}

