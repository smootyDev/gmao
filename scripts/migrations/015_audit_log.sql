DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '015_audit_log') THEN
        CREATE TABLE audit_logs (
            id BIGSERIAL PRIMARY KEY,
            timestamp TIMESTAMP NOT NULL,
            category VARCHAR(20) NOT NULL,
            action VARCHAR(30) NOT NULL,
            user_id BIGINT,
            username VARCHAR(50),
            role VARCHAR(20),
            entity VARCHAR(100),
            entity_id VARCHAR(100),
            method VARCHAR(10),
            path VARCHAR(500),
            ip VARCHAR(45),
            status_code INTEGER,
            request_body TEXT,
            details TEXT,
            latency_ms BIGINT
        );

        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs (category);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs (username);

        INSERT INTO schema_migrations (version) VALUES ('015_audit_log');
    END IF;
END $$;