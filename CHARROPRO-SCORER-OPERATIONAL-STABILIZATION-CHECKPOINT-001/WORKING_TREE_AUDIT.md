# Working Tree Audit

## Resultado

- Base auditada: `2729ccfa6cd1978653fec7ec7a70525a50f5bbf0`.
- Rama: `main`.
- Staging inicial: vacio.
- Cambios desconocidos: 0.
- Archivos excluidos: 0.
- Decision: todos los archivos siguientes pertenecen a trabajos aprobados o al cierre mecanico/documental del checkpoint.

## Categorias

- A: cambio funcional.
- B: cambio UX/CSS.
- C: prueba.
- D: documentacion.
- E: cache-buster/versionado mecanico.
- F: configuracion LOCAL/EMULATOR.

Las filas E cambian exclusivamente la referencia runtime desde el identificador anterior al cache-buster unico del checkpoint. `configuration.defaults.json` tambien actualiza su checksum/fingerprint derivado.

| Path | Categoria | Ticket de origen | Proposito | Incluir | Justificacion |
| --- | --- | --- | --- | --- | --- |
| `announcer-monitor.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `broadcast-studio.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `cronometro-pantalla.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `cronometro.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `css/styles.css` | B | PREPOLISH/OVC002 | Layouts aprobados de Manganas y Paso | YES | UX aprobada y responsive |
| `formato-federacion.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `functions/configuration.defaults.json` | E | OVC002/CHECKPOINT | Version canonica y checksum derivado | YES | Mantiene baseline verificable |
| `grafico-cala-detalle.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-caladero-turno.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-categoria.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-coleadero-turno.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-coleadero.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-cronometro.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-marcador.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-ranking.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `grafico-turno.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `graficos.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita modulos mezclados |
| `index.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Entrada consistente |
| `js/app.js` | A | PREPOLISH/OVC002/TRC003 | Pending, Coleadero, Terna, UI y perfil local | YES | Integra contratos aprobados |
| `js/broadcast/announcerMonitor.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Regresion Broadcast consistente |
| `js/broadcast/broadcastStudioWorkspace.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Regresion Broadcast consistente |
| `js/broadcast/outputSynchronization.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Regresion Output consistente |
| `js/broadcast/productionConsole.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Regresion Broadcast consistente |
| `js/broadcast/programMainOutput.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Regresion Program consistente |
| `js/core/exporters.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/core/firebaseSync.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/core/flow.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Conserva autoridad unica |
| `js/core/history.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/core/localRuleProfileDefaults.js` | F | TRC003 | Perfil FMCH solo en LOCAL/EMULATOR | YES | Corrige frontera local sin Produccion |
| `js/core/officialFormat.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/core/pendingScoreReview.js` | A | OVC002 | Reconciliacion monotonica | YES | Preserva revision y CAS |
| `js/core/scorerComponents.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/core/scoring.js` | A | OVC002 | Lider global de Coleadero | YES | Elimina resultado final por equipo |
| `js/core/state.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/core/statistics.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/core/sync.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/data/fmch2026TernaRules.js` | A | OVC002 | Rol y terminacion canonica de Terna | YES | Cierra 2/5 o 3/5 sin O extra |
| `js/data/ruleProfiles.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Valores deportivos intactos |
| `js/data/suertes.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Catalogo Product Base intacto |
| `js/publicPortal/portalApp.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Regresion Portal consistente |
| `js/tournamentApp.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Entrada torneo consistente |
| `js/views/cronometro-control.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Timer Authority intacta |
| `js/views/cronometro-pantalla.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Timer Display consistente |
| `js/views/formato-federacion.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Evita imports mezclados |
| `js/views/grafico.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Graphics consistente |
| `js/views/graficos-control.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Graphics consistente |
| `js/views/jueces.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Vista juez consistente |
| `js/views/locutores.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Vista locutor consistente |
| `js/views/obs.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | OBS V1 consistente |
| `js/views/supervision.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Supervision consistente |
| `js/views/torneo-publico.js` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Portal legacy consistente |
| `jueces.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Entrada juez consistente |
| `locutores.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Entrada locutor consistente |
| `obs.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Entrada OBS consistente |
| `production-console.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Consola consistente |
| `program-main-output.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Program Main consistente |
| `supervision.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Supervision consistente |
| `tests/announcer-monitor.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster del fixture | YES | Prueba carga runtime actual |
| `tests/broadcast-studio-workspace.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster del fixture | YES | Prueba carga runtime actual |
| `tests/fixtures/fmch-jineteos-runtime.html` | E | OVC002/CHECKPOINT | Cache-buster del fixture | YES | Fixture coherente |
| `tests/fixtures/fmch-piales-coleadero-runtime.html` | E | OVC002/CHECKPOINT | Cache-buster del fixture | YES | Fixture coherente |
| `tests/fixtures/public-portal-ux.html` | E | OVC002/CHECKPOINT | Cache-buster del fixture | YES | Fixture coherente |
| `tests/fixtures/publicPortalUxFixture.js` | E | OVC002/CHECKPOINT | Cache-buster del fixture | YES | Fixture coherente |
| `tests/fixtures/scorer-responsive-viewport.html` | E | OVC002/CHECKPOINT | Cache-buster del fixture | YES | Fixture coherente |
| `tests/fmch-2026-cala-scorer.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion carga runtime actual |
| `tests/fmch-2026-terna-complete.test.mjs` | C | OVC002 | Cierre temprano y agotamiento | YES | Cobertura determinista de Terna |
| `tests/full-scorer-integration.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion carga runtime actual |
| `tests/output-synchronization.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion Output actual |
| `tests/pending-score-review-workflow.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion carga runtime actual |
| `tests/production-console.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion consola actual |
| `tests/production-nav.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion navegacion actual |
| `tests/public-live-feed-integration.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion feed actual |
| `tests/public-portal-core.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion Portal actual |
| `tests/public-snapshot-cache-coherence.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion snapshot actual |
| `tests/scorer-responsive-components.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion viewport actual |
| `tests/team-penalties-zero.test.mjs` | E | OVC002/CHECKPOINT | Cache-buster de prueba | YES | Regresion carga runtime actual |
| `tests/terna-operational-flow.test.mjs` | C | OVC002 | Matriz de rol y cierre temprano | YES | Cobertura Flow/Terna aprobada |
| `tools/development/localRuntimeSeed.mjs` | F | TRC003 | Reusar asignacion FMCH local | YES | Evita duplicacion del perfil fixture |
| `torneo-publico.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Portal legacy consistente |
| `torneo.html` | E | OVC002/CHECKPOINT | Cache-buster runtime | YES | Scorer carga runtime unico |
| `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/COLEADERO_GLOBAL_LEADER_CONTRACT.md` | D | OVC002 | Contrato de Coleadero | YES | Evidencia aprobada |
| `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/FILES_CHANGED.md` | D | OVC002 | Inventario del ticket | YES | Trazabilidad |
| `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/IMPLEMENTATION_SUMMARY.md` | D | OVC002 | Resumen del ticket | YES | Trazabilidad |
| `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/PASO_LAYOUT_CONTRACT.md` | D | OVC002 | Contrato de Paso | YES | Evidencia UX |
| `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/PENDING_REVIEW_RECONCILIATION.md` | D | OVC002 | Contrato Pending | YES | Evidencia CAS |
| `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/TERNA_ROLE_TRANSITION_CONTRACT.md` | D | OVC002 | Contrato de Terna | YES | Evidencia funcional |
| `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/TEST_EVIDENCE.md` | D | OVC002 | Evidencia de pruebas | YES | Trazabilidad |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/CATALOG_RESOLUTION_TRACE.md` | D | TRC003 | Traza de catalogo | YES | Evidencia de origen |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/FILES_CHANGED.md` | D | TRC003 | Inventario del ticket | YES | Trazabilidad |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/IMPLEMENTATION_SUMMARY.md` | D | TRC003 | Resumen del ticket | YES | Trazabilidad |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/LOCAL_RESET_SEED_AUDIT.md` | D | TRC003 | Auditoria del seed | YES | Evidencia LOCAL/EMULATOR |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/NEW_CHARREADA_INHERITANCE_AUDIT.md` | D | TRC003 | Herencia de perfil | YES | Evidencia de frontera |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/ROOT_CAUSE.md` | D | TRC003 | Diagnostico Product Base | YES | Causa raiz reproducible |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/RULE_PROFILE_TRACE.md` | D | TRC003 | Traza del perfil | YES | Integridad productiva |
| `CHARROPRO-TERNA-RULE-CATALOG-RESOLUTION-AUDIT-003/TEST_EVIDENCE.md` | D | TRC003 | Evidencia de pruebas | YES | Trazabilidad |
| `tests/operational-validation-corrections-002.test.mjs` | C | OVC002 | Pending, Coleadero, Terna y Paso | YES | Cobertura dirigida |
| `tests/scoring-ui-final-polish.test.mjs` | C | PREPOLISH | Manganas y captura manual | YES | Preserva polish aprobado |
| `tests/terna-rule-catalog-resolution-audit-003.test.mjs` | C | TRC003 | Perfil local, catalogo y Terna | YES | Cobertura dirigida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/FILES_CHANGED.md` | D | CHECKPOINT | Resumen de archivos | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/FUNCTIONAL_CONTRACTS.md` | D | CHECKPOINT | Contratos consolidados | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/IMPLEMENTATION_SUMMARY.md` | D | CHECKPOINT | Resumen del checkpoint | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/KNOWN_LIMITATIONS.md` | D | CHECKPOINT | Limitaciones vigentes | YES | Evita sobredeclarar cierre |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/NEXT_ROADMAP.md` | D | CHECKPOINT | Secuencia autorizada | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/RESPONSIVE_CHECKPOINT.md` | D | CHECKPOINT | Evidencia responsive | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/RULE_PROFILE_CHECKPOINT.md` | D | CHECKPOINT | Estado del perfil | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/TERNA_CHECKPOINT.md` | D | CHECKPOINT | Estado de Terna | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/TEST_EVIDENCE.md` | D | CHECKPOINT | Resultado final de pruebas | YES | Evidencia requerida |
| `CHARROPRO-SCORER-OPERATIONAL-STABILIZATION-CHECKPOINT-001/WORKING_TREE_AUDIT.md` | D | CHECKPOINT | Inventario exhaustivo | YES | Evidencia requerida |

## Confirmaciones negativas

- Categoria G: 0 archivos.
- Firebase Rules modificadas: no.
- Dependencias modificadas: no.
- Valores deportivos modificados para resolver el perfil: no.
- Output Routing funcionalmente modificado: no.
- Archivos temporales, binarios o credenciales: no.
