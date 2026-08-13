CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '011_preventive_plans') THEN
        CREATE TABLE preventive_plans (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            asset_id BIGINT NOT NULL,
            frequency_days INTEGER NOT NULL,
            last_run_at TIMESTAMP,
            next_due_date DATE,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            client_id VARCHAR(36)
        );

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_preventive_plans_asset') THEN
            ALTER TABLE preventive_plans
                ADD CONSTRAINT fk_preventive_plans_asset FOREIGN KEY (asset_id) REFERENCES assets(id);
        END IF;

        ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS preventive_plan_id BIGINT;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_work_orders_preventive_plan') THEN
            ALTER TABLE work_orders
                ADD CONSTRAINT fk_work_orders_preventive_plan FOREIGN KEY (preventive_plan_id)
                REFERENCES preventive_plans(id);
        END IF;

        INSERT INTO schema_migrations (version) VALUES ('011_preventive_plans');
    END IF;
END $$;
