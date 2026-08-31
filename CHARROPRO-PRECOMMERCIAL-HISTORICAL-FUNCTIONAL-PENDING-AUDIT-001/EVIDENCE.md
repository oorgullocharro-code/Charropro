# Evidence

## Directed Tests

Se ejecutaron `47` suites dirigidas unicas, todas con exit code `0`.

### Terna

- `tests/terna-operational-flow.test.mjs`
- `tests/fmch-2026-terna-complete.test.mjs`
- `tests/terna-rule-catalog-resolution-audit-003.test.mjs`

### Portal Publico

- `tests/public-portal-selectors.test.mjs`
- `tests/public-portal-client.test.mjs`
- `tests/public-portal-router.test.mjs`
- `tests/public-portal-partial-standings.test.mjs`
- `tests/public-snapshot-cache-coherence.test.mjs`
- `tests/public-projection.test.mjs`
- `tests/public-portal-core.test.mjs`
- `tests/public-portal-ux.test.mjs`
- `tests/public-portal-design-system-v2.test.mjs`

### Scorer, Contexto Y Acceso

- `tests/scorer-information-hierarchy-compaction.test.mjs`
- `tests/scorer-workspace-viewport-compaction.test.mjs`
- `tests/scorer-responsive-components.test.mjs`
- `tests/full-scorer-integration.test.mjs`
- `tests/scorer-save-latency.test.mjs`
- `tests/scorer-context-late-assignment.test.mjs`
- `tests/scorer-screen-by-screen-ux-refinement.test.mjs`
- `tests/judge-cross-tournament-denied.test.mjs`
- `tests/judge-multiple-tournament-access.test.mjs`
- `tests/judge-no-tournament-bootstrap.test.mjs`
- `tests/judge-single-tournament-access.test.mjs`
- `tests/production-supervisor-scorer-context.test.mjs`
- `tests/supervisor-current-permissions.test.mjs`
- `tests/tournament-context.test.mjs`
- `tests/new-tournament-fmch-scorer-readiness.test.mjs`

### Outputs Y Timer Visible

- `tests/official-timer-consumer-parity.test.mjs`
- `tests/official-field-timer-responsive-display.test.mjs`
- `tests/grafico-cronometro-obs-responsive-layout.test.mjs`
- `tests/scorer-global-official-timer-reactivity.test.mjs`
- `tests/broadcast-data-contract.test.mjs`
- `tests/output-synchronization.test.mjs`
- `tests/production-console.test.mjs`
- `tests/browser-output.test.mjs`
- `tests/broadcast-output.test.mjs`

### Supervisor, Backup Y Delete

- `tests/supervisor-navigation.test.mjs`
- `tests/tournament-delete-authority.test.mjs`
- `tests/tournament-delete-client-adapter.test.mjs`
- `tests/tournament-delete-nan-serialization.test.mjs`
- `tests/precommercial-tournament-deletion-policy.test.mjs`
- `tests/backup-storage-bucket-authority.test.mjs`
- `tests/backup-foundation.test.mjs`

### Publicacion Oficial

- `tests/official-score-concurrency.test.mjs`
- `tests/fmch-cala-overtime-official-publication.test.mjs`
- `tests/public-projection-outbox.test.mjs`
- `tests/public-live-feed-integration.test.mjs`
- `tests/public-projection.test.mjs`

## Browser/HTTP Read-Only

- `https://orgullocharro.com/charropro/torneo-publico.html` carga el shell V2,
  muestra estado seguro `Falta el torneo` y no genera errores de consola.
- `grafico-marcador.html`, `grafico-ranking.html`, `grafico-cronometro.html`,
  `cronometro-pantalla.html`, `grafico-cala-detalle.html`,
  `grafico-coleadero.html` y `grafico-coleadero-turno.html` cargan sin errores y
  muestran empty state explicito cuando falta `tournamentId`.
- La configuracion publica servida reporta build
  `20260831-firebase-functions-node22-runtime-migration-001-v1` y
  `releaseStatus=precommercial`.
- Las proyecciones publicas de los tres IDs historicos conocidos respondieron
  `null`; no existe evidencia productiva poblada disponible para certificar
  estados activo/finalizado sin crear datos.
- Production writes: `0`.

## Evidence By Boundary

### Terna

`js/data/fmch2026TernaRules.js` deriva la siguiente suerte exclusivamente de
`headCounted` y `pialCounted`. `js/app.js` llama esa derivacion despues de la
publicacion oficial y avanza fuera de Terna cuando la sesion queda COMPLETED.

### Portal And Rankings

`js/publicPortal/portalRender.js` implementa Inicio, Rankings, Resultados y
Sabana. Inicio muestra tres lideres; `js/views/grafico.js` aplica un limite de
10 al grafico ranking. En V2, `js/public/publicProjection.js` deja la seccion
`rankings` como unavailable y construye filas de resultado con una clave que
incluye `charreadaId`. El Portal ordena esas filas, pero no dispone de una
autoridad agregada de ranking de torneo multi-charreada.

El comparator interno de standings en `js/core/scoring.js` considera promedio,
total, puntos negativos, mejor resultado y nombre. No existe una prueba dirigida
que certifique ese contrato completo ni su paridad con Portal/outputs.

### Scorer

`renderScoringHeader()` integra contexto de torneo, charreada, suerte,
participante, caballo y oportunidad. `renderScoringTeamCards()` muestra cada
equipo, la seleccion activa y `getTeamCharreadaTotal()`.

### Functions Deployment

El checkpoint Node22 certifico solo diez Functions productivas. El script
`functions/package.json#scripts.deploy` enumera las 17 exportaciones fuente,
incluidas siete que no existen en Produccion. El riesgo es operativo y no cambia
comportamiento runtime mientras no se ejecute ese script.

## Marker And Route Review

- No se encontraron `test.skip`, `describe.skip`, `it.skip`, `xit`, `xdescribe`
  ni TODO de test activos.
- Los terminos `legacy`, `fallback`, `pending` y `deprecated` encontrados
  corresponden principalmente a compatibilidad, estados canonicos o adapters.
- Se compararon 149 acciones estaticas de `js/app.js` con handlers de click,
  change/input y navegacion `data-view`; no se demostro un boton huerfano.
