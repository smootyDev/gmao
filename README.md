# GMAO CMMS

Sistema de Gestión de Mantenimiento (GMAO/CMMS) moderno, modular y dockerizado.

## Stack tecnológico

- **Backend:** Spring Boot 4.1 (Java 21) + PostgreSQL 15 + JWT + MapStruct
- **Frontend:** Angular 21 + PrimeNG + PWA (service worker)
- **Infraestructura:** Docker + Docker Compose
- **Tests:** JUnit/Mockito (backend) + Vitest (frontend)

## Características

| Funcionalidad | Estado |
|---|---|
| Autenticación JWT con roles ADMIN, MANAGER y TECH | ✅ |
| Órdenes de trabajo (CRUD, artículos asociados, trazabilidad de creador) | ✅ |
| Activos/equipos y tipos de activo (CRUD) | ✅ |
| Ubicaciones jerárquicas (CRUD, reordenación por arrastre) | ✅ |
| Usuarios y roles (CRUD) | ✅ |
| Inventario de piezas/repuestos, vinculado a órdenes de trabajo | ✅ |
| Mantenimiento preventivo (planes con frecuencia y generación automática de OTs) | ✅ |
| Dashboard con KPIs, gráficos (estado, tendencia mensual) y alertas | ✅ |
| Asistente de IA (chat contextual, sugerencia/priorización de OTs, resúmenes) | ✅ |
| Configuración de proveedor de IA desde la interfaz (multi-proveedor) | ✅ |
| Auditoría de operaciones (registro, filtros, retención configurable) | ✅ |
| Landing pública (`/landscape`) con la presentación de módulos, roles y stack | ✅ |
| Interfaz responsive con modo claro/oscuro y varios presets de color | ✅ |
| Soporte multi-idioma (español/inglés) | ✅ |
| PWA instalable (manifest + service worker) | ✅ |
| Sincronización offline (caché + cola de cambios) | ✅ |
| Dockerizado para despliegue desde cero con un solo comando | ✅ |

## Requisitos

Para levantar la aplicación completa con Docker (la vía recomendada) solo necesitas:

- **Docker** y **Docker Compose** (v2, el plugin `docker compose`)

Para desarrollo local sin Docker, además:

- Java 21 y Maven Wrapper (incluido, `./mvnw`)
- Node.js 20+
- Una instancia de PostgreSQL 15 accesible

## Estructura del proyecto

```
gmao/
├── backend/                    # Spring Boot 4.1
│   └── src/main/java/com/gmao/backend/
│       ├── auth/                # Autenticación, usuarios y roles
│       ├── workorders/          # Órdenes de trabajo
│       ├── assets/              # Activos/equipos
│       ├── assettypes/          # Tipos de activo
│       ├── locations/           # Ubicaciones
│       ├── inventory/           # Inventario de piezas/repuestos
│       ├── preventive/          # Planes de mantenimiento preventivo
│       ├── ai/                  # Asistente de IA y configuración de proveedor
│       ├── audit/                # Registro de auditoría
│       ├── storage/              # Almacenamiento de archivos
│       ├── security/             # JWT, filtros y matriz de acceso
│       └── config/               # Configuración de seguridad
├── frontend/                   # Angular 21 + PrimeNG
│   └── src/app/
│       ├── core/                # Guards, interceptors, pipes, servicios
│       ├── features/             # landscape (landing), auth, dashboard, workorders,
│       │                          # assets, asset-types, locations, inventory,
│       │                          # preventive, users, ai, audit
│       └── layout/               # Topbar, menú, sidebar
├── scripts/
│   ├── init-db.sql              # Esquema base + datos de ejemplo (primer arranque)
│   └── migrations/              # Migraciones incrementales (001…017)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Puesta en marcha con Docker (desde cero)

Este es el camino verificado para que alguien que se descarga el repositorio por primera vez levante la aplicación completa.

**1. Variables de entorno**

```bash
cp .env.example .env
```

El valor incluido ya funciona para probar en local. Si vas a desplegar en un entorno real, genera tu propio secreto antes:

```bash
openssl rand -base64 32
```
y sustituye `JWT_SECRET` en `.env`.

**2. Levantar todo**

```bash
docker compose up --build -d
```

Esto construye las imágenes de backend y frontend, arranca PostgreSQL, ejecuta las migraciones (`db-migrate`) y finalmente el backend y el frontend, en ese orden (el `depends_on` de cada servicio se encarga de la secuencia).

**3. Comprobar que la migración de base de datos terminó bien**

Es el paso que más merece la pena verificar, porque `db-migrate` es un contenedor que se ejecuta una vez y termina — si algo falla ahí, el backend no arrancará (o arrancará contra un esquema incompleto):

```bash
docker compose logs db-migrate
```

Debe verse `DO` (o `CREATE TABLE` / `NOTICE: ... already exists, skipping`) para cada uno de los 17 ficheros de `scripts/migrations/`, sin ninguna línea `ERROR`. Si el contenedor `db-migrate` no aparece en `docker compose ps` como `Exited (0)`, revisa el punto de **Solución de problemas** más abajo.

**4. Acceder**

- Frontend: http://localhost:4200 (abre primero la landing pública `/landscape`; pulsa *Iniciar sesión* o ve directamente a `/login`)
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432 (usuario `gmao`, contraseña `gmao_pass`, base `gmao`)

**5. Iniciar sesión**

La base de datos se siembra con tres usuarios de prueba (todos con contraseña `admin`):

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin` | ADMIN |
| `manager` | `admin` | MANAGER |
| `tech` | `admin` | TECH |

### Solución de problemas

- **`db-migrate` no aparece como `Exited (0)` o el backend no arranca con un error de Hibernate del tipo `Schema validation: missing table [...]`:** las migraciones no llegaron a aplicarse. Vuelve a lanzarlas manualmente:
  ```bash
  docker compose up db-migrate
  docker compose logs db-migrate
  ```
  Si sigue sin funcionar, puedes aplicarlas a mano, en orden, directamente contra el contenedor de base de datos:
  ```bash
  for f in scripts/migrations/*.sql; do
    docker compose exec -T db psql -U gmao -d gmao -v ON_ERROR_STOP=1 < "$f"
  done
  ```
  Son idempotentes (cada una comprueba `schema_migrations` antes de aplicarse), así que ejecutarlas de nuevo no duplica datos.
- **Puerto ya en uso (5432, 8080 o 4200):** para prevenir puertos ocupados, edita el mapeo de puertos en `docker-compose.yml` (por ejemplo `"15432:5432"`) antes de levantar.
- **Quiero partir de una base de datos limpia:** `docker compose down -v` elimina también el volumen de PostgreSQL (se pierden los datos).

## Desarrollo local (sin Docker)

### Base de datos

Necesitas un PostgreSQL 15 accesible y ejecutar `scripts/init-db.sql` seguido de todos los ficheros de `scripts/migrations/` en orden (igual que hace el contenedor `db-migrate`).

### Backend

```bash
cd backend
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/gmao
export SPRING_DATASOURCE_USERNAME=gmao
export SPRING_DATASOURCE_PASSWORD=gmao_pass
export JWT_SECRET=$(openssl rand -base64 32)
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

La aplicación estará disponible en http://localhost:4200. En este modo el frontend llama directamente a `http://localhost:8080` (no hay proxy nginx); en Docker, en cambio, nginx redirige `/api` al contenedor del backend.

## Endpoints principales

| Recurso | Ruta base |
|---|---|
| Autenticación | `POST /api/auth/login` |
| Órdenes de trabajo | `/api/workorders` |
| Activos | `/api/assets` |
| Tipos de activo | `/api/asset-types` |
| Ubicaciones | `/api/locations` |
| Usuarios | `/api/users` |
| Inventario | `/api/inventory-items` |
| Planes preventivos | `/api/preventive-plans` (+ `POST /{id}/run` para generar la OT) |
| Asistente de IA | `/api/ai/assistant/chat`, `/api/ai/workorders/suggest`, `/api/ai/workorders/prioritize`, `/api/ai/summarize`, `/api/ai/health` |
| Configuración de IA | `/api/ai/settings` (solo ADMIN) |
| Auditoría | `GET /api/audit-logs` (solo ADMIN) |

Todos (salvo login) siguen el patrón REST estándar: `GET` (lista y por id), `POST`, `PUT /{id}`, `DELETE /{id}`.

## Ejemplo de login con curl

```bash
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

curl http://localhost:8080/api/workorders \
  -H "Authorization: Bearer $TOKEN"
```

## Sincronización offline

La aplicación funciona en modo lectura/escritura sin conexión:

- **Caché local** (`localforage`): los listados (`GET`) se sirven desde caché cuando no hay red.
- **Cola outbox**: los cambios (`POST`, `PUT`, `DELETE`) se encolan localmente y se sincronizan cuando la conexión se restablece (automática o con el botón *Sincronizar* del banner).
- **Idempotencia**: cada operación envía un `clientId`; si un `create` llega con un `clientId` ya existente, el backend devuelve el registro existente en lugar de duplicarlo.
- El banner de estado informa de la conectividad y del número de operaciones pendientes de sincronizar.

La sincronización cubre siete módulos: `workorders`, `assets`, `asset-types`, `locations`, `users`, `inventory-items` y `preventive-plans`.

## Asistente de IA

El módulo de IA viene **activado por defecto con un proveedor `mock`** (no necesita clave de API ni configuración adicional para probarlo). Un ADMIN puede, desde `Administración → Configuración IA` en la interfaz (o vía `PUT /api/ai/settings`), activar y configurar un proveedor real (compatible OpenAI, Anthropic, etc.), guardando la clave de API cifrada en base de datos.

Variables de entorno relacionadas (todas opcionales, ver `backend/src/main/resources/application.yml`):

```bash
AI_ENABLED=true          # el módulo también se puede activar/desactivar desde la interfaz
AI_PROVIDER=mock         # mock | openai | anthropic | opencode
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
AI_SETTINGS_ENCRYPTION_KEY=   # clave con la que se cifra la API key guardada en BD
```

## Seguridad y roles (RBAC)

La seguridad se aplica en dos niveles: **backend (autoritativo)** mediante `@PreAuthorize` en los controllers (`@EnableMethodSecurity`) y reglas de URL en `SecurityConfig`, y **frontend (UX)** ocultando rutas y acciones según el rol (`PermissionsService` + `roleGuard`, menú de administración solo visible para ADMIN).

Los errores de autenticación/autorización devuelven JSON (`{"error": "...", "status": 401|403}`) en lugar de la página de error por defecto de Spring. El origen permitido para CORS es configurable con `APP_CORS_ALLOWED_ORIGINS` (por defecto `*`; en Docker no hace falta tocarlo porque nginx sirve el frontend y proxya `/api` al backend en el mismo origen).

| Recurso | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| Usuarios | ADMIN | ADMIN | ADMIN | ADMIN |
| Activos | todos | ADM+MAN | ADM+MAN | ADMIN |
| Tipos de activo | todos | ADM+MAN | ADM+MAN | ADMIN |
| Localizaciones | todos | ADM+MAN | ADM+MAN | ADMIN |
| Órdenes de trabajo | todos (TECH: solo asignadas) | ADM+MAN | ADM+MAN; TECH: solo asignada + transiciones | ADM+MAN |
| Inventario | todos | ADM+MAN | ADM+MAN | ADM+MAN |
| Planes preventivos (+ run) | todos | ADM+MAN | ADM+MAN | ADM+MAN |
| Asistente de IA (chat, sugerencias) | todos los autenticados | todos los autenticados | — | — |
| Configuración de IA | ADMIN | — | ADMIN | — |
| Auditoría | ADMIN | — | — | — |

Reglas de negocio clave:
- **TECH** solo ve y modifica órdenes asignadas a él; puede transicionar `ASSIGNED → IN_PROGRESS → ON_HOLD → CLOSED` y registrar horas reales, pero no cambiar prioridad, asignación, ni reabrir (`OPEN`).
- Una orden de trabajo solo puede asignarse a un usuario con rol **TECH**.
- La raíz de empresa (`systemRoot`) está protegida para los tres roles.
- `created_by` se fija en el servidor al crear la orden (trazabilidad); las históricas quedan `NULL`.

## Tests

### Backend

```bash
cd backend
./mvnw test
```

Cobertura: servicios de órdenes de trabajo, activos, tipos de activo, ubicaciones, inventario, preventivo, IA (chat, adaptadores de proveedor, configuración) y auditoría, además de una prueba de integración de la matriz de acceso por rol.

### Frontend

```bash
cd frontend
npm test
```

Cobertura: componentes de listado y formulario de todos los módulos, servicios core (autenticación, sincronización, layout/tema) e interceptores HTTP.

## Próximas funcionalidades

- Checklists dinámicos en órdenes de trabajo
- Firma digital de técnicos
- Notificaciones push
- Almacenamiento S3 para evidencias adjuntas

## Licencia

Proyecto privado - GMAO CMMS
