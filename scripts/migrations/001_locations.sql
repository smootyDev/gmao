-- Rebuilds the locations hierarchy once so EMPRESA is always id 1.
-- Safe to run on every Docker start after the migration marker is stored.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_locations') THEN
        ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_location;
        DROP TABLE IF EXISTS locations CASCADE;

        CREATE TABLE locations (
            id BIGSERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            parent_id BIGINT REFERENCES locations(id),
            active BOOLEAN NOT NULL DEFAULT TRUE,
            system_root BOOLEAN NOT NULL DEFAULT FALSE
        );

        ALTER TABLE assets ADD COLUMN IF NOT EXISTS location_id BIGINT;
        UPDATE assets SET location_id = NULL;

        INSERT INTO locations (code, name, description, system_root) VALUES
        ('EMPRESA', 'Empresa', 'Raíz de la jerarquía de localizaciones', TRUE),
        ('PLANTA-BAJA', 'Planta baja', 'Zona principal de producción', FALSE),
        ('TALLER', 'Taller', 'Taller de mantenimiento', FALSE),
        ('NAVE-2', 'Nave 2', 'Zona logística y transporte', FALSE);

        UPDATE locations
        SET parent_id = (SELECT id FROM locations WHERE code = 'EMPRESA')
        WHERE code <> 'EMPRESA';

        UPDATE assets a
        SET location_id = l.id
        FROM locations l
        WHERE a.location = l.name;

        ALTER TABLE assets
            ADD CONSTRAINT fk_assets_location FOREIGN KEY (location_id) REFERENCES locations(id);

        INSERT INTO schema_migrations (version) VALUES ('001_locations');
    END IF;
END $$;
