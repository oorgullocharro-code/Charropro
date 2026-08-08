# Scorer Component Catalog

## Catalogo comun

| Name | Purpose | Inputs | Outputs/events | State ownership | Reused from | Used by | Responsive behavior | Sport logic |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ScorerShell | Componer una vista unica | jornada, contexto, Attempt V2 | handlers existentes | `state` existente | `renderScoring()` | 10 suertes | una columna base, ancho fluido | NO |
| ContextHeader | Mostrar contexto real | torneo, jornada, participante, caballo, estado | ninguno | fuente | header existente | 10 suertes | grid auto-fit y wrap | NO |
| OpportunityBar | Mostrar oportunidad y status | metadata Attempt V2 | seleccion existente | intento | barra existente | suertes con intentos | wrap y botones tactiles | NO |
| RuleButton | Representar una regla efectiva | id, label, value, source, category, selected, disabled | handler de regla | intento | boton existente | grids de reglas | altura adaptable, label wrap | NO |
| RuleButtonGrid | Distribuir reglas | `RuleButton[]` | eventos de botones | ninguno | grids existentes | bases/adicionales/infracciones | auto-fit sin overflow | NO |
| ScorerSection | Separar bloques operativos | titulo, contenido, estado | ninguno | ninguno | secciones existentes | todos los bloques | spacing comun | NO |
| SpecializedCalculatorSlot | Reservar calculadores | contenido especializado | handlers especializados | intento | panel principal | Cala y futuros | ancho completo, sin grid forzado | NO |
| EvidencePanel | Capturar tiempo y nota | timer e intento | guardar/eliminar evidencia | intento | bloque existente | 10 suertes | inputs fluidos | NO |
| TimerGroup | Mostrar uno o varios timers | descriptores de timer | controles existentes | timer externo | timer actual | todas/futuras | grid auto-fit | NO |
| SharedTimerReference | Mostrar referencia compartida | id, label, status, owner | ninguno | fuente externa futura | nuevo modelo visual | Terna futura | bloque compacto | NO |
| ClassificationSlot | Seleccionar clasificacion | opciones TEST/DUMMY y rules efectivas | `classificationId` | intento | nuevo modelo visual | Toro/Yegua/Paso futuros | grid fluido | NO |
| RemateHistory | Mostrar historial declarativo | items normalizados | ninguno | Attempt V2/futuro | nuevo modelo visual | Pial Ruedo/Manganas | lista con wrap | NO |
| AttemptSummary | Mostrar breakdown oficial | Attempt V2 normalizado | ninguno | Attempt V2 | resumen existente | 10 suertes | grid adaptable | NO |
| AttemptFooter | Mantener acciones criticas | conexion, permiso, publicacion | editor, previous, zero, next | app existente | footer existente | 10 suertes | sticky, safe area, wrap | NO |

## Builders puros

`js/core/scorerComponents.js` exporta:

- `buildScorerAttemptViewModel()`;
- `buildScorerRuleButtonModel()`;
- `buildScorerClassificationModel()`;
- `buildScorerTimerGroup()`;
- `buildSharedTimerReference()`;
- `buildScorerRemateHistory()`;
- `SCORER_COMPONENT_SYSTEM_VERSION`;
- `SCORER_RESPONSIVE_BREAKPOINTS`.

## Matriz por suerte

| Suerte | Componentes comunes | Zona especializada preservada/preparada |
| --- | --- | --- |
| Cala | ContextHeader, OpportunityBar, RuleGrid, Evidence, Summary, Footer | Calculador de punta actual |
| Piales | ContextHeader, OpportunityBar, RuleGrid, Evidence, Summary, Footer | Base y adicionales futuros |
| Colas | ContextHeader, OpportunityBar, RuleGrid, Evidence, Summary, Footer | espacio para diagrama oficial futuro |
| Toro | ContextHeader, ClassificationSlot, RuleGrid, Evidence, Summary, Footer | clasificacion dinamica futura |
| Terna Lazo Cabecero | ContextHeader, SharedTimerReference, RuleGrid, Summary, Footer | pantalla independiente con estado compartido futuro |
| Terna Pial Ruedo | ContextHeader, SharedTimerReference, RemateHistory, RuleGrid, Summary, Footer | pantalla independiente con estado compartido futuro |
| Yegua | ContextHeader, ClassificationSlot, RuleGrid, Evidence, Summary, Footer | clasificacion dinamica futura |
| Manganas a Pie | ContextHeader, OpportunityBar, RemateHistory, TimerGroup, RuleGrid, Summary, Footer | floreo compacto futuro |
| Manganas a Caballo | ContextHeader, OpportunityBar, RemateHistory, TimerGroup, RuleGrid, Summary, Footer | floreo compacto futuro |
| Paso de la Muerte | ContextHeader, ClassificationSlot, TimerGroup, RuleGrid, Summary, Footer | timer principal y secundario futuros |

Las filas describen capacidad visual, no catalogos ni valores deportivos implementados.
