CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '010_work_order_items') THEN
        CREATE TABLE work_order_items (
            id BIGSERIAL PRIMARY KEY,
            work_order_id BIGINT NOT NULL,
            inventory_item_id BIGINT NOT NULL,
            quantity DOUBLE PRECISION NOT NULL DEFAULT 1
        );

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_work_order_items_work_order') THEN
            ALTER TABLE work_order_items
                ADD CONSTRAINT fk_work_order_items_work_order FOREIGN KEY (work_order_id)
                REFERENCES work_orders(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_work_order_items_inventory') THEN
            ALTER TABLE work_order_items
                ADD CONSTRAINT fk_work_order_items_inventory FOREIGN KEY (inventory_item_id)
                REFERENCES inventory_items(id);
        END IF;

        INSERT INTO schema_migrations (version) VALUES ('010_work_order_items');
    END IF;
END $$;
