CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '006_users_assets_assignment') THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code VARCHAR(30);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);

        UPDATE users SET employee_code = COALESCE(employee_code, 'EMP-' || id::text);
        UPDATE users SET first_name = COALESCE(first_name, username);
        UPDATE users SET last_name = COALESCE(last_name, '');

        ALTER TABLE users ALTER COLUMN employee_code SET NOT NULL;
        ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
        ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS ux_users_employee_code ON users(employee_code);

        ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigned_to BIGINT;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_assigned_user') THEN
            ALTER TABLE assets ADD CONSTRAINT fk_assets_assigned_user FOREIGN KEY (assigned_to) REFERENCES users(id);
        END IF;

        INSERT INTO schema_migrations (version) VALUES ('006_users_assets_assignment');
    END IF;
END $$;
