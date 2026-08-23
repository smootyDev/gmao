DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '017_work_order_traceability') THEN
        ALTER TABLE work_orders ADD COLUMN created_by BIGINT REFERENCES users(id);
        ALTER TABLE work_orders ADD COLUMN actual_hours DOUBLE PRECISION;
        INSERT INTO schema_migrations (version) VALUES ('017_work_order_traceability');
    END IF;
END $$;