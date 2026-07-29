# CharroPro Master Audit - Hallazgos

## Criterios

- Severidad: Crítica, Alta, Media, Baja, Informativa.
- Estado: Confirmado, Parcialmente confirmado, Inferido, No verificable, Bloqueado, No implementado.
- Esfuerzo: S (días), M (1-3 semanas), L (3-8 semanas), XL (programa de trabajo).

## CPA-001 - Publicación oficial parcial sin recuperación durable

- **Área / severidad / estado:** Publicación pública / Crítica / Confirmado.
- **Evidencia:** `publishFirebaseOfficialScoreAtomic` completa el multipath privado y después llama `publishPublicTournamentSnapshot`; devuelve `ok:true, partialFailure:true`. `app.js` avanza y libera el draft al comprobar solo `ok`.
- **Archivo/función/línea:** `js/core/firebaseSync.js`, `publishFirebaseOfficialScoreAtomic`, aprox. 686-803; `js/app.js`, `publishOfficialScoreForContext` y caller, aprox. 11417-11555 y 11724-11750.
- **Ruta:** `tournaments`, `audit/publishedScores`, `live/current` -> `publicTournaments`.
- **Flujo:** publicación -> portal -> Live Feed/minuto a minuto.
- **Impacto/probabilidad/reproducibilidad:** portal stale después de score oficial; probabilidad media con fallos de red/permisos; reproducible inyectando fallo en segunda operación.
- **Datos/usuarios:** scores públicos, standings, feed; juez, público, locutor/producción.
- **Causa probable/confirmada:** frontera pública separada sin outbox/retry; confirmada.
- **Recomendación/tipo:** outbox durable, retry idempotente, reconciliador, operación manual de repair; arquitectura + datos.
- **Dependencias/esfuerzo/prioridad:** ledger de revisiones públicas y tests Emulator; M; P0.
- **Ticket:** `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001` (vigente; ampliar a outbox/dead-letter/repair).

## DAT-001 - Dos publicaciones simultáneas pueden dejar dos scores activos

- **Área / severidad / estado:** Integridad deportiva / Crítica / Confirmado por análisis; no ejecutado contra producción.
- **Evidencia:** `recordPublishedScore` calcula revisión desde el array local y supersede solo memoria; la escritura remota agrega IDs sin transaction/expected revision por `attemptKey`.
- **Archivo/función/línea:** `js/core/state.js`, `recordPublishedScore`, aprox. 959-991; `js/core/firebaseSync.js`, publicación oficial, aprox. 686-780.
- **Ruta:** `tournaments/{id}/publishedScores`, `audit/publishedScores`.
- **Flujo:** corrección/publicación multi-dispositivo.
- **Impacto/probabilidad/reproducibilidad:** ranking ambiguo/doble activo; probabilidad media en eventos con varios jueces; reproducible con dos estados desactualizados.
- **Datos/usuarios:** score oficial, resultados, auditoría; jueces/supervisor/público.
- **Causa:** revisión local y ausencia de cabeza transaccional del intento.
- **Recomendación/tipo:** ledger por `attemptKey`, transaction, expectedRevision, activeRecordId único, idempotency key; datos.
- **Dependencias/esfuerzo/prioridad:** diseño de migración y reglas; M/L; P0.
- **Ticket:** `OFFICIAL-SCORE-CONCURRENCY-001`.

## AUD-001 - Auditoría no es append-only

- **Área / severidad / estado:** Auditoría/seguridad / Crítica / Confirmado.
- **Evidencia:** regla de `$recordId` permite write si `newData.exists()` e ID coincide; no exige ausencia previa.
- **Archivo/función/línea:** `firebase-rules-auditoria.json`, aprox. 404-411.
- **Ruta:** `audit/publishedScores/{tournamentId}/{recordId}`.
- **Flujo:** publicación/corrección/no repudio.
- **Impacto/probabilidad/reproducibilidad:** sobrescritura de evidencia; alta consecuencia, reproducible por rol autorizado.
- **Datos/usuarios:** historial oficial; organización/jueces/supervisor.
- **Causa:** regla orientada a forma, no inmutabilidad.
- **Recomendación/tipo:** `!data.exists()`, writer server-side, secuencia/hash y retención protegida; seguridad/datos.
- **Dependencias/esfuerzo/prioridad:** reglas Emulator y migración de registros; S/M; P0.
- **Ticket:** `AUDIT-IMMUTABILITY-001`.

## LIFE-001 - Eliminación de torneo deja proyección pública y sesiones

- **Área / severidad / estado:** Lifecycle/privacidad / Alta / Confirmado.
- **Evidencia:** `deleteUpdates` no incluye `publicTournaments` ni Broadcast; cleanup de usuarios es posterior y puede devolver `ok:true, cleanupOk:false`.
- **Archivo/función/línea:** `js/core/firebaseSync.js`, `deleteFirebaseTournament`, aprox. 931-1040.
- **Ruta:** borra `tournaments/live/history/audit`, conserva `publicTournaments/broadcastStudio`.
- **Flujo:** eliminar torneo.
- **Impacto/probabilidad/reproducibilidad:** evento eliminado aún visible; enlaces/sesiones huérfanos; reproducible.
- **Datos/usuarios:** datos públicos y outputs; público/operadores.
- **Causa:** lifecycle distribuido incompleto.
- **Recomendación/tipo:** tombstone, archive, cierre de sesiones, cleanup verificable e idempotente; lifecycle.
- **Dependencias/esfuerzo/prioridad:** restore y política de retención; M; P0.
- **Ticket:** `TOURNAMENT-DELETION-CONSISTENCY-001`.

## ARCH-001 - Cache-busters crean instancias duplicadas de módulos

- **Área / severidad / estado:** Arquitectura/runtime / Alta / Confirmado.
- **Evidencia:** 24 valores `?v=`; `firebaseSync.js` se importa con seis versiones y desde `app.js`/`sync.js` con URLs diferentes en la misma aplicación.
- **Archivo/función/línea:** imports en `js/app.js`, `js/core/sync.js`, `js/core/dom.js` y otros.
- **Ruta:** carga ES modules.
- **Flujo:** inicialización, listeners, publicación, diagnósticos.
- **Impacto/probabilidad/reproducibilidad:** estado de módulo duplicado, listeners/contadores inconsistentes; ocurre en cada carga afectada.
- **Datos/usuarios:** estado runtime; todos los usuarios internos.
- **Causa:** cache-buster embebido por import interno en vez de entrypoint/build.
- **Recomendación/tipo:** imports canónicos sin query internos, versionar solo entrypoints/import map/build; arquitectura.
- **Dependencias/esfuerzo/prioridad:** test de import graph y cache migration; M; P0.
- **Ticket:** `CORE-RUNTIME-MODULE-IDENTITY-001`.

## TIM-001 - Cronómetro sin autoridad transaccional única

- **Área / severidad / estado:** Cronómetro/realtime / Alta / Confirmado por código.
- **Evidencia:** calificador y controlador dedicado publican `live/{id}/timer`; revisión se calcula por cliente, sin lease/transaction de controller.
- **Archivo/función/línea:** `js/app.js`, timer handlers/publicación; `js/views/cronometro-control.js`; `js/core/firebaseSync.js`, `publishFirebaseTimer`.
- **Ruta:** `live/{tournamentId}/timer`, `live/{id}/current/timer`.
- **Flujo:** start/pause/reset/reconnect.
- **Impacto/probabilidad/reproducibilidad:** last writer wins, timer retrocede/cambia autoridad; probable con dos controladores.
- **Datos/usuarios:** tiempo oficial/evidencia; juez/locutor/Broadcast/público.
- **Causa:** autoridad implícita y revisión local.
- **Recomendación/tipo:** lease de autoridad, expected revision y event log; realtime.
- **Dependencias/esfuerzo/prioridad:** reglas Emulator y compatibilidad V1; M; P0.
- **Ticket:** `TIMER-AUTHORITY-CONCURRENCY-001`.

## REC-001 - Recovery no puede restaurar

- **Área / severidad / estado:** Recuperación / Crítica para readiness / No implementado.
- **Evidencia:** backup JSON/Firebase existe; UI dice restauración próxima; no se encontró import/restore/roundtrip.
- **Archivo/función/línea:** `js/app.js`, `buildRecoveryFullBackup`, aprox. 6433-6585; `js/core/firebaseSync.js`, `createFirebaseTournamentBackup`, aprox. 2928-2959.
- **Ruta:** descarga local y `backups/{id}/{timestamp}`.
- **Flujo:** error humano, corrupción, delete, desastre.
- **Impacto/probabilidad/reproducibilidad:** backup no demostrado recuperable; impacto máximo ante incidente.
- **Datos/usuarios:** torneo completo; todos.
- **Causa:** Recovery evolucionó solo como export/status.
- **Recomendación/tipo:** manifest/checksum, dry-run, restore nuevo ID/in-place controlado, partial restore, drills; recovery.
- **Dependencias/esfuerzo/prioridad:** schema versions, audit, lifecycle; L; P1 antes de comercializar.
- **Ticket:** `RECOVERY-RESTORE-001`.

## DAT-002 - Ausencia se normaliza como score cero

- **Área / severidad / estado:** Datos/cálculo de presentación / Alta / Confirmado.
- **Evidencia:** `total: Number(record.total || 0)`.
- **Archivo/función/línea:** `js/core/state.js`, `normalizePublishedScore`, aprox. 433-448; compactaciones similares en Firebase.
- **Ruta:** published scores/state.
- **Flujo:** carga, resultados, exportación.
- **Impacto/probabilidad/reproducibilidad:** falso cero en lugar de “sin dato”; reproducible con null/undefined/empty.
- **Datos/usuarios:** totales y ranking; jueces/público.
- **Causa:** normalización falsy.
- **Recomendación/tipo:** normalizador tri-state y tests 0/null/undefined/""; datos.
- **Dependencias/esfuerzo/prioridad:** migración/compatibilidad; S/M; P1.
- **Ticket:** `SCORE-MISSING-VS-ZERO-001`.

## SEC-001 - `live` operativo es públicamente legible

- **Área / severidad / estado:** Seguridad/datos / Alta / Confirmado.
- **Evidencia:** `.read: true` en `live/$tournamentId`.
- **Archivo/función/línea:** `firebase-rules-auditoria.json`, aprox. 57-97.
- **Ruta:** `charropro/live/{tournamentId}`.
- **Flujo:** gráficos V1, portal legacy, realtime.
- **Impacto/probabilidad/reproducibilidad:** cualquier cliente con ID lee payload operativo; siempre reproducible.
- **Datos/usuarios:** turno, timer, rankings, contextos/metadata; operación.
- **Causa:** compatibilidad pública legacy.
- **Recomendación/tipo:** inventariar consumidores, migrar a `publicTournaments`/Broadcast read-only y cerrar ruta; seguridad/migración.
- **Dependencias/esfuerzo/prioridad:** telemetría y deprecación V1; M/L; P1.
- **Ticket:** `PUBLIC-LIVE-DATA-MINIMIZATION-001`.

## SEC-002 - Reglas privadas permiten payloads excesivos

- **Área / severidad / estado:** Firebase Rules / Alta / Confirmado.
- **Evidencia:** write por rol sin `.validate` profunda en scores/publishedScores/history/meta.
- **Archivo/función/línea:** `firebase-rules-auditoria.json`, aprox. 21-48.
- **Ruta:** `tournaments/{id}`.
- **Flujo:** edición/publicación directa.
- **Impacto/probabilidad/reproducibilidad:** cliente autorizado puede escribir estructura no canónica; reproducible con SDK.
- **Datos/usuarios:** torneo y score; roles activos.
- **Causa:** reglas de primera generación centradas en rol.
- **Recomendación/tipo:** allowlist/schema/size/state transitions y server commands; seguridad.
- **Dependencias/esfuerzo/prioridad:** Emulator; M/L; P1.
- **Ticket:** `FIREBASE-PRIVATE-SCHEMA-RULES-001`.

## AUTH-001 - Acceso a todos los torneos es el default

- **Área / severidad / estado:** Autorización / Alta / Confirmado.
- **Evidencia:** todo perfil que no declara `selected` normaliza `tournamentAccess` a `all`.
- **Archivo/función/línea:** `js/core/roles.js`, aprox. 111-133; reglas tournamentIndex/tournaments.
- **Ruta:** usuarios y tournament access.
- **Flujo:** login/listado/lectura.
- **Impacto/probabilidad/reproducibilidad:** acceso transversal; alto al incorporar clientes.
- **Datos/usuarios:** todos los torneos; usuarios internos.
- **Causa:** modelo single-organization.
- **Recomendación/tipo:** deny-by-default y grants explícitos; authorization.
- **Dependencias/esfuerzo/prioridad:** organización/tenant y migración de perfiles; M; P1.
- **Ticket:** `TOURNAMENT-ACCESS-EXPLICIT-GRANTS-001`.

## REC-002 - Exportar backup evita el capability check

- **Área / severidad / estado:** Permisos/privacidad / Media / Confirmado.
- **Evidencia:** `create-full-backup` está en `READ_ACTIONS`; `canUseAction` retorna true antes de `ACTION_CAPABILITIES.settings`.
- **Archivo/función/línea:** `js/app.js`, aprox. 233-265, 266-324 y 2313-2323.
- **Ruta:** Recovery local.
- **Flujo:** exportación.
- **Impacto/probabilidad/reproducibilidad:** rol con vista Recovery puede descargar datos disponibles; reproducible.
- **Datos/usuarios:** torneo, scores, usuarios/email cargados.
- **Causa:** clasificación contradictoria.
- **Recomendación/tipo:** capability `export-backup`, auditoría de export y redacción por rol; permisos.
- **Dependencias/esfuerzo/prioridad:** policy tests; S; P1.
- **Ticket:** `RECOVERY-EXPORT-AUTHORIZATION-001`.

## STATE-001 - Fallo de localStorage puede interrumpir el flujo

- **Área / severidad / estado:** Estado local / Media / Confirmado.
- **Evidencia:** `saveState` llama `localStorage.setItem` sin try/catch.
- **Archivo/función/línea:** `js/core/state.js`, aprox. 601-610.
- **Ruta:** cache local del torneo/draft.
- **Flujo:** captura, guardado, navegación.
- **Impacto/probabilidad/reproducibilidad:** excepción por quota/privacy; probabilidad baja/media, impacto alto en dispositivo.
- **Datos/usuarios:** draft/estado local; juez.
- **Causa:** storage asumido siempre disponible.
- **Recomendación/tipo:** adapter fallible, status, retry/eviction, test de quota; reliability.
- **Dependencias/esfuerzo/prioridad:** local cache policy; S/M; P1.
- **Ticket:** `LOCAL-STATE-RESILIENCE-001`.

## PUB-002 - Turno y timer también admiten divergencia pública

- **Área / severidad / estado:** Publicación live / Alta / Confirmado.
- **Evidencia:** write de live primero, `publishPublicTournamentSnapshot` después; retorno `ok:true` aunque `publicSnapshot.ok=false`.
- **Archivo/función/línea:** `js/core/firebaseSync.js`, `publishFirebaseTurn` aprox. 1045-1069; `publishFirebaseTimer` aprox. 1155-1172.
- **Ruta:** `live` -> `publicTournaments`.
- **Flujo:** turno/timer/portal.
- **Impacto/probabilidad/reproducibilidad:** portal muestra turno/timer atrasado; reproducible con fallo de segunda llamada.
- **Datos/usuarios:** contexto live; público/locutor.
- **Causa:** mismo patrón sin outbox.
- **Recomendación/tipo:** incluir en reconciliador público general; arquitectura.
- **Dependencias/esfuerzo/prioridad:** CPA-001; S adicional; P0/P1.
- **Ticket:** ampliar `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001`.

## LEG-001 - V1 y V2 conviven sin plan operativo de retiro

- **Área / severidad / estado:** Legacy/mantenibilidad / Media / Confirmado.
- **Evidencia:** gráficos/OBS/locutor/timer V1, adapter público legacy y Access Hub junto a Workspace V2.
- **Archivo/función/línea:** `grafico-*.html`, `obs.html`, `locutores.html`, `cronometro-pantalla.html`, `js/views/*`, `publicProjectionLegacyAdapter.js`, `broadcastAccessHub.js`.
- **Ruta:** múltiples entrypoints.
- **Flujo:** producción/portal.
- **Impacto/probabilidad/reproducibilidad:** soporte ambiguo, rutas inseguras heredadas, doble mantenimiento.
- **Datos/usuarios:** outputs/operadores.
- **Causa:** evolución incremental sin telemetría/deprecation registry.
- **Recomendación/tipo:** catálogo de entrypoints, ownership, usage telemetry, fecha de retiro; arquitectura.
- **Dependencias/esfuerzo/prioridad:** migración consumidores; M; P1/P2.
- **Ticket:** `LEGACY-ENTRYPOINT-DEPRECATION-001`.

## TEST-001 - Las pruebas no ejercen Firebase ni navegador reales

- **Área / severidad / estado:** QA / Alta / Confirmado.
- **Evidencia:** 44 suites pasan en ~2 s; rules tests son estáticos; no hay Playwright/Emulator/coverage.
- **Archivo/función/línea:** `tests/*`, ausencia de config E2E.
- **Ruta:** todo el producto.
- **Flujo:** release.
- **Impacto/probabilidad/reproducibilidad:** regresiones de integración no detectadas; permanente.
- **Datos/usuarios:** todos.
- **Causa:** estrategia centrada en módulos/fixtures.
- **Recomendación/tipo:** Emulator, E2E journeys, concurrency, visual/accessibility, coverage; QA.
- **Dependencias/esfuerzo/prioridad:** fixtures y CI; L; P1.
- **Ticket:** `TEST-INFRA-E2E-EMULATOR-001`.

## SAAS-001 - El core no soporta multi-organización

- **Área / severidad / estado:** SaaS/arquitectura / Crítica comercial / No implementado.
- **Evidencia:** rutas core por tournamentId, usuarios globales, sin org; Broadcast fija un tenant.
- **Archivo/función/línea:** reglas/rutas core; Broadcast rules aprox. 99+.
- **Ruta:** todo `charropro`.
- **Flujo:** onboarding/aislamiento/billing.
- **Impacto/probabilidad/reproducibilidad:** no se pueden alojar clientes independientes con garantías.
- **Datos/usuarios:** todos los futuros tenants.
- **Causa:** producto single-organization.
- **Recomendación/tipo:** organization envelope, grants, migration, usage metering; arquitectura comercial.
- **Dependencias/esfuerzo/prioridad:** P0/P1 primero; XL; P2.
- **Ticket:** `ORGANIZATIONS-FOUNDATION-001`.

## BROADCAST-001 - Broadcast tenant es fijo

- **Área / severidad / estado:** Broadcast/SaaS / Alta / Confirmado.
- **Evidencia:** reglas exigen `tenantId='charropro-e8a68'`, org/client null.
- **Archivo/función/línea:** `firebase-rules-auditoria.json`, Broadcast context/program/announcer.
- **Ruta:** `broadcastStudio/sessions`.
- **Flujo:** sesiones/outputs/acceso.
- **Impacto/probabilidad/reproducibilidad:** aislamiento conceptual, no multi-cliente; siempre.
- **Datos/usuarios:** sesiones Broadcast.
- **Causa:** rollout single-tenant.
- **Recomendación/tipo:** derivar tenant del perfil/torneo y validar por claims/grants; seguridad.
- **Dependencias/esfuerzo/prioridad:** SAAS-001; L; P2.
- **Ticket:** `BROADCAST-MULTITENANT-CONTEXT-001`.

## OBS-001 - No hay observabilidad ni SLO de extremo a extremo

- **Área / severidad / estado:** Operación/confiabilidad / Alta / Confirmado.
- **Evidencia:** logs `console` y diagnósticos locales; no métricas, alertas, trace ID ni dashboard central.
- **Archivo/función/línea:** múltiples `console.*`; diagnósticos en app.
- **Ruta:** score -> portal -> Broadcast.
- **Flujo:** incidente/release.
- **Impacto/probabilidad/reproducibilidad:** falla parcial detectada tarde y reparación manual.
- **Datos/usuarios:** todos los eventos activos.
- **Causa:** observabilidad no diseñada como producto.
- **Recomendación/tipo:** correlation IDs, métricas de revisión/latencia, alerts, health dashboard, runbook; operación.
- **Dependencias/esfuerzo/prioridad:** outbox/ledger; M/L; P1.
- **Ticket:** `OBSERVABILITY-FOUNDATION-001`.

## DEP-001 - Functions tiene dependencias vulnerables/no reproducibles

- **Área / severidad / estado:** Supply chain / Media / Confirmado.
- **Evidencia:** npm audit 10 vulnerabilidades; package declara `latest`.
- **Archivo/función/línea:** `functions/package.json`, `functions/package-lock.json`.
- **Ruta:** Cloud Functions.
- **Flujo:** deploy/usuarios.
- **Impacto/probabilidad/reproducibilidad:** riesgo de runtime/build; reproducible con npm audit.
- **Datos/usuarios:** Auth/admin.
- **Causa:** pinning insuficiente/actualizaciones pendientes.
- **Recomendación/tipo:** fijar versiones, actualizar en rama, emulator y CI audit gate; dependencias.
- **Dependencias/esfuerzo/prioridad:** pruebas Functions; S/M; P1.
- **Ticket:** `FUNCTIONS-DEPENDENCY-HARDENING-001`.

## DOC-001 - README y runbooks no representan el sistema actual

- **Área / severidad / estado:** Documentación/operación / Media / Confirmado.
- **Evidencia:** README describe “primera base” y sugiere reglas abiertas temporales; no documenta V2 completo.
- **Archivo/función/línea:** `README.md`, documentación fragmentada en tickets.
- **Ruta:** onboarding/deploy/incidente.
- **Flujo:** operación y soporte.
- **Impacto/probabilidad/reproducibilidad:** configuración insegura/error humano; alta probabilidad para nuevo operador.
- **Datos/usuarios:** indirecto; equipo técnico/clientes.
- **Causa:** documentación ticket-céntrica sin baseline.
- **Recomendación/tipo:** README actual, architecture decision record, data map, release/incident/restore runbooks; docs.
- **Dependencias/esfuerzo/prioridad:** P0 definido; M; P1.
- **Ticket:** `DOCUMENTATION-OPERATIONS-BASELINE-001`.

## PERF-001 - Dos monolitos concentran el riesgo de cambio

- **Área / severidad / estado:** Mantenibilidad/rendimiento / Media / Confirmado.
- **Evidencia:** `app.js` 12,209 líneas; `firebaseSync.js` 4,333; CSS principal 8,618.
- **Archivo/función/línea:** archivos indicados.
- **Ruta:** app interna.
- **Flujo:** cualquier cambio.
- **Impacto/probabilidad/reproducibilidad:** blast radius, reviews difíciles, tree-shaking inexistente, errores de acoplamiento.
- **Datos/usuarios:** todos.
- **Causa:** crecimiento acumulativo.
- **Recomendación/tipo:** extraer vertical slices con tests, sin reescritura; arquitectura.
- **Dependencias/esfuerzo/prioridad:** estabilización y module identity; XL incremental; P1/P2.
- **Ticket:** `CORE-APPLICATION-DECOMPOSITION-001`.

## MASTER-001 - No existe identidad maestra de participantes/caballos

- **Área / severidad / estado:** Datos/producto / Alta / No implementado.
- **Evidencia:** participantes/caballos embebidos como texto/IDs temporales; documentos de gobierno son solo lineamientos.
- **Archivo/función/línea:** `app.js`, jornada `individualParticipants`; `ARCH_DATA_GOVERNANCE.md`.
- **Ruta:** teams/charreadas/scores.
- **Flujo:** registro, estadísticas, historial.
- **Impacto/probabilidad/reproducibilidad:** duplicados y estadísticas fragmentadas; recurrente.
- **Datos/usuarios:** charros/caballos/asociaciones.
- **Causa:** modelo orientado a evento.
- **Recomendación/tipo:** modelo canónico público/privado y merge auditado; producto/datos.
- **Dependencias/esfuerzo/prioridad:** governance + org envelope; L/XL; P2.
- **Ticket:** `MASTER-DATA-001`.

## EVENT-001 - Event Engine no es la fuente oficial declarada

- **Área / severidad / estado:** Eventos/arquitectura / Media / Confirmado.
- **Evidencia:** `events.js` almacena solo memoria; integración visible mínima en backup.
- **Archivo/función/línea:** `js/core/events.js`; `app.js` backup event.
- **Ruta:** memoria de sesión.
- **Flujo:** auditoría/automatización.
- **Impacto/probabilidad/reproducibilidad:** módulos siguen acoplados y eventos se pierden al recargar.
- **Datos/usuarios:** eventos de sistema.
- **Causa:** foundation no continuada.
- **Recomendación/tipo:** no expandir hasta diseñar event log/outbox común; arquitectura.
- **Dependencias/esfuerzo/prioridad:** score ledger/audit; M/L; P2.
- **Ticket:** `EVENT-002-DURABLE-CAPTURE`.

## REC-003 - Estado “Protegido” no prueba protección real

- **Área / severidad / estado:** UX/Recovery / Media / Confirmado.
- **Evidencia:** estado usa timestamp de historial local; no comprueba archivo, checksum ni restore.
- **Archivo/función/línea:** `js/app.js`, health/history, aprox. 6008-6399.
- **Ruta:** sessionStorage/localStorage.
- **Flujo:** decisión del operador.
- **Impacto/probabilidad/reproducibilidad:** falsa confianza; siempre tras generar metadata.
- **Datos/usuarios:** torneo; organizador.
- **Causa:** indicador semánticamente más fuerte que la evidencia.
- **Recomendación/tipo:** estados “exportado/no verificado/restauración probada”; UX/recovery.
- **Dependencias/esfuerzo/prioridad:** REC-001; S/M; P1.
- **Ticket:** `RECOVERY-VERIFIED-STATUS-001`.

## FINDINGS SUMMARY

| Severidad | Cantidad |
| --- | ---: |
| Crítica | 5 |
| Alta | 12 |
| Media | 8 |
| Baja/Informativa | 0 en inventario principal |

La concentración crítica está en integridad, publicación, auditoría, recovery y readiness SaaS; no en reglas deportivas.
