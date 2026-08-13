CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '009_inventory_items') THEN
        CREATE TABLE inventory_items (
            id BIGSERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(50),
            unit VARCHAR(20),
            minimum_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
            current_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
            location_id BIGINT,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            client_id VARCHAR(36)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_items_code ON inventory_items(code);

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inventory_items_location') THEN
            ALTER TABLE inventory_items
                ADD CONSTRAINT fk_inventory_items_location FOREIGN KEY (location_id) REFERENCES locations(id);
        END IF;

        INSERT INTO schema_migrations (version) VALUES ('009_inventory_items');
    END IF;
END $$;
