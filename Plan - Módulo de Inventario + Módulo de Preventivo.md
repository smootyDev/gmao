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

> Relación OT ↔ inventario (0..N artículos por OT) en la sección **FASE 1.3**.

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

### 1.3 Relación OT ↔ inventario

Una orden de trabajo puede requerir **0..N artículos del inventario** (solo referencia, no descuenta stock).

**Nueva tabla** `work_order_items` — **migración** `scripts/migrations/010_work_order_items.sql`:
- `id` BIGSERIAL PK, `work_order_id` BIGINT NOT NULL FK → `work_orders(id)` ON DELETE CASCADE, `inventory_item_id` BIGINT NOT NULL FK → `inventory_items(id)`, `quantity` DOUBLE PRECISION NOT NULL DEFAULT 1.
- Patrón `schema_migrations` (DO$$ / IF NOT EXISTS).

**docker-compose.yml**: añadir `-f /migrations/010_work_order_items.sql`.

**Backend**:
- Nueva entidad `WorkOrderItem` (`id`, `workOrderId`, `inventoryItemId`, `quantity`).
- `WorkOrder.java`: lista `List<WorkOrderItem> items` embebida en el payload JSON de la OT.
- `WorkOrderService`: `create`/`update` persisten los `items` junto a la OT; `list`/`get` los devuelven con nombre/unidad del artículo (para mostrar en frontend).
- `InventoryItemService`: método para saber en qué OTs se usa un artículo (`findByWorkOrderItemInventoryItemId`).
- La OT viaja con su lista de artículos en el mismo payload → la sync offline funciona sin cambios (todo en `/api/workorders`).

**Frontend**:
- `workorder.service.ts`: interface `WorkOrder` con `items?: { inventoryItemId: number; quantity: number; name?: string; unit?: string }[]`.
- `workorder-form.component`: sección **"Artículos"** con `p-table`/`p-picklist` (selección de artículos + `p-inputnumber` para cantidad).
- `workorder-list.component`: badge/columna con el nº de artículos.
- `inventory-list` (o detalle): mostrar en qué OTs se usa cada artículo.

**i18n** ES/EN: `WORKORDERS.ITEMS`, `WORKORDERS.ADD_ITEM`, `WORKORDERS.QUANTITY`, `INVENTORY.USED_IN_WOS`.

**Tests**:
- Backend: crear OT con 0 y con N artículos; recuperar items en `get`/`list`.
- Frontend: spec del form con artículos añadidos.

---

## FASE 2 — Módulo de Preventivo

### 2.1 Backend

Nuevo paquete `com.gmao.backend.preventive`:

| Archivo | Descripción |
|---|---|
| `entity/PreventivePlan.java` | `id`, `name` (obligatorio), `description`, `assetId` (FK, obligatorio), `frequencyDays` (Integer, obligatorio), `lastRunAt` (Instant, nullable), `nextDueDate` (LocalDate, nullable), `active`, `clientId` (36). Tabla `preventive_plans` |
| `repository/PreventivePlanRepository.java` | `findByClientId`, `findAllByOrderByNameAsc`, `findByAssetId` |
| `service/PreventivePlanService.java` | CRUD + idempotencia clientId + `generateWorkOrder(Long planId)`: crea `WorkOrder` con título `Preventivo: {plan.name}`, `assetId` del plan, `preventivePlanId = planId`, status `OPEN`, priority 3; actualiza `lastRunAt`/`nextDueDate`. Incluye `getWorkOrderCount(Long planId)` para el contador de OTs generadas |
| `controller/PreventivePlanController.java` | `@RequestMapping("/api/preventive-plans")`, CRUD + `POST /{id}/run` → genera OT y la devuelve |

**Trazabilidad OT ↔ plan**:
- `WorkOrder.java`: añadir campo `preventivePlanId` (`Long`, columna `preventive_plan_id`, nullable).
- `WorkOrderRepository`: añadir `findByPreventivePlanId(Long planId)` y `countByPreventivePlanId(Long planId)`.
- `generateWorkOrder` setea `preventivePlanId = planId` en la OT creada.

**Migración** `scripts/migrations/011_preventive_plans.sql`:
- `CREATE TABLE preventive_plans (...)`, FK a `assets(id)`, índice único `ux_preventive_plans_name`, patrón `schema_migrations`.
- `ALTER TABLE work_orders ADD COLUMN preventive_plan_id BIGINT` + `FK fk_work_orders_preventive_plan REFERENCES preventive_plans(id)`.

**docker-compose.yml**: añadir `-f /migrations/011_preventive_plans.sql`.

**Tests** `backend/.../preventive/service/PreventivePlanServiceTest.java`:
- `createsPlan`, `createWithClientIdIsIdempotent`, `runGeneratesWorkOrderAndUpdatesDates`, `runLinksWorkOrderToPlan` (la OT generada tiene `preventivePlanId` = id del plan).

### 2.2 Frontend

Nuevo feature `src/app/features/preventive/`:

| Archivo | Descripción |
|---|---|
| `services/preventive-plan.service.ts` | Interface `PreventivePlan` + CRUD + `run(id)` → genera OT. Incluye `workOrderCount` en el modelo |
| `components/preventive-list.component.{ts,html,scss}` | Tabla: nombre, activo, frecuencia (días), próximo vencimiento con badge (rojo vencido, ámbar <7 días, verde lejos), **OTs generadas (contador)**, botones CRUD + "Generar OT" |
| `components/preventive-form.component.{ts,html,scss}` | Reactive Form: nombre, descripción, activo (dropdown), frecuencia días, activo |

**WorkOrders (origen)**:
- `workorder.service.ts`: interface `WorkOrder` con `preventivePlanId?: number`.
- `workorder-list.component`: nueva columna **"Origen"** con `p-tag` (verde "Preventivo" si `preventivePlanId` definido, gris "Manual" si no).

**Integraciones**:
- `app.routes.ts`: `preventive`, `preventive/new`, `preventive/:id`.
- `layout-menu.component.ts`: item `MENU.PREVENTIVE`.
- `core/models/sync.ts`: añadir `'preventive-plans'`.
- `core/interceptors/offline.interceptor.ts`: añadir `{ prefix: '/api/preventive-plans', entity: 'preventive-plans' }`.
- **Excluir del outbox** las URLs que terminan en `/run` (operación de negocio, no CRUD) para que no se encolen offline.
- `es.json`/`en.json`: bloque `PREVENTIVE` (+ `PREVENTIVE.GENERATED_WOS`) + `MENU.PREVENTIVE`, y en `WORKORDERS`: `ORIGIN`, `ORIGIN_PREVENTIVE`, `ORIGIN_MANUAL`.

**Nota sobre el contador**: el `workOrderCount` se calcula inline en el `GET /api/preventive-plans` (sin request extra por fila), usando `countByPreventivePlanId`.

---

## FASE 3 — Verificación
1. Backend: `./mvnw test` (tests nuevos + existentes).
2. Frontend: `npx ng test --watch=false` (añadir specs de list/form).
3. `docker compose up -d --build` + aplicar migraciones 009/010/011.
4. Smoke test: login → crear item de inventario → crear OT con artículos → crear plan preventivo → "Generar OT" → verificar que aparece en WorkOrders con origen preventivo.

## Orden de ejecución
1. Migración 009 + backend inventario + tests.
2. Frontend inventario (service, list, form, rutas, menú, sync, i18n).
3. Migración 010 (work_order_items) + relación OT↔inventario backend + tests.
4. Frontend OT↔inventario (form artículos + visibilidad cruzada + i18n).
5. Migración 011 + backend preventivo + tests.
6. Frontend preventivo (service, list, form, run, rutas, menú, sync, i18n).
7. Deploy Docker + smoke test.
