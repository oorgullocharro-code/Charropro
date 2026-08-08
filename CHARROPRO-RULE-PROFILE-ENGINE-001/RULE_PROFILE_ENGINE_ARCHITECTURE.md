# Rule Profile Engine Architecture

## 1. Control

- Ticket: `CHARROPRO-RULE-PROFILE-ENGINE-001`.
- Base: `c0d983751340b9ef7f0ac47325dfada85b2fa07d`.
- Contrato: `1.0.0`.
- Alcance: capa de resolucion reglamentaria sobre el scorer existente.
- Reglas deportivas nuevas: ninguna.
- Migracion productiva: ninguna.

## 2. Auditoria del sistema existente

El sistema ya tenia una frontera central. No se creo un scorer paralelo.

```text
SOURCE
  js/data/suertes.js + js/data/calaRules.js
  + settings.globalRuleOverrides
  + tournament.ruleOverrides
LOAD
  js/core/state.js (normalizacion y restauracion)
RESOLVE
  getTournamentSuertes()
  getCharreadaScoringSuertes()
RENDER
  buildScoringActionButtons()
  renderScoringActionAccordions()
  renderRuleEditor()
CALCULATE
  toggleRule()
  calculateAttemptTotal()
  calculatePuntaBreakdown()
PERSIST
  state.scores
  publishFirebaseOfficialScoreAtomic()
  publishedScores + official ledger + audit + public projection
```

Hallazgos:

1. `getTournamentSuertes()` ya era el resolver compartido por scorer, resultados, historial, estadisticas, exportacion y Broadcast.
2. La botonera general reemplazaba por grupo el catalogo de producto.
3. La convocatoria del torneo reemplazaba por grupo el resultado general.
4. El editor ya usaba `enabled:false` para ocultar reglas heredadas y eliminacion fisica solo para reglas custom.
5. Manual additional, manual infringement y team penalties viven en el intento, fuera del catalogo permanente.
6. Cala conserva un calculador especializado de punta.
7. Existe la colision legacy `toro:adic:ttm` / `toro:infr:ttm` dentro de `attempt.applied`.

## 3. Decision arquitectonica

Se extendio `getTournamentSuertes()` y se agrego un modulo puro de contrato y merge en `js/data/ruleProfiles.js`.

No se creo:

- otro scorer;
- otro store;
- otra ruta Firebase;
- otro sistema de calculo;
- otro editor;
- un evaluador de codigo.

`resolveTournamentRules()` resuelve el perfil una vez y delega cada suerte a `resolveEffectiveRules()`. `getTournamentSuertes()` conserva su API y devuelve el arreglo de suertes para todos los consumidores existentes.

## 4. Flujo final

```text
SUERTES (Product Base)
  -> botonera general existente (Product Base administrada)
  -> Rule Profile exacto por ID + version
  -> convocatoria/override del torneo
  -> catalogo efectivo activo
  -> botonera, calculo, persistencia y publicacion existentes
```

Las reglas deshabilitadas no llegan a la botonera, pero permanecen en `allRules` para diagnostico. Cada regla efectiva incluye `ruleId`, `ruleKey`, `category`, `source` y `origin`.

## 5. Identidad

La identidad del resolver es:

```text
suerteId:category:ruleId
```

Esto permite distinguir categorias sin renombrar IDs legacy. El campo `id` se conserva como alias compatible para la botonera y los intentos actuales.

La colision `ttm` se reporta como `legacy-cross-category-rule-id-collision`. No se migra ni se reinterpreta historial en este ticket. La separacion fisica de ambos IDs requiere migracion compatible posterior.

## 6. Perfil inicial

`FMCH_2026_LIBRE` existe en version `0.1.0` y estado `skeleton`.

- no contiene reglas deportivas activas;
- no puede seleccionarse para calificar;
- declara que Cala usa el calculador especializado existente;
- prepara identidad y versionado para el ticket de carga deportiva posterior.

El estado `skeleton` evita presentar como vigente un perfil incompleto.

## 7. Persistencia

No se agrega namespace Firebase.

| Dato | Ubicacion |
| --- | --- |
| Definicion/version del perfil | Modulo versionado de producto |
| Seleccion | `tournament.ruleProfileId` + `tournament.ruleProfileVersion` |
| Fallback autorizado | `tournament.ruleProfileFallback = product_base` |
| Convocatoria | `tournament.ruleOverrides` existente |
| Botonera general | `settings.globalRuleOverrides` existente |
| Contexto del score | `breakdown.rulebook` del score oficial |

Los serializadores de torneo ya conservan campos adicionales mediante spread, por lo que no se requiere una rama ni una migracion de datos.

## 8. Historico

El score oficial conserva:

- contrato de resolucion;
- profile ID/version o Product Base;
- capas aplicadas;
- version especializada de Cala cuando corresponde;
- timestamp del override de torneo cuando existe;
- puntos y desglose oficiales ya calculados.

Cambiar un perfil no recorre ni recalcula `state.scores`, `publishedScores`, ledger, audit o public snapshot.

## 9. Reutilizacion

| Componente | Decision | Resultado |
| --- | --- | --- |
| `SUERTES` / `calaRules` | Reutilizado | Product Base intacta |
| `getTournamentSuertes` | Extendido | Frontera unica de resolucion |
| `globalRuleOverrides` | Reutilizado | Semantica de base general preservada |
| `tournament.ruleOverrides` | Reutilizado | Convocatoria aislada por torneo |
| Editor visual | Extendido minimo | Identifica reglas heredadas de perfil |
| Botonera | Reutilizada | Consume catalogo efectivo |
| `toggleRule` / scoring | Reutilizado | Sin formulas nuevas |
| Punta de Cala | Reutilizada | `specialized_calculator` |
| Manuales / team penalties / DQ | Reutilizados | Fuera del merge permanente |
| Publicacion atomica | Reutilizada | Contexto agregado en `rulebook` |
| `ruleProfiles.js` | Nuevo | Contrato, validacion y merge puros |

## 10. Limites

No se implementan reglas FMCH 2026 completas, tablas dinamicas, Terna compartida, timers reglamentarios, calculadores compactos, perfiles USA/Mayor/Juvenil, migracion `ttm`, UI de seleccion, nuevas rutas Firebase ni recalculo historico.
