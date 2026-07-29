# CharroPro Master Audit - Tickets derivados

## P0

### CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001

- **Objetivo:** recuperar automáticamente proyecciones públicas pendientes.
- **Justificación:** score privado puede quedar correcto mientras portal/feed quedan stale.
- **Dependencias:** ninguna; definir revision/idempotency.
- **Alcance:** outbox, retry/backoff, reconcile, dead-letter, acción de repair, métricas y tests de fallo parcial.
- **Riesgo:** alto por tocar publicación; conservar multipath privado.
- **Resultado:** ninguna publicación oficial queda sin estado reparable.
- **Ajuste de auditoría:** ticket vigente y P0; no limitarse a “volver a llamar” desde memoria.

### OFFICIAL-SCORE-CONCURRENCY-001

- **Objetivo:** garantizar una sola cabeza activa por `attemptKey`.
- **Justificación:** revisión/supersesión es local.
- **Dependencias:** modelo attempt ledger y reglas.
- **Alcance:** transaction, expectedRevision, idempotencyKey, activeRecordId, correction lineage.
- **Riesgo:** crítico de migración.
- **Resultado:** dos clientes no duplican el intento.

### AUDIT-IMMUTABILITY-001

- **Objetivo:** hacer append-only la auditoría.
- **Justificación:** registros actuales son sobrescribibles.
- **Dependencias:** Emulator.
- **Alcance:** reglas, writer autorizado, actor, secuencia y tests.
- **Riesgo:** compatibilidad con correcciones.
- **Resultado:** evidencia no mutable.

### CORE-RUNTIME-MODULE-IDENTITY-001

- **Objetivo:** una instancia por módulo ES.
- **Justificación:** 24 cache-busters y FirebaseSync duplicado.
- **Dependencias:** import graph baseline.
- **Alcance:** quitar queries internas, versionar entrypoints, test de URLs.
- **Riesgo:** caché cliente.
- **Resultado:** estado/listeners únicos.

### TOURNAMENT-DELETION-CONSISTENCY-001

- **Objetivo:** lifecycle completo de delete/archive.
- **Justificación:** proyección pública y sesiones pueden sobrevivir.
- **Dependencias:** política retención/restore.
- **Alcance:** tombstone, close Broadcast, cleanup, verificación/idempotencia.
- **Riesgo:** destructivo; usar fixtures/emulator.
- **Resultado:** no quedan datos huérfanos.

### TIMER-AUTHORITY-CONCURRENCY-001

- **Objetivo:** autoridad única y revisiones del cronómetro.
- **Justificación:** dos controladores escriben al mismo nodo.
- **Dependencias:** reglas/protocol.
- **Alcance:** lease, expectedRevision, takeover, event history, stale/reconnect.
- **Riesgo:** operación en vivo.
- **Resultado:** timer determinista.

## P1

### FIREBASE-PRIVATE-SCHEMA-RULES-001

- **Objetivo:** validar estructura y transiciones de datos privados.
- **Justificación:** autorización por rol no basta.
- **Dependencias:** Emulator y schemas.
- **Alcance:** scores, published, history, meta, live.
- **Riesgo:** bloquear clientes legacy.
- **Resultado:** payloads inválidos rechazados.

### TEST-INFRA-E2E-EMULATOR-001

- **Objetivo:** CI con Auth/RTDB Rules Emulator y navegador.
- **Justificación:** tests actuales son mayormente locales/estáticos.
- **Dependencias:** fixtures canónicos.
- **Alcance:** journeys, roles, concurrency, portal, Broadcast.
- **Riesgo:** tiempo inicial.
- **Resultado:** release gates reales.

### SCORE-MISSING-VS-ZERO-001

- **Objetivo:** conservar ausencia, null, vacío y cero como estados distintos.
- **Justificación:** `|| 0` produce falso cero.
- **Dependencias:** schema/migration.
- **Alcance:** normalizers, compactors, UI `-`, tests.
- **Riesgo:** compatibilidad histórica.
- **Resultado:** exactitud semántica.

### PUBLIC-LIVE-DATA-MINIMIZATION-001

- **Objetivo:** cerrar lectura pública de `live`.
- **Justificación:** expone payload operativo.
- **Dependencias:** migrar V1.
- **Alcance:** consumidor inventory, new read routes, deprecation, rules.
- **Riesgo:** romper salidas antiguas.
- **Resultado:** público solo por proyección autorizada.

### TOURNAMENT-ACCESS-EXPLICIT-GRANTS-001

- **Objetivo:** acceso deny-by-default por torneo.
- **Justificación:** default `all`.
- **Dependencias:** migration perfiles.
- **Alcance:** roles/rules/UI/tests.
- **Riesgo:** usuarios sin acceso tras migración.
- **Resultado:** grants explícitos.

### RECOVERY-EXPORT-AUTHORIZATION-001

- **Objetivo:** controlar y auditar exportaciones.
- **Justificación:** backup está en READ_ACTIONS.
- **Dependencias:** policy tests.
- **Alcance:** capability, redaction, audit event.
- **Riesgo:** bajo.
- **Resultado:** solo roles autorizados exportan.

### LOCAL-STATE-RESILIENCE-001

- **Objetivo:** manejar quota/storage bloqueado.
- **Justificación:** `saveState` puede lanzar.
- **Dependencias:** cache policy.
- **Alcance:** adapter, fallback, UX, tests.
- **Riesgo:** bajo/medio.
- **Resultado:** captura no colapsa silenciosamente.

### RECOVERY-RESTORE-001

- **Objetivo:** restore completo/parcial verificable.
- **Justificación:** backup sin restore no es Recovery.
- **Dependencias:** schema versions/lifecycle.
- **Alcance:** validate, dry-run, checksum, conflict, restore, audit.
- **Riesgo:** crítico; solo Emulator/fixtures antes de producción.
- **Resultado:** simulacro exitoso.

### RECOVERY-VERIFIED-STATUS-001

- **Objetivo:** estado de protección basado en evidencia.
- **Justificación:** timestamp local produce falsa confianza.
- **Dependencias:** restore/checksum.
- **Alcance:** exported/verified/restored statuses.
- **Riesgo:** bajo.
- **Resultado:** UI honesta.

### OBSERVABILITY-FOUNDATION-001

- **Objetivo:** trazar score -> portal -> Broadcast.
- **Justificación:** fallos parciales dependen de consola.
- **Dependencias:** correlation IDs/outbox.
- **Alcance:** métricas, logs estructurados, alerts, health.
- **Riesgo:** costo/PII.
- **Resultado:** SLO/MTTR medibles.

### FUNCTIONS-DEPENDENCY-HARDENING-001

- **Objetivo:** fijar/actualizar dependencias Functions.
- **Justificación:** 10 vulnerabilidades y `latest`.
- **Dependencias:** Emulator/callable tests.
- **Alcance:** pinning, upgrade, audit CI.
- **Riesgo:** breaking changes.
- **Resultado:** builds reproducibles.

### DOCUMENTATION-OPERATIONS-BASELINE-001

- **Objetivo:** fuente única de arquitectura/operación.
- **Justificación:** README desactualizado y tickets fragmentados.
- **Dependencias:** decisiones P0.
- **Alcance:** README, install/deploy, data map, incident/release/restore runbooks.
- **Riesgo:** documentación diverge si no hay owner.
- **Resultado:** onboarding repetible.

### LEGACY-ENTRYPOINT-DEPRECATION-001

- **Objetivo:** catalogar/congelar/retirar V1.
- **Justificación:** salidas paralelas.
- **Dependencias:** telemetría.
- **Alcance:** owner, consumidores, flags, migration, removal dates.
- **Riesgo:** enlaces externos.
- **Resultado:** una ruta oficial por función.

## P2

### CORE-APPLICATION-DECOMPOSITION-001

- **Objetivo:** dividir `app.js` y `firebaseSync.js` por dominio.
- **Justificación:** blast radius alto.
- **Dependencias:** tests y module identity.
- **Alcance:** vertical slices incrementales; sin reescritura.
- **Riesgo:** regresión.
- **Resultado:** ownership/contratos claros.

### TOURNAMENT-LIFECYCLE-ARCHIVE-001

- **Objetivo:** preparación, live, finished, archived, deleted.
- **Justificación:** estados incompletos.
- **Dependencias:** restore/tombstone.
- **Alcance:** transitions, retention, UI/audit.
- **Riesgo:** migración.
- **Resultado:** lifecycle gobernado.

### USER-IDENTITY-LIFECYCLE-001

- **Objetivo:** invitación, reset, revocación, session audit.
- **Justificación:** gestión actual parcial.
- **Dependencias:** Auth Emulator.
- **Alcance:** endpoints/roles/UI/audit.
- **Riesgo:** seguridad.
- **Resultado:** onboarding/offboarding.

### ORGANIZATIONS-FOUNDATION-001

- **Objetivo:** introducir tenant/organization.
- **Justificación:** SaaS bloqueado.
- **Dependencias:** P0/P1.
- **Alcance:** IDs, ownership, grants, migration, rules.
- **Riesgo:** XL.
- **Resultado:** aislamiento de dos organizaciones.

### MASTER-DATA-001

- **Objetivo:** identidad canónica de charros/caballos/equipos/asociaciones.
- **Justificación:** nombres embebidos/duplicados.
- **Dependencias:** organizations/governance.
- **Alcance:** público/privado, IDs, merge, consent, audit.
- **Riesgo:** calidad/migración.
- **Resultado:** historial coherente.

### SAAS-ENTITLEMENTS-001

- **Objetivo:** planes, módulos, límites y suspensión.
- **Justificación:** no hay control comercial.
- **Dependencias:** organizations/usage.
- **Alcance:** entitlement service, grace, device/event limits.
- **Riesgo:** bypass.
- **Resultado:** producto configurable por plan.

### SAAS-BILLING-001

- **Objetivo:** suscripciones/facturación.
- **Justificación:** monetización no implementada.
- **Dependencias:** entitlements.
- **Alcance:** provider, lifecycle, webhooks idempotentes, invoices.
- **Riesgo:** financiero.
- **Resultado:** suscripción operativa.

### BROADCAST-MULTITENANT-CONTEXT-001

- **Objetivo:** quitar tenant fijo.
- **Justificación:** Broadcast single-tenant.
- **Dependencias:** organizations.
- **Alcance:** context/rules/sessions/migration.
- **Riesgo:** acceso cruzado.
- **Resultado:** sesiones aisladas.

### EVENT-002-DURABLE-CAPTURE

- **Objetivo:** capturar eventos importantes de forma durable.
- **Justificación:** engine actual solo memoria.
- **Dependencias:** ledger/audit/outbox.
- **Alcance:** event store, consumers, retention.
- **Riesgo:** duplicación con auditoría.
- **Resultado:** timeline/replay confiable.

## P3

### ARENA-OFFLINE-FOUNDATION-001

- **Objetivo:** event log/outbox local e IDs offline.
- **Justificación:** operación depende de Firebase/Auth.
- **Dependencias:** P0-P2.
- **Alcance:** local DB, commands/events, reconciliation.
- **Riesgo:** XL/crítico.
- **Resultado:** base Arena.

### ARENA-LAN-AUTHORITY-001

- **Objetivo:** servidor local para score/turn/timer.
- **Justificación:** sin internet no hay autoridad.
- **Dependencias:** offline foundation.
- **Alcance:** LAN auth, leader/lease, clients.
- **Riesgo:** distributed systems.
- **Resultado:** evento local.

### BROADCAST-ASSET-STORAGE-001

- **Objetivo:** persistir assets con derechos/tenant.
- **Justificación:** Asset Manager solo memoria.
- **Dependencias:** tenant/security.
- **Alcance:** Storage, upload, manifest, retention.
- **Riesgo:** costo/licencias.
- **Resultado:** assets productivos.

### BROADCAST-LAYOUT-EDITOR-001

- **Objetivo:** editor visual profesional.
- **Justificación:** Workspace usa presets.
- **Dependencias:** assets/scenes/renderer stable.
- **Alcance:** layers, geometry, undo, responsive.
- **Riesgo:** XL.
- **Resultado:** diseño sin código.

### BROADCAST-TIMER-DISPLAY-001

- **Objetivo:** salida Timer V2.
- **Justificación:** placeholder actual.
- **Dependencias:** timer authority/output.
- **Alcance:** contract, output, stale/offline.
- **Riesgo:** sincronización.
- **Resultado:** pantalla oficial.

### BROADCAST-PRO-OUTPUTS-001

- **Objetivo:** OBS/vMix/NDI/video/audio.
- **Justificación:** no implementado.
- **Dependencias:** editor/output health.
- **Alcance:** bridges separados por ticket.
- **Riesgo:** hardware/performance.
- **Resultado:** integración profesional.

### SCALE-ARCHIVE-OBSERVABILITY-001

- **Objetivo:** 1,000 torneos/100 dispositivos.
- **Justificación:** working set y costos no medidos.
- **Dependencias:** tenant/telemetry.
- **Alcance:** archive, queues, load/cost tests.
- **Riesgo:** costo.
- **Resultado:** capacidad demostrada.

## Reglas para ejecutar tickets

- Un ticket P0 por riesgo independiente.
- Ningún P2/P3 antes de los gates P0/P1.
- Cada ticket debe incluir test que reproduzca el defecto.
- Cambios de reglas siempre con Emulator.
- Cambios destructivos solo con fixture/backup/restore probado.
- No mezclar reglas deportivas con infraestructura.
