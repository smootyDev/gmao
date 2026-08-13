# Plan: Módulo de Inventario + Módulo de Preventivo

## Objetivo
Añadir al GMAO dos módulos post-MVP siguiendo los patrones existentes del proyecto (backend Spring Boot + frontend Angular/PrimeNG + PWA offline + i18n):

1. **Inventario**: catálogo de piezas/repuestos (CRUD simple).
2. **Preventivo**: planes de mantenimiento preventivo asociados a activos, con indicador de vencimiento y generación **manual** de la orden de trabajo.

Decisiones confirmadas:
- Inventario = catálogo de piezas/repuestos (sin movimientos de stock en esta versión).
- Preventivo = generación manual de OT con check de vencimiento en el listado (sin scheduler).
- Planes preventivos asociados a un activo existente.

---

## FASE 1 — Módulo de Inventario

### 1.1 Backend

Nuevo paquete `com.gmao.backend.inventory`:

| Archivo | Descripción |
|---|---|
| `entity/InventoryItem.java` | `id`, `code` (unique, 50), `name` (obligatorio), `description`, `category` (varchar 50), `unit` (varchar 20, ej. "ud", "kg"), `minimumStock` (Double), `currentStock` (Double), `locationId` (FK nullable), `active` (Boolean, default true), `clientId` (36). Tabla `inventory_items`, Lombok `@Entity @Getter @Setter @Builder` |
| `repository/InventoryItemRepository.java` | `findByCodeIgnoreCase`, `findByClientId`, `findAllByOrderByNameAsc` |
| `service/InventoryItemService.java` | Mismo patrón que `AssetTypeService`: validaciones, idempotencia por `clientId`, `ensureCodeAvailable`, delete con `DataIntegrityViolationException` |
| `controller/InventoryItemController.java` | `@RequestMapping("/api/inventory-items")`, CRUD idéntico a `AssetTypeController` |

**Migración** `scripts/migrations/009_inventory_items.sql`:
- `CREATE TABLE inventory_items (...)`.
- Índice único `ux_inventory_items_code`.
- FK opcional a `locations(id)`.
- Patrón `schema_migrations` (DO$$ / IF NOT EXISTS).

**docker-compose.yml**: añadir volumen `009_inventory_items.sql` y `-f /migrations/009_inventory_items.sql` al command de `db-migrate`.

**Tests** `backend/src/test/java/com/gmao/backend/inventory/service/InventoryItemServiceTest.java`:
- `createsActiveItem`, `rejectsDuplicateCode`, `createWithClientIdIsIdempotent`.

### 1.2 Frontend

Nuevo feature `src/app/features/inventory/`:

| Archivo | Descripción |
|---|---|
| `services/inventory-item.service.ts` | Interface `InventoryItem` + CRUD HTTP (`/api/inventory-items`) — clon de `asset.service.ts` |
| `components/inventory-list.component.{ts,html,scss}` | `p-table` con filtros, badge "stock bajo" cuando `currentStock <= minimumStock`, botones nuevo/editar/eliminar, suscripción a `syncCompleted` |
| `components/inventory-form.component.{ts,html,scss}` | Reactive Form: código, nombre, descripción, categoría, unidad, stock mínimo, stock actual, ubicación, activo — clon de `asset-type-form.component.ts` |

**Integraciones**:
- `app.routes.ts`: `inventory`, `inventory/new`, `inventory/:id`.
- `layout-menu.component.ts`: item `MENU.INVENTORY` en la sección principal del menú (junto a Dashboard, WorkOrders, Assets y Locations), icono `pi-shopping-cart`.
- `core/models/sync.ts`: añadir `'inventory-items'` a `SYNC_ENTITIES`.
- `core/interceptors/offline.interceptor.ts`: añadir `{ prefix: '/api/inventory-items', entity: 'inventory-items' }` a `ENTITY_BY_URL`.
- `es.json`/`en.json`: bloque `INVENTORY` + `MENU.INVENTORY`.

---

## FASE 2 — Módulo de Preventivo

### 2.1 Backend

Nuevo paquete `com.gmao.backend.preventive`:

| Archivo | Descripción |
|---|---|
| `entity/PreventivePlan.java` | `id`, `name` (obligatorio), `description`, `assetId` (FK, obligatorio), `frequencyDays` (Integer, obligatorio), `lastRunAt` (Instant, nullable), `nextDueDate` (LocalDate, nullable), `active`, `clientId` (36). Tabla `preventive_plans` |
| `repository/PreventivePlanRepository.java` | `findByClientId`, `findAllByOrderByNameAsc`, `findByAssetId` |
| `service/PreventivePlanService.java` | CRUD + idempotencia clientId + `generateWorkOrder(Long planId)`: crea `WorkOrder` con título `Preventivo: {plan.name}`, `assetId` del plan, status `OPEN`, priority 3; actualiza `lastRunAt`/`nextDueDate` |
| `controller/PreventivePlanController.java` | `@RequestMapping("/api/preventive-plans")`, CRUD + `POST /{id}/run` → genera OT y la devuelve |

**Migración** `scripts/migrations/010_preventive_plans.sql`:
- `CREATE TABLE preventive_plans (...)`, FK a `assets(id)`, índice único `ux_preventive_plans_name`, patrón `schema_migrations`.

**docker-compose.yml**: añadir `-f /migrations/010_preventive_plans.sql`.

**Tests** `backend/.../preventive/service/PreventivePlanServiceTest.java`:
- `createsPlan`, `createWithClientIdIsIdempotent`, `runGeneratesWorkOrderAndUpdatesDates`.

### 2.2 Frontend

Nuevo feature `src/app/features/preventive/`:

| Archivo | Descripción |
|---|---|
| `services/preventive-plan.service.ts` | Interface `PreventivePlan` + CRUD + `run(id)` → genera OT |
| `components/preventive-list.component.{ts,html,scss}` | Tabla: nombre, activo (nombre vía AssetService), frecuencia (días), próximo vencimiento con badge (rojo vencido, ámbar <7 días, verde lejos), botones CRUD + "Generar OT" |
| `components/preventive-form.component.{ts,html,scss}` | Reactive Form: nombre, descripción, activo (dropdown), frecuencia días, activo |

**Integraciones**:
- `app.routes.ts`: `preventive`, `preventive/new`, `preventive/:id`.
- `layout-menu.component.ts`: item `MENU.PREVENTIVE`.
- `core/models/sync.ts`: añadir `'preventive-plans'`.
- `core/interceptors/offline.interceptor.ts`: añadir `{ prefix: '/api/preventive-plans', entity: 'preventive-plans' }`.
- **Excluir del outbox** las URLs que terminan en `/run` (operación de negocio, no CRUD) para que no se encolen offline.
- `es.json`/`en.json`: bloque `PREVENTIVE` + `MENU.PREVENTIVE`.

---

## FASE 3 — Verificación
1. Backend: `./mvnw test` (tests nuevos + existentes).
2. Frontend: `npx ng test --watch=false` (añadir specs de list/form).
3. `docker compose up -d --build` + aplicar migraciones 009/010.
4. Smoke test: login → crear item de inventario → crear plan preventivo → "Generar OT" → verificar que aparece en WorkOrders.

## Orden de ejecución
1. Migración 009 + backend inventario + tests.
2. Frontend inventario (service, list, form, rutas, menú, sync, i18n).
3. Migración 010 + backend preventivo + tests.
4. Frontend preventivo (service, list, form, run, rutas, menú, sync, i18n).
5. Deploy Docker + smoke test.
