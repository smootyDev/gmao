# Plan: Módulo IA + Auditoría en el GMAO/CMMS

## 1) Resumen ejecutivo

Módulo backend nuevo `com.gmao.backend.ai` como **proxy seguro hacia un LLM** (proveedor-agnóstico), configurable por un ADMIN desde **Administración → Configuración IA**, más **módulo de auditoría general** (`audit_logs`) que registra quién, qué, cuándo, endpoint y status de todo cambio, con **retención de 90 días y purge**.

- **MVP (8 semanas), no invasivo:** cero cambios en entidades actuales; feature flag `AI_ENABLED`; el sistema funciona idéntico sin IA.
- **Alcance IA:** UC-1 asistente conversacional, UC-2 sugerencia de OT, UC-3 priorización, UC-4 resumen. No predictive maintenance (falta histórico de fallos).
- **Coste:** 5–15 USD/mes cloud (gpt-4o-mini) o $0 con Ollama/opencode local.

## 2) Estado actual

- Backend Spring Boot 4.1/Java 21, JWT (ADMIN/MANAGER/TECH), patrón controller→service→repository, idempotencia por `clientId`, `ddl-auto:validate` + migraciones 001–013 con `schema_migrations`.
- Frontend Angular 21/PrimeNG, signals, offline con outbox (excluye URLs `/run`), i18n ES/EN.
- Gaps: sin `actualHours`/coste/fallos históricos; volumen de datos real muy bajo (3 OTs semilla).

## 3) Casos de uso priorizados

| # | Caso | Esfuerzo | En MVP |
|---|---|---|---|
| UC-1 | Asistente conversacional sobre datos del GMAO | Medio | ✅ |
| UC-2 | Sugerencia de OT (título/descripción/prioridad/checklist) | Bajo | ✅ |
| UC-3 | Priorización asistida con justificación | Bajo | ✅ |
| UC-4 | Resumen automático (semanal/diario) | Bajo | ✅ |
| UC-5 | Clasificación de criticidad | Medio | Fase 2 |
| UC-6 | RAG sobre manuales | Alto | Fase 2 |
| UC-7 | Mantenimiento predictivo | Alto | Fase 2 (requiere histórico) |

## 4) Arquitectura

```
com.gmao.backend.ai
   ├─ AiController            → /api/ai/* + GET/PUT/test /api/ai/settings (ADMIN)
   ├─ AiService               → orquesta llamadas
   ├─ AiSettingsService       → config BD con fallback env + caché
   ├─ AiProvider (interfaz)   → Port
   │   ├─ OpenAiAdapter (openai/azure)
   │   ├─ AnthropicAdapter
   │   ├─ GoogleAdapter
   │   ├─ OllamaAdapter
   │   ├─ OpencodeAdapter     → HTTP Basic (username) + sesiones/mensajes
   │   └─ MockAiAdapter       → tests/CI sin llamadas
   ├─ AiContextBuilder        → contexto desde repos + sanitización PII
   ├─ AiProperties            → @ConfigurationProperties

com.gmao.backend.audit
   ├─ entity/AuditLog.java
   ├─ repository/AuditLogRepository.java
   ├─ service/AuditLogService.java
   ├─ web/AuditRequestFilter.java  → captura automática POST/PUT/DELETE de /api/**
   └─ controller/AuditLogController.java → GET /api/audit-logs (ADMIN)
```

**Resolución de config:** env vars por defecto → override `ai_settings` (BD) → caché invalidable. Sin reinicio.

## 5) Integración API (ejemplos JSON)

**Endpoints IA** (JWT):
- `POST /api/ai/assistant/chat` → `{ reply, data, usage }`
- `POST /api/ai/workorders/suggest` → `{ title, description, priority, estimatedHours, checklist }`
- `POST /api/ai/workorders/prioritize` → `{ suggestions: [{ workOrderId, suggestedPriority, reason }] }`
- `POST /api/ai/summarize` → `{ summary }`
- `GET /api/ai/health` → `{ enabled, provider, model, status }`
- `GET/PUT /api/ai/settings` (ADMIN) → nunca expone apiKey (solo `apiKeyConfigured`)
- `POST /api/ai/settings/test` (ADMIN) → `{ ok, latencyMs, model }`

**Endpoints auditoría** (solo ADMIN):
- `GET /api/audit-logs?category=&entity=&userId=&from=&to=&page=&size=`
- `GET /api/ai/metrics?from=&to=` → `{ requests, avgLatencyMs, tokensIn, tokensOut, estimatedCost, parseFailures, cacheHits }`

**Presets (autocompletan el form):**
```json
openai:    { baseUrl: "https://api.openai.com/v1",   model: "gpt-4o-mini" }
azure:     { baseUrl: "https://<resource>.openai.azure.com/openai/deployments/<deployment>", model: "" }
anthropic: { baseUrl: "https://api.anthropic.com/v1", model: "claude-3-5-haiku" }
google:    { baseUrl: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.0-flash" }
ollama:    { baseUrl: "http://localhost:11434",      model: "llama3.1" }
opencode:  { baseUrl: "http://localhost:4096",       model: "", username: "opencode" }
```

## 6) Datos y pipelines

- MVP sin ETL: `AiContextBuilder` consulta repos en el momento; contexto compacto (top-N OTs), PII eliminada (email/teléfono/password/clientId).
- Migraciones: `014_ai_settings.sql` + `015_audit_log.sql` (registradas en db-migrate).
- Fase 2: enriquecer `work_orders` (`actualHours`, `downtimeMinutes`, `failureCode`, `cost`), corpus RAG (pgvector), telemetría.

## 7) Seguridad y cumplimiento

- API key solo backend (env/BD cifrada AES-GCM con `AI_SETTINGS_ENCRYPTION_KEY`; nunca `JWT_SECRET`); PWA nunca la expone.
- Roles: `settings` y `audit-logs` solo ADMIN; TECH solo chat restringido + sugerencias.
- **Auditoría = solo metadatos + body sanitizado** (confirmado): `requestBody` sin passwords/keys/JWT/`clientId` (exclusión por patrón/endpoint).
- Rate limiting, timeout, circuit breaker; prompt injection mitigado (usuario = dato, contexto interno).
- **Retención 90 días con purge** (confirmado): job diario elimina `audit_logs` con `timestamp < now() - 90d`; config `AUDIT_RETENTION_DAYS`.
- Auditoría IA registra tokens/coste/latencia/usuario **sin** texto completo por defecto (`AUDIT_AI_STORE_CONTENT=false`; activable interno).
- `audit_logs` y `ai/*` fuera del outbox offline.

## 8) Despliegue y pruebas

- Config por env en `application.yml` + `docker-compose`; `AI_ENABLED=false` por defecto.
- Unitarias: `AiServiceTest`, `AiSettingsServiceTest`, adaptadores con mock HTTP, `AuditRequestFilterTest` (captura, sanitización, retención).
- Integración: contexto, seguridad por rol, `health`.
- Frontend Vitest: panel de chat, form de configuración IA (campos dinámicos), pantalla auditoría, "aplicar sugerencia".
- Smoke E2E: login → health → chat → sugerir → aplicar → crear OT real → ver en auditoría.

## 9) Costes y proveedores

| Proveedor | Modelo | 1k llamadas (~2.8k tok) | Notas |
|---|---|---|---|
| OpenAI | gpt-4o-mini | ~$0.50 | Estándar |
| Azure OpenAI | gpt-4o-mini | ~$0.50 | Enterprise/cumplimiento |
| Anthropic | claude-3-5-haiku | ~$3.20 | Mejor lenguaje técnico |
| Google | gemini-2.0-flash | ~$0.40 | Más barato |
| OpenRouter | varios | +5–10% | Multi-proveedor |
| Ollama (local) | llama3.1 8B | $0 | Dev/privado |
| opencode (local) | según config | $0 | Uso su provider local; necesita `opencode serve` |

MVP mensual: **5–15 USD** (cloud) o **$0** (local).

## 10) Roadmap (8 semanas)

| Semana | Entregable |
|---|---|
| S1 | `ai` base: `AiProperties`, `AiProvider`, `MockAiAdapter`, `OpenAiAdapter`, `/health`. |
| S2 | `AiSettingsService` + `014_ai_settings` + AES-GCM + `GET/PUT/test`. |
| S3 | Módulo `audit`: `AuditLog` + `AuditRequestFilter` + `AuditLogService` + `015_audit_log` + retención 90d/purge + captura CRUD/AUTH. |
| S4 | `assistant/chat` + auditoría IA (tokens/coste/latencia). |
| S5 | `suggest` + `prioritize` (auditados). |
| S6 | `OpencodeAdapter` + pantallas **Configuración IA** y **Auditoría** (filtros/paginación) + panel chat `/ai`. |
| S7 | "Rellenar con IA" en form OT + priorización listado + widget resumen + `GET /api/ai/metrics`. |
| S8 | Deploy staging, smoke, monitorización, docs, piloto. |

## 11) Métricas y monitorización

- Técnicas: latencia p50/p95, tasa error, timeouts, rate-limit hits, cache hit.
- Coste: tokens/día y coste estimado por UC (de `audit_logs` + `metrics`).
- Adopción: usuarios activos, peticiones/día, tasa "aplicar sugerencia", aceptación priorización.
- Calidad: tasa de parseo JSON, revisión manual piloto (10/semana).

## 12) Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Alucinaciones | Contexto interno, citas, salida validada, revisión humana antes de crear OTs |
| Fuga PII | Sanitización backend, contexto mínimo, auditoría sin texto completo, DPA |
| Coste descontrolado | Cache, rate limit, presupuesto/alertas, monitor |
| Prompt injection | Usuario = dato, system prompt inmutable |
| Proveedor caído | Timeout/retry/circuit breaker, modo degradado, Ollama/opencode local |
| Conflicto offline | `/api/ai/**` y `/api/audit-logs` fuera del outbox |
| Datos insuficientes | MVP orientado a LLM; capturar histórico desde ya |
| Lock-in | Capa `AiProvider` |
| **Auditoría = datos sensibles** | **Solo metadatos + body sanitizado; retención 90d; lectura ADMIN** |

## 13) Checklist de entrega

- [x] `com.gmao.backend.ai` + `AiProvider` + adapters (OpenAI, Anthropic, Google, Ollama, opencode, Mock).
- [x] `AiProperties` + env vars; `AiSettingsService` + cifrado AES-GCM + `014_ai_settings`.
- [x] Endpoints IA: `chat`, `suggest`, `prioritize`, `summarize`, `health`, `settings` (+`test`).
- [x] Módulo `audit`: `audit_logs` (`015`) con categorías CRUD/AUTH/AI/CONFIG/BUSINESS.
- [x] `AuditRequestFilter` captura POST/PUT/DELETE `/api/**` sin tocar servicios; body sanitizado.
- [x] Auditoría IA (tokens/coste/latencia/usuario, sin contenido por defecto).
- [x] Retención 90 días con purge (`AUDIT_RETENTION_DAYS`).
- [x] `GET /api/audit-logs` (ADMIN, filtros+paginación).
- [x] `OpencodeAdapter` (crea sesión → envía mensaje → limpia sesión; HTTP Basic `opencode`/password).
- [ ] `GET /api/ai/metrics` (S7, agrega desde `audit_logs`).
- [x] Frontend: panel chat `/ai` (con acciones rápidas sugerir/priorizar/resumir), **Configuración IA** (presets + test de conexión, ADMIN) y **Auditoría** (filtros + paginación + expansión de detalle, ADMIN).
- [x] i18n ES/EN; rutas lazy; menú (IA visible a todos, Configuración IA/Auditoría solo ADMIN); fuera del outbox offline.
- [x] Tests backend+frontend (54 + 60 OK); smoke E2E real.
- [ ] "Rellenar con IA" en form OT, priorización en listado, widget dashboard (S7).
- [ ] Despliegue staging; docs de operación.
