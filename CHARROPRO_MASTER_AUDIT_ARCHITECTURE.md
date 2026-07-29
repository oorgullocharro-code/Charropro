# CharroPro Master Audit - Arquitectura

## Dictamen arquitectónico

CharroPro posee contratos explícitos y módulos especializados, especialmente en Broadcast y Portal V2, pero el core administrativo/deportivo sigue operando como una aplicación monolítica coordinada por `js/app.js` y un repositorio Firebase igualmente amplio en `js/core/firebaseSync.js`. La arquitectura es híbrida: partes modernas bien separadas conviven con conexiones puntuales, estado global, compatibilidad legacy y versionado de imports que puede duplicar módulos.

## Capas actuales

| Capa | Componentes | Estado |
| --- | --- | --- |
| Entradas | HTML administrativos, públicos, Broadcast y gráficos V1 | Varias generaciones activas |
| Aplicación interna | `js/app.js`, `js/tournamentApp.js` | Monolito funcional |
| Dominio deportivo | `scoring.js`, `flow.js`, `statistics.js`, catálogos | Reutilizable, con contratos implícitos |
| Estado local | `state.js`, `localCache.js`, `localStorage` | Central y dependiente del navegador |
| Persistencia/sync | `firebaseSync.js`, `sync.js` | Amplia, con múltiples responsabilidades |
| Proyección pública | `js/public/*` | V2 explícita y sanitizada |
| Portal | `js/publicPortal/*` | Separación de selectores, router y render |
| Broadcast | `js/broadcast/*` | Arquitectura por contratos y motores |
| Legacy | `js/views/*`, `grafico-*.html`, OBS/locutor/timer V1 | Aún presente |
| Backend | `functions/index.js` | Administración de usuarios focalizada |

## Arquitectura actual

```text
HTML interno
  -> tournamentApp.js
  -> app.js
       -> state.js/localStorage
       -> scoring.js/flow.js/statistics.js
       -> firebaseSync.js
            -> tournaments/{id}
            -> audit/publishedScores/{id}
            -> live/{id}
            -> publicTournaments/{id}

publicTournaments/{id}
  -> publicPortalClient.js
  -> portal selectors/router/render
  -> torneo-publico.html

live/current + tournaments
  -> Broadcast Data Contract
  -> Live Bindings
  -> Preview
  -> Program
  -> Output Routing
  -> Realtime Transport
  -> Program Main

Broadcast Data Contract
  -> Announcer projection
  -> Announcer Monitor

live/current
  -> vistas/gráficos/OBS V1
```

## Flujo oficial de score

```text
Captura en app.js
  -> score local/draft
  -> recordPublishedScore (revisión local)
  -> validateActiveCharreadaBeforePublish
  -> publishFirebaseOfficialScoreAtomic
       -> multipath privado:
          scores + publishedScores + audit + live/current + meta
       -> llamada separada:
          publishPublicTournamentSnapshot
             -> publicTournaments
  -> si privado ok, el calificador avanza aunque la proyección pública falle
```

La frontera privada es atómica dentro de una sola llamada `update`, pero el sistema completo no lo es. La proyección pública es una segunda operación sin outbox.

## Estado global y lifecycle

- `state.js` contiene torneo activo, charreada activa, índices de calificación, scores, publicaciones, historial, configuración y timer.
- `saveState` persiste el bloque completo/scoped en `localStorage`.
- `app.js` mantiene además estado de Firebase, diagnósticos, listeners, modales, drafts y estado visual.
- Los módulos Broadcast tienen lifecycle más explícito (`create`, `initialize`, `dispose`, `destroy`) y snapshots desacoplados.
- El portal V2 dispone listeners con cleanup y estados stale/offline.
- No existe un lifecycle uniforme de aplicación, repositorio o sesión en el core.

## Dependencias y acoplamiento

### Confirmado

- `app.js` mezcla rendering, permisos, formularios, calificación, publicación, Recovery, exportaciones y navegación.
- `firebaseSync.js` mezcla configuración SDK, Auth, usuarios, torneo, live, público, Broadcast, backups y auditoría.
- El estado de calificación y la publicación oficial se coordinan desde `app.js`.
- El portal y Broadcast consumen contratos distintos pero ambos dependen de una actualización correcta desde el core.

### Riesgo de doble instancia

La auditoría encontró 24 valores distintos de `?v=` en imports/HTML. Un módulo ES se identifica por URL completa, por lo que:

- `app.js` importa `firebaseSync.js` con una versión.
- `sync.js`, cargado dentro de la misma aplicación, importa el mismo archivo con otra versión.
- El navegador crea dos instancias del módulo.
- Se duplican variables de módulo como contadores de publicación y referencias SDK/listener.
- `state.js`, `sync.js`, `version.js` y `publicProjectionSchema.js` también aparecen con versiones múltiples.

Esto invalida la intención de `js/core/version.js` como versión central.

## Eventos y observadores

- `js/core/events.js` es un Event Engine en memoria y casi no desacopla el core.
- El core continúa llamando directamente Firebase y render.
- Firebase listeners se distribuyen entre app, vistas, portal y Broadcast.
- Los módulos V2 suelen implementar `dispose`; el core no tiene un registro global de listeners.
- No existe event log durable ni outbox común.

## Idempotencia, revisiones y concurrencia

| Área | Estado |
| --- | --- |
| Proyección pública | Transacción y revisión monotónica |
| Broadcast realtime | expected revision, idempotency y contexto |
| Program/Preview | Revisiones e identidad explícitas |
| Published score | ID único, pero revisión/supersesión local |
| Timer | Revisión de cliente sin autoridad transaccional |
| Delete tournament | Multipath parcial; cleanup posterior |
| Backup/restore | Sin restore/idempotencia |
| Event Engine core | Solo memoria |

La mejor disciplina de revisiones está en Broadcast. El área que define el resultado deportivo todavía no tiene el mismo control.

## Normalización y mutación

Fortalezas:

- Broadcast usa clonación/sanitización, límites y snapshots.
- Proyección pública tiene esquema y normalización separados.
- `??` se usa en campos de producción donde `0`, `false` y `""` deben conservarse.

Riesgos:

- `normalizePublishedScore` usa `Number(record.total || 0)` y transforma ausencia/`null`/`""` en cero.
- Varias compactaciones legacy usan `|| 0`, por lo que ausencia y cero no siempre son distinguibles.
- `recordPublishedScore` muta publicaciones anteriores en estado local al superseder.
- La compatibilidad obliga a normalizar el mismo concepto en varias fronteras.

## Legacy y duplicación

- Gráficos V1, OBS V1, locutor V1 y pantalla de cronómetro conviven con Broadcast V2.
- `broadcastAccessHub.js` solo aparece consumido por su test; el entrypoint activo usa Workspace.
- Existe builder público legacy dentro de `firebaseSync.js`, además de la proyección V2 modular.
- `publicProjectionLegacyAdapter.js` conserva compatibilidad.
- Las distintas versiones de import mantienen “versiones paralelas” en una misma página.

El legacy no debe eliminarse sin telemetría, pero debe declararse, congelarse y tener fecha de retiro.

## Rendimiento y escalabilidad

### 1-10 torneos / 5-20 dispositivos

Viable con operación supervisada. Los listeners y snapshots completos son aceptables, aunque la publicación pública adicional aumenta latencia.

### 100 torneos / 100 dispositivos

Riesgos:

- usuarios con `tournamentAccess=all` leen índices y datos amplios;
- lecturas completas de torneos para construir proyecciones;
- `app.js` y CSS grandes sin bundling;
- listeners duplicados por módulos versionados;
- falta de métricas de fanout/costos;
- escrituras repetidas de live/portal/Broadcast.

### 1,000 torneos históricos / 100 organizaciones

No viable como SaaS actual:

- no hay partición por tenant;
- no hay lifecycle/archive;
- no hay índices comerciales/uso;
- backups y auditoría crecen sin política de retención;
- no hay SLO, alertas ni capacity testing.

## Arquitectura recomendada

No se recomienda reescritura total. Se recomienda migración incremental:

```text
UI por rol
  -> Application Commands
       -> Domain Services
            -> Score Attempt Ledger
            -> Tournament Lifecycle
            -> Timer Authority
       -> Repositories
            -> Private Tournament Repository
            -> Audit Append-only Repository
            -> Public Projection Outbox
            -> Broadcast Projection Repository

Domain Events durables
  -> Projection Worker/Reconciler
       -> publicTournaments
       -> live public-compatible
       -> Broadcast contract
       -> statistics/history

Organization Context
  -> tenantId + organizationId + tournamentId
  -> authorization server/rules
  -> usage/entitlements

Local Operation
  -> durable event log/outbox
  -> deterministic reconciliation
  -> cloud sync
```

## Fronteras recomendadas

1. **ScoreCommandService**
   - expected attempt revision;
   - operación transaccional;
   - corrección y supersesión únicas;
   - evento `SCORE_PUBLISHED`.
2. **ProjectionOutbox**
   - registro durable tras escritura privada;
   - estado pending/retrying/completed/dead-letter;
   - reparación idempotente.
3. **AuditLedger**
   - append-only;
   - actor/autorización del servidor;
   - hash/lineage opcional.
4. **TournamentLifecycleService**
   - active/frozen/archived/deleted;
   - tombstone público;
   - cleanup verificado.
5. **TimerAuthority**
   - lease de controlador;
   - expected revision;
   - historial de transiciones.
6. **Module Identity**
   - imports sin query interna o con una sola URL generada;
   - versión solo en entrypoints.
7. **Organization Envelope**
   - introducir contexto sin migración destructiva;
   - reglas tenant-aware antes de billing.

## Decisiones que deben conservarse

- `publicTournaments` como única frontera pública.
- Contratos Broadcast y separación Preview/Program.
- Transacciones de revisión en proyección pública y Broadcast.
- Catálogos de competencias/suertes.
- Validación de charreada activa antes de publicar.
- Compatibilidad legacy controlada durante migración.

## Decisiones que deben refactorizarse

- `app.js` como coordinador universal.
- `firebaseSync.js` como repositorio universal.
- cache-busters por import interno.
- revisión oficial calculada localmente.
- auditoría mutable.
- Recovery sin restauración.
- `live/{id}` público como API general.
- autorización `all` como default.

## Orden arquitectónico

1. Outbox/reconciliación pública.
2. Ledger transaccional de score.
3. Auditoría inmutable.
4. Identidad única de módulos.
5. Timer authority.
6. Restore y lifecycle de torneo.
7. Repositorios por dominio.
8. Organization envelope.
9. Offline event log.
10. Editor Broadcast profesional.
