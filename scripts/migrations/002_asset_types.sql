-- Normalizes the legacy assets.type text field into a reusable catalog.
-- Safe to run on every Docker start after the migration marker is stored.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '002_asset_types') THEN
        CREATE TABLE IF NOT EXISTS asset_types (
            id BIGSERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            active BOOLEAN NOT NULL DEFAULT TRUE
        );

        ALTER TABLE assets ADD COLUMN IF NOT EXISTS type_id BIGINT;
        UPDATE assets SET type_id = NULL WHERE type_id IS NULL;

        INSERT INTO asset_types (code, name, description, active) VALUES
        ('EQUIPMENT', 'Equipo', 'Equipo principal de producción o servicio (ej.: bomba, compresor, motor, generador, máquina de corte, sistema HVAC, etc.)', TRUE),
        ('SUBEQUIPMENT', 'Subequipo', 'Elemento funcional dependiente de un equipo principal (ej.: motor de bomba, ventilador de HVAC, unidad de control, módulo de filtración, cabezal de corte, etc.)', TRUE),
        ('COMPONENT', 'Componente', 'Pieza o componente reemplazable dentro de un equipo (ej.: rodamiento, filtro, sensor, correa, válvula, cartucho de lubricación, etc.)', TRUE),
        ('INSTALLATION', 'Instalación', 'Infraestructura técnica fija del edificio o planta (ej.: instalación eléctrica, red de aire comprimido, sistema de climatización central, fontanería, sistema contra incendios, ventilación industrial, etc.)', TRUE),
        ('VEHICLE', 'Vehículo', 'Medio de transporte interno o externo (ej.: carretilla elevadora, furgoneta de servicio, camión, vehículo eléctrico interno, transpaleta motorizada, etc.)', TRUE),
        ('TOOL', 'Herramienta', 'Herramienta o equipo auxiliar usado en tareas de mantenimiento (ej.: llave dinamométrica, taladro, multímetro, soldador, gato hidráulico, equipo de diagnóstico, etc.)', TRUE),
        ('FACILITY', 'Edificio o zona', 'Instalación física o área operativa de la planta (ej.: nave industrial, almacén, sala eléctrica, taller, laboratorio, zona de carga y descarga, etc.)', TRUE),
        ('OTHER', 'Otro', 'Activo no clasificado en otras categorías (ej.: mobiliario técnico, equipos experimentales, dispositivos temporales, elementos menores de obra civil, etc.)', TRUE)
        ON CONFLICT (code) DO NOTHING;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'assets' AND column_name = 'type'
        ) THEN
            EXECUTE $$
                UPDATE assets a
                SET type_id = t.id
                FROM asset_types t
                WHERE a.type_id IS NULL
                  AND t.code = CASE
                    WHEN lower(a.type) IN ('transporte', 'vehículo', 'vehiculo') THEN 'VEHICLE'
                    WHEN a.type IS NULL OR trim(a.type) = '' THEN 'OTHER'
                    ELSE 'EQUIPMENT'
                  END
            $$;
        ELSE
            UPDATE assets
            SET type_id = (SELECT id FROM asset_types WHERE code = 'OTHER')
            WHERE type_id IS NULL;
        END IF;

        ALTER TABLE assets
            ADD CONSTRAINT fk_assets_type FOREIGN KEY (type_id) REFERENCES asset_types(id);

        INSERT INTO schema_migrations (version) VALUES ('002_asset_types');
    END IF;
END $$;
