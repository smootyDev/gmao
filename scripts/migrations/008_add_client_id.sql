CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '008_add_client_id') THEN
        ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS client_id VARCHAR(36);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS client_id VARCHAR(36);
        ALTER TABLE asset_types ADD COLUMN IF NOT EXISTS client_id VARCHAR(36);
        ALTER TABLE locations ADD COLUMN IF NOT EXISTS client_id VARCHAR(36);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id VARCHAR(36);

        INSERT INTO schema_migrations (version) VALUES ('008_add_client_id');
    END IF;
END $$;
