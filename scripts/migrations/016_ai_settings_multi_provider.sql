DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '016_ai_settings_multi_provider') THEN
        ALTER TABLE ai_settings ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE;

        ALTER TABLE ai_settings ADD CONSTRAINT uq_ai_settings_provider UNIQUE (provider);

        UPDATE ai_settings SET is_active = TRUE
        WHERE id = (SELECT id FROM ai_settings ORDER BY id LIMIT 1);

        CREATE UNIQUE INDEX uq_ai_settings_one_active
        ON ai_settings (is_active) WHERE is_active;

        CREATE TABLE ai_module_config (
            id BIGINT PRIMARY KEY,
            enabled BOOLEAN NOT NULL DEFAULT TRUE,
            updated_by VARCHAR(50),
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO ai_module_config (id, enabled)
        SELECT 1, COALESCE((SELECT enabled FROM ai_settings ORDER BY id LIMIT 1), TRUE);

        ALTER TABLE ai_settings DROP COLUMN enabled;

        INSERT INTO schema_migrations (version) VALUES ('016_ai_settings_multi_provider');
    END IF;
END $$;