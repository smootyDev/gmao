-- Repairs descriptions written through a non-UTF-8 client.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '005_repair_asset_type_descriptions') THEN
        UPDATE asset_types SET description = CASE code
            WHEN 'COMPONENT' THEN 'Pieza o componente reemplazable dentro de un equipo (ej.: rodamiento, filtro, sensor, correa, válvula, cartucho de lubricación, etc.)'
            WHEN 'FACILITY' THEN 'Instalación física o área operativa de la planta (ej.: nave industrial, almacén, sala eléctrica, taller, laboratorio, zona de carga y descarga, etc.)'
            WHEN 'EQUIPMENT' THEN 'Equipo principal de producción o servicio (ej.: bomba, compresor, motor, generador, máquina de corte, sistema HVAC, etc.)'
            WHEN 'TOOL' THEN 'Herramienta o equipo auxiliar usado en tareas de mantenimiento (ej.: llave dinamométrica, taladro, multímetro, soldador, gato hidráulico, equipo de diagnóstico, etc.)'
            WHEN 'INSTALLATION' THEN 'Infraestructura técnica fija del edificio o planta (ej.: instalación eléctrica, red de aire comprimido, sistema de climatización central, fontanería, sistema contra incendios, ventilación industrial, etc.)'
            WHEN 'OTHER' THEN 'Activo no clasificado en otras categorías (ej.: mobiliario técnico, equipos experimentales, dispositivos temporales, elementos menores de obra civil, etc.)'
            WHEN 'SUBEQUIPMENT' THEN 'Elemento funcional dependiente de un equipo principal (ej.: motor de bomba, ventilador de HVAC, unidad de control, módulo de filtración, cabezal de corte, etc.)'
            WHEN 'VEHICLE' THEN 'Medio de transporte interno o externo (ej.: carretilla elevadora, furgoneta de servicio, camión, vehículo eléctrico interno, transpaleta motorizada, etc.)'
            ELSE description
        END;

        INSERT INTO schema_migrations (version) VALUES ('005_repair_asset_type_descriptions');
    END IF;
END $$;
