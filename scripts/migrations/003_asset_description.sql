-- Replaces the legacy assets.type text column with a free-text description.
-- Asset classification is provided exclusively by assets.type_id.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '003_asset_description') THEN
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS description TEXT;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'assets' AND column_name = 'type'
        ) THEN
            EXECUTE 'UPDATE assets SET description = type WHERE description IS NULL';
            ALTER TABLE assets DROP COLUMN type;
        END IF;

        INSERT INTO schema_migrations (version) VALUES ('003_asset_description');
    END IF;
END $$;
