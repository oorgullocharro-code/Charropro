# Scorer Responsive Component Architecture

## Alcance

`CHARROPRO-SCORER-RESPONSIVE-COMPONENT-SYSTEM-001` extiende el calificador existente. No crea un scorer paralelo, no reemplaza el motor deportivo y no introduce reglas FMCH 2026. El shell sigue siendo `renderScoring()` en `js/app.js`; los modelos visuales comunes se construyen en `js/core/scorerComponents.js` a partir de Scoring Attempt V2 y del ruleset efectivo ya resuelto.

## Auditoria del scorer previo

| UI actual | Markup/componente | CSS principal | Handler | Estado propietario | Decision |
| --- | --- | --- | --- | --- | --- |
| Vista completa | `renderScoring()` | `.scoring-view`, `.scoring-main` | router existente | `state.ui`, scoring pointer | Extender |
| Header y contexto | `renderScoringHeader()`, `renderScoringContextBar()` | `.scoring-header`, `.scoring-context-grid` | ninguno | torneo, jornada y Attempt V2 | Refactorizar presentacion |
| Selector de suerte | navegacion de `renderScoring()` | `.scoring-tabs` | `setScoringSuerte` | `state.meta.scoringSuerteIdx` | Preservar |
| Turnos/equipos | `renderScoringTurnSelector()` | `.scoring-turns` | handlers existentes | charreada y scoring pointer | Preservar y adaptar |
| Oportunidades | `renderScoringOpportunityBar()` | `.scoring-opportunity-bar` | handlers existentes | Attempt V2 metadata | Extender |
| Calculador especializado | `renderScoringMainPanel()` | `.scoring-specialized-slot` | handlers de Cala existentes | `context.attempt` | Preservar |
| Reglas base/adicionales/infracciones | botones generados en `renderScoring()` | `.scoring-rule-grid`, `.scoring-rule-button` | `toggleRule` y handlers existentes | intento actual | Refactorizar presentacion |
| Manuales | formularios existentes | `.scoring-manual-form` | agregar/cancelar existente | intento actual | Extender con cancelar |
| Infracciones de equipo | bloque existente | `.team-penalties-panel` | handlers existentes | `teamPenalties` | Preservar y separar |
| DQ | selector existente | `.scoring-dq-panel` | handler existente | `attempt.dqReason` | Extender estado visual |
| Evidencia y nota | bloque existente | `.time-evidence-panel` | `openTimeEvidence`, `saveTimeEvidence` | `attempt.timeEvidence`, `attempt.note` | Preservar |
| Timer | `renderScoringTimerCard()` | `.scoring-timer-card` | controles existentes | timer actual | Reutilizar |
| Resumen | antes era suma visual dispersa | `renderScoringAttemptSummary()` | ninguno | Attempt V2 normalizado | Refactorizar |
| Footer | `renderScoringBottomBar()` | `.scoring-bottom-bar` | `previousScore`, `toggleAttemptZero`, `nextScore`, editor | estado de conexion/publicacion | Preservar y hacer sticky |
| Editor de botonera | modal existente | estilos de modal existentes | editor actual | effective rules/profile | Preservar |

## Flujo de datos

1. El Core conserva torneo, jornada, turno, intento y reglas.
2. `buildScoringAttemptV2Context()` produce el mismo contexto que usa la publicacion oficial.
3. `buildScorerAttemptViewModel()` normaliza la presentacion del Attempt V2 sin recalcular puntos.
4. `buildScorerRuleButtonModel()` recibe reglas efectivas; no mezcla base, profile y overrides.
5. `renderScoring()` compone el shell existente y delega los bloques visuales.
6. Los handlers existentes escriben sobre el intento actual; `nextScore()` mantiene draft, publicacion atomica y avance condicionado al exito.

## Fronteras

- `js/core/scorerComponents.js` es puro, no muta entradas y no persiste.
- `js/app.js` conserva eventos, navegacion y publicacion.
- `css/styles.css` define layout, touch targets y estados visuales, nunca puntuacion.
- Rule Profile Engine sigue siendo la fuente del ruleset efectivo.
- Attempt V2 sigue siendo la fuente del resumen y estados.
- `previousScore()`, `toggleAttemptZero()` y `nextScore()` no cambiaron de semantica.

## Decisiones A/B/C/D

- A, preservar: scorer, calculador de punta, timer, evidencia, nota, editor, footer y handlers oficiales.
- B, extender: contexto real, oportunidad, estado de DQ/zero, manuales, timer multiple/compartido y remate visual.
- C, refactorizar: resumen del intento y modelos de botones para consumir contratos aprobados.
- D, reemplazar: ninguno. No se elimino ningun bloque funcional.

## Compatibilidad

Torneos legacy continúan utilizando PRODUCT_BASE. `FMCH_2026_LIBRE` permanece como skeleton no activable. No se modificaron FieldID, formulas, catalogos deportivos ni proteccion de score.
