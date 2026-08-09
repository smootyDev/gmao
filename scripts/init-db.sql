CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    criticality VARCHAR(20),
    status VARCHAR(20),
    location VARCHAR(255),
    serial_number VARCHAR(100),
    hours_of_use DOUBLE PRECISION,
    purchase_date DATE
);

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
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@gmao.local', '$2a$10$q652AlQM1nRKBMWt5IG.nO1xmF4mnmZye1cQDcNCg.PpXNFSMJux6', 'ADMIN'),
('manager', 'manager@gmao.local', '$2a$10$q652AlQM1nRKBMWt5IG.nO1xmF4mnmZye1cQDcNCg.PpXNFSMJux6', 'MANAGER'),
('tech', 'tech@gmao.local', '$2a$10$q652AlQM1nRKBMWt5IG.nO1xmF4mnmZye1cQDcNCg.PpXNFSMJux6', 'TECH');

INSERT INTO assets (name, type, criticality, status, location, serial_number, hours_of_use, purchase_date) VALUES
('Bomba principal', 'Bomba', 'HIGH', 'OPERATIVE', 'Planta baja', 'BP-001', 1250.5, '2022-03-15'),
('Compresor A', 'Compresor', 'MEDIUM', 'OPERATIVE', 'Taller', 'CA-002', 3400.0, '2021-07-20'),
('Cinta transportadora', 'Transporte', 'HIGH', 'MAINTENANCE', 'Nave 2', 'CC-003', 8900.0, '2020-11-10');

INSERT INTO work_orders (title, description, status, priority, asset_id, assigned_to, estimated_hours) VALUES
('Reparar fuga bomba principal', 'Fuga detectada en sello mecánico', 'OPEN', 1, 1, 3, 2.5),
('Mantenimiento compresor A', 'Revisión de filtros y aceite', 'ASSIGNED', 2, 2, 3, 4.0),
('Lubricación cinta transportadora', 'Aplicar grasa a rodillos', 'CLOSED', 3, 3, 3, 1.5);
