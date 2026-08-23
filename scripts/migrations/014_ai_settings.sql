DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '014_ai_settings') THEN
        CREATE TABLE ai_settings (
            id BIGSERIAL PRIMARY KEY,
            provider VARCHAR(30) NOT NULL DEFAULT 'openai',
            model VARCHAR(100),
            base_url VARCHAR(500),
            username VARCHAR(100),
            api_key_cipher VARCHAR(1000),
            api_key_iv VARCHAR(100),
            temperature DOUBLE PRECISION,
            max_tokens INTEGER,
            timeout_ms BIGINT NOT NULL DEFAULT 30000,
            enabled BOOLEAN NOT NULL DEFAULT FALSE,
            updated_by VARCHAR(50),
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO schema_migrations (version) VALUES ('014_ai_settings');
    END IF;
END $$;