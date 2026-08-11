# GMAO CMMS

Sistema de Gestión de Mantenimiento (GMAO/CMMS) moderno, modular y listo para producción.

## Stack tecnológico

- **Backend:** Spring Boot 4.1 (Java 21) + PostgreSQL + JWT + MapStruct
- **Frontend:** Angular 21 + PrimeNG + PWA (service worker)
- **Infraestructura:** Docker + docker-compose
- **Tests:** JUnit/Mockito (backend) + Vitest (frontend)

## Características MVP

Estado actual de la implementación:

| Funcionalidad | Estado |
|---|---|
| Autenticación JWT con roles ADMIN, MANAGER y TECH | ✅ Implementado |
| Gestión de órdenes de trabajo (CRUD completo) | ✅ Implementado |
| Gestión de activos/equipos (CRUD completo) | ✅ Implementado |
| Gestión de tipos de activo (CRUD) | ✅ Implementado |
| Gestión de ubicaciones (CRUD) | ✅ Implementado |
| Gestión de usuarios (CRUD) | ✅ Implementado |
| Dashboard con 6 KPIs visuales | ✅ Implementado |
| Interfaz responsive con modo claro/oscuro | ✅ Implementado |
| Soporte multi-idioma (español/inglés) | ✅ Implementado |
| PWA instalable (manifest + service worker) | ✅ Implementado |
| Sincronización offline | 🔜 Pendiente |
| Dockerizado para despliegue sencillo | ✅ Implementado |

## Requisitos

- Java 21
- Node.js 20+
- Docker y docker-compose
- PostgreSQL 15 (si no usas Docker)

## Estructura del proyecto

```
gmao/
├── backend/                    # Spring Boot 4.1
│   └── src/main/java/com/gmao/backend/
│       ├── auth/               # Autenticación, usuarios y roles
│       ├── workorders/         # Órdenes de trabajo
│       ├── assets/             # Activos/equipos
│       ├── assettypes/         # Tipos de activo
│       ├── locations/          # Ubicaciones
│       ├── storage/            # Almacenamiento de archivos
│       └── config/             # Configuración de seguridad
├── frontend/                   # Angular 21 + PrimeNG
│   └── src/app/
│       ├── core/               # Guards, interceptors, pipes, servicios
│       ├── features/           # login, dashboard, workorders, assets, asset-types, locations, users
│       └── layout/             # Layout (Verona): topbar, menu, sidebar, footer
├── scripts/                    # Scripts de inicialización y migraciones SQL
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
- `GET /api/asset-types` - Listar tipos de activo
- `POST /api/asset-types` - Crear tipo de activo
- `GET /api/asset-types/{id}` - Ver tipo de activo
- `PUT /api/asset-types/{id}` - Actualizar tipo de activo
- `DELETE /api/asset-types/{id}` - Eliminar tipo de activo
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/{id}` - Ver usuario
- `PUT /api/users/{id}` - Actualizar usuario
- `DELETE /api/users/{id}` - Eliminar usuario
- `GET /api/locations` - Listar localizaciones
- `POST /api/locations` - Crear localización
- `GET /api/locations/{id}` - Ver localización
- `PUT /api/locations/{id}` - Actualizar localización
- `DELETE /api/locations/{id}` - Eliminar localización

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

Cobertura actual: `WorkOrderServiceTest`, `AssetTypeServiceTest`, `LocationServiceTest` y prueba de contexto de la aplicación.

### Frontend

```bash
cd frontend
npm test
```

Cobertura actual: specs de `app`, `user-list`, `workorder-list`, `layout-configurator` y `layout.service`.

## Próximas funcionalidades

### MVP pendiente

- Sincronización offline de datos

### Post-MVP

- Checklists dinámicos en órdenes de trabajo
- Firma digital de técnicos
- Notificaciones push
- Métricas avanzadas y reportes
- Almacenamiento S3 para evidencias
- Módulo de inventario completo
- Mantenimiento preventivo programado

## Licencia

Proyecto privado - GMAO CMMS
