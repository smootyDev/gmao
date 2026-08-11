CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(50),
    department VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES locations(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    system_root BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS asset_types (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criticality VARCHAR(20),
    status VARCHAR(20),
    location VARCHAR(255),
    serial_number VARCHAR(100),
    hours_of_use DOUBLE PRECISION,
    purchase_date DATE
);

ALTER TABLE assets ADD COLUMN IF NOT EXISTS location_id BIGINT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS type_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_location'
    ) THEN
        ALTER TABLE assets
            ADD CONSTRAINT fk_assets_location FOREIGN KEY (location_id) REFERENCES locations(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_type'
    ) THEN
        ALTER TABLE assets
            ADD CONSTRAINT fk_assets_type FOREIGN KEY (type_id) REFERENCES asset_types(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS work_orders (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    priority INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    asset_id BIGINT REFERENCES assets(id),
    assigned_to BIGINT REFERENCES users(id),
    estimated_hours DOUBLE PRECISION
);

-- Datos de prueba
INSERT INTO users (username, employee_code, first_name, last_name, email, password, role) VALUES
('admin', 'EMP-001', 'Administrador', 'Sistema', 'admin@gmao.local', '$2a$10$q652AlQM1nRKBMWt5IG.nO1xmF4mnmZye1cQDcNCg.PpXNFSMJux6', 'ADMIN'),
('manager', 'EMP-002', 'Manager', 'Mantenimiento', 'manager@gmao.local', '$2a$10$q652AlQM1nRKBMWt5IG.nO1xmF4mnmZye1cQDcNCg.PpXNFSMJux6', 'MANAGER'),
('tech', 'EMP-003', 'Técnico', 'Mantenimiento', 'tech@gmao.local', '$2a$10$q652AlQM1nRKBMWt5IG.nO1xmF4mnmZye1cQDcNCg.PpXNFSMJux6', 'TECH');

INSERT INTO locations (code, name, description, system_root) VALUES
('EMPRESA', 'Empresa', 'Raíz de la jerarquía de localizaciones', TRUE),
('PLANTA-BAJA', 'Planta baja', 'Zona principal de producción', FALSE),
('TALLER', 'Taller', 'Taller de mantenimiento', FALSE),
('NAVE-2', 'Nave 2', 'Zona logística y transporte', FALSE)
ON CONFLICT (code) DO NOTHING;

UPDATE locations child
SET parent_id = root.id
FROM locations root
WHERE root.code = 'EMPRESA'
  AND child.code <> 'EMPRESA'
  AND child.parent_id IS NULL;

UPDATE locations SET system_root = TRUE WHERE code = 'EMPRESA';

INSERT INTO asset_types (code, name, description) VALUES
('EQUIPMENT', 'Equipo', 'Equipo principal de producción o servicio (ej.: bomba, compresor, motor, generador, máquina de corte, sistema HVAC, etc.)'),
('SUBEQUIPMENT', 'Subequipo', 'Elemento funcional dependiente de un equipo principal (ej.: motor de bomba, ventilador de HVAC, unidad de control, módulo de filtración, cabezal de corte, etc.)'),
('COMPONENT', 'Componente', 'Pieza o componente reemplazable dentro de un equipo (ej.: rodamiento, filtro, sensor, correa, válvula, cartucho de lubricación, etc.)'),
('INSTALLATION', 'Instalación', 'Infraestructura técnica fija del edificio o planta (ej.: instalación eléctrica, red de aire comprimido, sistema de climatización central, fontanería, sistema contra incendios, ventilación industrial, etc.)'),
('VEHICLE', 'Vehículo', 'Medio de transporte interno o externo (ej.: carretilla elevadora, furgoneta de servicio, camión, vehículo eléctrico interno, transpaleta motorizada, etc.)'),
('TOOL', 'Herramienta', 'Herramienta o equipo auxiliar usado en tareas de mantenimiento (ej.: llave dinamométrica, taladro, multímetro, soldador, gato hidráulico, equipo de diagnóstico, etc.)'),
('FACILITY', 'Edificio o zona', 'Instalación física o área operativa de la planta (ej.: nave industrial, almacén, sala eléctrica, taller, laboratorio, zona de carga y descarga, etc.)'),
('OTHER', 'Otro', 'Activo no clasificado en otras categorías (ej.: mobiliario técnico, equipos experimentales, dispositivos temporales, elementos menores de obra civil, etc.)')
ON CONFLICT (code) DO NOTHING;

INSERT INTO assets (name, description, criticality, status, location, serial_number, hours_of_use, purchase_date) VALUES
('Bomba principal', 'Bomba principal de producción', 'HIGH', 'OPERATIVE', 'Planta baja', 'BP-001', 1250.5, '2022-03-15'),
('Compresor A', 'Compresor de aire', 'MEDIUM', 'OPERATIVE', 'Taller', 'CA-002', 3400.0, '2021-07-20'),
('Cinta transportadora', 'Cinta transportadora de la nave', 'HIGH', 'MAINTENANCE', 'Nave 2', 'CC-003', 8900.0, '2020-11-10');

UPDATE assets a
SET location_id = l.id
FROM locations l
WHERE a.location_id IS NULL AND a.location = l.name;

UPDATE assets a
SET type_id = t.id
FROM asset_types t
WHERE a.type_id IS NULL
  AND t.code = CASE
    WHEN a.name ILIKE '%cinta%' OR a.name ILIKE '%vehículo%' OR a.name ILIKE '%vehiculo%' THEN 'VEHICLE'
    ELSE 'EQUIPMENT'
  END;

INSERT INTO work_orders (title, description, status, priority, asset_id, assigned_to, estimated_hours) VALUES
('Reparar fuga bomba principal', 'Fuga detectada en sello mecánico', 'OPEN', 1, 1, 3, 2.5),
('Mantenimiento compresor A', 'Revisión de filtros y aceite', 'ASSIGNED', 2, 2, 3, 4.0),
('Lubricación cinta transportadora', 'Aplicar grasa a rodillos', 'CLOSED', 3, 3, 3, 1.5);
