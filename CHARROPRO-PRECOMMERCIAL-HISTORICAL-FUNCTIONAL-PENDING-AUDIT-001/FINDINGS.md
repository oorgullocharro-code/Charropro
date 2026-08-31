# Findings

| ID | AREA | HISTORICAL_PENDING | CURRENT_STATUS | EVIDENCE | SEVERITY | COMMERCIAL_BLOCKER | PHYSICAL_TEST_REQUIRED | RECOMMENDED_ACTION |
|---|---|---|---|---|---|---|---|---|
| HP-001 | Terna | Cabecero -> Pial | CLOSED | `resolveFmch2026TernaNextSuerteId()`, commit de oportunidad y 3 suites dirigidas PASS | P1 | NO | NO | Conservar regresion |
| HP-002 | Portal Publico | Top 10 / ranking | PARTIAL | Inicio muestra Top 3, vista Rankings lista resultados y grafico limita a 10; `rankings` V2 sigue `unavailable` y los resultados se agrupan por charreada | P1 | YES | YES | Crear autoridad agregada y certificacion de ranking |
| HP-003 | Portal Publico | Sabana, resumen y filtros | PHYSICAL_VALIDATION_REQUIRED | Selectores, rutas, abreviaturas, parciales/finales, cache y 9 suites PASS; Produccion no tiene una proyeccion conocida poblada para smoke activo/final | P1 | YES | YES | Fixture E2E y validacion fisica de estados |
| HP-004 | Portal Publico | Vacio, stale/cache, aislamiento | CLOSED | Estado sin torneo correcto, listener unico, cache coherence y aislamiento por `tournamentId`; smoke sin errores | P1 | NO | NO | Conservar regresiones |
| HP-005 | Scorer | Navegacion, Guardar, siguiente, publicacion, reload | CLOSED | Flujo canonico, latencia, contexto tardio, full scorer y UX screen-by-screen PASS | P1 | NO | NO | Conservar regresiones |
| HP-006 | Scorer | Recorrido real de las 10 suertes | PHYSICAL_VALIDATION_REQUIRED | Cobertura automatica amplia; no se hizo escritura productiva ni corrida fisica completa en esta auditoria | P1 | YES | YES | Ensayo integral con juez y torneo TEST |
| HP-007 | Scorer | UX y operacion pantalla por pantalla | PHYSICAL_VALIDATION_REQUIRED | Responsive y jerarquia pasan fixtures; ergonomia real requiere iPad, 1366x768 y 1280x720 | P2 | NO | YES | Sesion UX fisica sin rediseño previo |
| HP-008 | Scorer | Fichas y totales de equipos | CLOSED | `renderScoringTeamCards()` muestra equipo, activo y `getTeamCharreadaTotal()` en cabecera | P2 | NO | NO | Sin accion |
| HP-009 | Outputs | Carga, fuente oficial y empty state | CLOSED | Marcador, ranking, timer grafico/campo, Cala y Coleadero cargan en Produccion sin consola; suites de sincronizacion PASS | P1 | NO | NO | Conservar smoke |
| HP-010 | Outputs | Active/realtime/responsive/stale/isolation | PHYSICAL_VALIDATION_REQUIRED | Paridad y responsive pasan pruebas; no hubo torneo publico activo para observacion simultanea | P1 | YES | YES | Prueba fisica multisalida con torneo TEST |
| HP-011 | Rankings | Equipos, Caladero, Coleadero, empates | PARTIAL | Grafico admite team/individual y Top 10; comparator interno existe, pero no hay regresion dirigida de empates ni certificacion fisica de modalidades individuales | P1 | YES | YES | Ticket unico de autoridad y certificacion de rankings |
| HP-012 | Supervisor | Crear, editar, activar, seleccionar, acceso y delete TEST | CLOSED | Navegacion, contexto, permisos, asignacion y delete/backup pasan pruebas dirigidas | P1 | NO | NO | Conservar autoridad server-side |
| HP-013 | Supervisor | Recorrido operativo completo | PHYSICAL_VALIDATION_REQUIRED | Flujos aislados pasan; falta recorrer CRUD, cambio de charreada, acceso de juez y reload en una sesion fisica | P1 | YES | YES | Validacion no destructiva con fixture TEST |
| HP-014 | Timer | Integracion visible | CLOSED | Consumer parity, scorer reactivity, timer OBS y timer campo PASS; field timer ya tenia validacion fisica | P1 | NO | NO | No reabrir Timer Authority |
| HP-015 | Official Publication | Score -> ledger/fanout/outbox/projection | CLOSED | Concurrencia, Cala overtime, Outbox, live feed y projection PASS | P0 | NO | NO | Conservar smoke dirigido |
| HP-016 | Backup/Delete | Precommercial TEST y backup obligatorio | CLOSED | `releaseStatus=precommercial`; policy, bucket authority, backup y delete PASS | P0 | NO | NO | No borrar datos en auditorias |
| NF-001 | Release/Functions | Deploy allowlist productiva | OPEN | `functions/package.json` enumera 17 exports, mientras Produccion aprobada mantiene 10; un deploy por script podria crear 7 Functions no autorizadas | P1 | YES | NO | Sustituir script por manifest allowlist de 10 |
| NF-002 | Dependencies | Rangos reproducibles | OPEN | `firebase-admin` y `firebase-functions` siguen declarados como `latest`, aunque lockfile fija versiones | P2 | NO | NO | Pinning dedicado con Emulator/canary |
| NF-003 | Navegacion/Tests | TODO, skipped tests, rutas/botones huerfanos | CLOSED | Sin tests skipped/TODO; acciones estaticas auditadas tienen handler de click/change/input o `data-view`; no se demostro ruta rota | P2 | NO | NO | Repetir en Master Audit |

## Notas De Clasificacion

- `CLOSED` significa que la evidencia actual contradice el pendiente historico.
- `PARTIAL` significa que hay superficie funcional, pero falta una autoridad o
  certificacion necesaria para representar el requisito completo.
- `PHYSICAL_VALIDATION_REQUIRED` no afirma un bug; identifica un gate que no
  puede cerrarse con pruebas puras ni con Produccion vacia.
- Una coincidencia `legacy`, `fallback`, `pending` o `deprecated` no se clasifico
  como hallazgo sin demostrar impacto.
