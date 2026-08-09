# GMAO CMMS

Sistema de Gestión de Mantenimiento (GMAO/CMMS) moderno, modular y listo para producción.

## Stack tecnológico

- **Backend:** Spring Boot 4 (Java 21) + PostgreSQL + JWT
- **Frontend:** Angular 21 + PrimeNG + PWA
- **Infraestructura:** Docker + docker-compose
- **Tests:** JUnit/Mockito (backend) + Vitest (frontend)

## Características MVP

- Autenticación JWT con roles ADMIN, MANAGER y TECH
- Gestión de órdenes de trabajo (CRUD completo)
- Gestión de activos/equipos (CRUD completo)
- Dashboard con KPIs visuales
- Interfaz responsive con modo claro/oscuro
- Soporte multi-idioma (español/inglés)
- PWA lista para instalar
- Dockerizado para despliegue sencillo

## Requisitos

- Java 21
- Node.js 20+
- Docker y docker-compose
- PostgreSQL 15 (si no usas Docker)

## Estructura del proyecto

```
gmao/
├── backend/          # Spring Boot
├── frontend/         # Angular
├── scripts/          # Scripts de inicialización
├── docker-compose.yml
├── .env
└── README.md
```

## Levantar con Docker

1. Copia y configura las variables de entorno:

```bash
cp .env.example .env
# Edita .env y genera un JWT_SECRET seguro
```

2. Levanta los servicios:

```bash
docker-compose up --build
```

3. Accede a la aplicación:

- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

## Levantar en local (desarrollo)

### Backend

```bash
cd backend
./mvnw clean package
./mvnw spring-boot:run
```

Variables de entorno necesarias:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/gmao
export SPRING_DATASOURCE_USERNAME=gmao
export SPRING_DATASOURCE_PASSWORD=gmao_pass
export JWT_SECRET=$(openssl rand -base64 32)
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

La aplicación estará disponible en http://localhost:4200

## Credenciales por defecto

| Usuario  | Contraseña | Rol     |
|----------|------------|---------|
| admin    | admin      | ADMIN   |
| manager  | admin      | MANAGER |
| tech     | admin      | TECH    |

## Endpoints principales

- `POST /api/auth/login` - Login
- `GET /api/workorders` - Listar órdenes
- `POST /api/workorders` - Crear orden
- `GET /api/workorders/{id}` - Ver orden
- `PUT /api/workorders/{id}` - Actualizar orden
- `DELETE /api/workorders/{id}` - Eliminar orden
- `GET /api/assets` - Listar activos
- `POST /api/assets` - Crear activo
- `GET /api/assets/{id}` - Ver activo
- `PUT /api/assets/{id}` - Actualizar activo
- `DELETE /api/assets/{id}` - Eliminar activo

## Ejemplo de login con curl

```bash
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

curl http://localhost:8080/api/workorders \
  -H "Authorization: Bearer $TOKEN"
```

## Tests

### Backend

```bash
cd backend
./mvnw test
```

### Frontend

```bash
cd frontend
npm test
```

## Próximas funcionalidades

- Checklists dinámicos en órdenes de trabajo
- Firma digital de técnicos
- Notificaciones push
- Métricas avanzadas y reportes
- Almacenamiento S3 para evidencias
- Módulo de inventario completo
- Mantenimiento preventivo programado

## Licencia

Proyecto privado - GMAO CMMS
