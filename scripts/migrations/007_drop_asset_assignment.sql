CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '007_drop_asset_assignment') THEN
        ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_assigned_user;
        ALTER TABLE assets DROP COLUMN IF EXISTS assigned_to;

        INSERT INTO schema_migrations (version) VALUES ('007_drop_asset_assignment');
    END IF;
END $$;
