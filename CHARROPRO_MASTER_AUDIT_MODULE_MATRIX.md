# CharroPro Master Audit - Matriz de módulos

## Claves

- **A. TERMINADO Y VALIDADO**
- **B. FUNCIONAL CON DEUDA MENOR**
- **C. PARCIALMENTE IMPLEMENTADO**
- **D. INTERFAZ SIN IMPLEMENTACIÓN COMPLETA**
- **E. IMPLEMENTADO CON RIESGO CRÍTICO**
- **F. ROTO**
- **G. LEGACY**
- **H. NO IMPLEMENTADO**
- **I. NO VERIFICABLE**

La clasificación se asigna por evidencia del repositorio auditado, no por nombre de ticket o existencia de un archivo.

## Matriz

| Módulo | Ubicación principal | Propósito/productor/consumidor | Clase | Evidencia y riesgo | Pruebas/docs | Recomendación |
| --- | --- | --- | --- | --- | --- | --- |
| Entrada administrativa | `index.html`, `js/app.js` | Entrada, roles, navegación, coordinación global | C | Funcional, pero `app.js` concentra 12,209 líneas y múltiples responsabilidades | Tests de navegación parcial; despliegue extenso | Separar controladores por dominio después de P0 |
| Portal de torneo interno | `torneo.html`, `js/tournamentApp.js` | Resolver torneo y cargar app | B | Entrada clara y con contexto; hereda riesgos del core | `tournament-context.test.mjs` | Mantener; reducir cache-busters |
| Gestión de torneos | `js/app.js`, `js/core/firebaseSync.js` | Crear, editar, congelar y eliminar | E | Borrado no retira proyección pública/Broadcast; cleanup puede fallar después | Tests contextuales, no lifecycle remoto | Tombstone y borrado consistente |
| Gestión de charreadas/programa | `js/app.js`, `js/core/flow.js` | Programa, fases, competencia y equipos | B | Funcional con compatibilidad legacy | Tests indirectos | Añadir integración de ciclo de vida |
| Competencias internas | `js/data/competitionTypes.js` | Catálogo y suertes por competencia | A | Contrato pequeño, explícito y reutilizado | Tests indirectos/tickets | Conservar como fuente única |
| Participantes individuales | `js/app.js`, `js/core/state.js` | Participantes embebidos por jornada | C | Funciona sin IDs maestros; no es Master Data | Tests de contexto | Migración futura a entidades canónicas |
| Equipos y roster | `js/app.js`, `js/core/state.js` | Unidad legacy por equipo | B | Funcional; identidad ligada a torneo | Tests de penalties/contexto | Añadir IDs y deduplicación futura |
| Caballos | Campos embebidos en equipos/participantes | Nombre operativo | C | No existe catálogo, propietario, historial ni `horseId` global | Sin tests dedicados | `MASTER-DATA-HORSES-001` |
| Calificador | `js/app.js`, `js/core/scoring.js` | Captura, validación y flujo de juez | E | El cálculo funciona, pero publicación concurrente y parcial afectan resultado operativo | Cala, penalties, contexto | Ledger transaccional y outbox |
| Reglas de cala | `js/data/calaRules.js` | Reglas deportivas de cala | A | Módulo focalizado, prueba dedicada pasa | `cala-rules.test.mjs` | Congelar cambios sin ticket deportivo |
| Catálogo de suertes | `js/data/suertes.js` | IDs, nombres, intentos y tipos | B | Contrato central útil; convive con normalizaciones legacy | Tests indirectos | Documentar contrato canónico |
| Scoring general | `js/core/scoring.js` | Cálculos y agregación | B | Cobertura focal y reutilización; no se detectó recálculo público paralelo | Tests de penalties/cala | Ampliar propiedades y cobertura |
| Draft local | `js/core/state.js`, `js/core/localCache.js` | Persistencia del score en edición | C | Recupera en el mismo navegador; `saveState` no contiene errores de storage | Sin test de quota/cierre | Persistencia segura y outbox |
| Publicación oficial | `publishFirebaseOfficialScoreAtomic` | Score, published, audit y live multipath | E | Privado atómico, proyección pública separada; no hay retry durable | Tests estáticos/fixtures | P0 de recuperación pública |
| Correcciones de score | `recordPublishedScore`, publishedScores | Crear revisión y superseder anterior | E | Revisión/supersesión local; concurrencia remota no controlada | Sin prueba multi-cliente real | Ledger por `attemptKey` |
| Auditoría de publicados | `audit/publishedScores` | Copia de evidencia oficial | E | Reescribible por reglas; no es append-only | Test estático de reglas | Inmutabilidad/server writer |
| Turno oficial | `live/{id}/turn`, Broadcast contract | Fuente operativa del turno | B | El contrato distingue turno de último score | Tests Broadcast | Añadir autoridad/revisión transaccional |
| Cronómetro de juez | `js/app.js`, `js/core/timerRules.js` | Inicio/pausa/reinicio y publicación | E | Dos controladores pueden escribir sin lease; sin historial durable | Tests Broadcast, no concurrencia | Autoridad única y event log |
| Control de cronómetro | `cronometro.html`, `js/views/cronometro-control.js` | Interfaz dedicada | C | Funcional, comparte nodo/autoridad con calificador | Sin E2E | Consolidar protocolo de control |
| Pantalla legacy de cronómetro | `cronometro-pantalla.html`, vista | Salida visual antigua | G | Existe fuera del Output V2 | Sin test específico moderno | Declarar deprecación/migración |
| Resultados internos | `js/app.js`, `js/core/statistics.js` | Ranking, tabla general, sábana | B | Separación por competencia implementada; depende de publishedScores consistentes | Tests indirectos | Casos reales multi-competencia |
| Estadísticas históricas | `js/core/statistics.js`, `js/core/history.js` | Snapshots y análisis | C | Persistencia existe; modelo histórico no está plenamente gobernado | Sin cobertura dedicada amplia | Versionar esquema y lineage |
| Formato oficial | `js/core/officialFormat.js`, vista | Exportación/formato federación | B | Funcional, con Google Apps Script adicional | Tests sintácticos, no golden files | Fixtures de exportación |
| Exportaciones | `js/core/exporters.js`, `js/core/xlsx.js` | CSV/XLSX/JSON | B | Utilidad operativa; no se auditó roundtrip | Sin pruebas dedicadas de integridad | Golden files y validación |
| Importaciones | No existe módulo completo | Ingreso controlado de datos | H | No hay importación canónica/validada | Ninguna | Diseñar después de Master Data |
| Dashboard interno | `js/app.js` | Resumen y accesos por rol | B | Existe y es funcional; alta dependencia del controlador monolítico | Navegación parcial | Desacoplar selectores |
| Supervisión | `supervision.html`, `js/views/supervision.js` | Vista de supervisor | B | Existe y consume estado | `supervisor-navigation.test.mjs` | Añadir E2E por rol |
| Jueces | `jueces.html`, `js/views/jueces.js` | Acceso del juez | B | Interfaz conectada; reglas permiten escrituras amplias | Tests indirectos | Endurecer reglas por campo |
| Locutores legacy | `locutores.html`, `js/views/locutores.js` | Vista operativa V1 | G | Reemplazada en parte por Announcer Monitor V2 | Sin E2E | Plan de retiro |
| Gráficos V1 | `graficos.html`, `grafico-*.html`, vistas | Salidas OBS históricas | G | Siguen presentes y operables, paralelas a Broadcast V2 | Pruebas indirectas | Inventario de consumidores y migración |
| OBS V1 | `obs.html`, `js/views/obs.js` | Control/salida legacy | G | No integrado al Output V2 oficial | Sin E2E | Mantener congelado hasta migración |
| Roles y capacidades UI | `js/core/roles.js`, `js/app.js` | Menús y acciones por rol | C | Funciona, pero `READ_ACTIONS` elude capability para backups | Navegación/roles indirectos | Unificar policy engine |
| Firebase Authentication | `js/core/firebaseSync.js`, Functions | Sesión y perfil | B | Auth real y callable supervisor; lifecycle de usuario incompleto | Sin emulator | Invitación, reset, auditoría de sesión |
| Gestión de usuarios | `js/app.js`, `functions/index.js` | Alta/edición/desactivación | C | Callable protegido; no hay organizaciones/invitaciones/eliminación | Tests de navegación, no callable | Lifecycle de identidad |
| Firebase RTDB core | `js/core/firebaseSync.js` | Persistencia y realtime | E | Central, grande y duplicable por imports versionados; reglas privadas laxas | Pruebas estáticas | Identidad única + repositorios por dominio |
| Reglas Firebase | `firebase-rules-auditoria.json` | Autorización y validación | E | Root deny, pero `live` público, audit mutable y datos privados sin esquema profundo | Dos tests estáticos | Emulator y hardening |
| Proyección pública V2 | `js/public/publicProjection.js` | Snapshot público sanitizado | E | Diseño sólido; publicación no forma parte de la operación atómica privada | Tests públicos amplios | Outbox/reconciliador |
| Esquema público V2 | `js/public/publicProjectionSchema.js` | Validación del snapshot | B | Contrato explícito; puede cargarse bajo URLs distintas | Tests de foundation | Import canónico único |
| Adaptador público legacy | `js/public/publicProjectionLegacyAdapter.js` | Compatibilidad V1 -> V2 | G | Necesario solo para legado | Tests públicos | Medir uso y retirar |
| Portal público V2 | `torneo-publico.html`, `js/publicPortal/*` | Programa, resultados, live, filtros | B | Solo consume `publicTournaments`, maneja stale/offline | Suites de portal, no browser real | E2E responsive/accesibilidad |
| Vista pública legacy | `js/views/torneo-publico.js` | Portal anterior/compatibilidad | G | Ruta paralela a portalApp V2 | Tests indirectos | Retiro después de telemetría |
| Live Feed público | `js/public/publicLiveFeed.js`, portal models | Feed persistido/derivado | C | Ligado a la proyección; no es event log durable | Varias suites pasan | Event log/reparación |
| Minuto a minuto | Portal/liveFeed templates | Presentación cronológica | C | Mezcla eventos explícitos y scores derivados | Tests de templates | Definir semántica de corrección/eliminación |
| Recovery Center local | `js/app.js` | JSON manual, historial y salud | D | Descarga funciona; estado “protegido” no prueba integridad/restauración | Sin roundtrip | Restore verificable |
| Backup Firebase | `createFirebaseTournamentBackup` | Copia privada antes de borrado | C | Guarda core privado; no incluye proyección/audit/Broadcast y no restaura | Sin prueba restore | Manifest/checksum/restore |
| Event Engine | `js/core/events.js` | Eventos en memoria | C | API base; solo memoria y mínima integración | Sin suite dedicada visible | Persistencia y captura automática después de P0 |
| Broadcast Data Contract | `js/broadcast/dataContract.js` | Contrato sanitizado universal | B | Implementado y probado; integración productiva depende de contexto | Suite dedicada | Mantener contrato |
| Broadcast State | `js/broadcast/broadcastState.js` | Preview/Program/queue/output state | B | Revisión y protección de Program probadas | Suite dedicada | Pruebas E2E reales |
| Production Variables | `js/broadcast/productionVariables.js` | Variables por scope | B | Prioridad y seguridad probadas localmente | Suite dedicada | Persistencia/tenant real futura |
| Action Engine | `js/broadcast/actionEngine.js` | Acciones declarativas | B | Separación de Program documentada y probada | Suite dedicada | Auditoría persistente futura |
| Component Library/Renderer | `componentLibrary.js`, `componentRenderer.js` | Catálogo y DOM seguro | B | Módulos puros y tests dedicados | Suites dedicadas | Visual regression real |
| Template/Theme engines | `templateEngine.js`, `themeEngine.js` | Configuración declarativa | B | Inmutabilidad y sanitización cubiertas | Suites dedicadas | Catálogo productivo |
| Theme/Template integration | `themeTemplateIntegration.js` | Preparación temática | B | Correctivos y pruebas reales locales | Suite dedicada | Performance/browser soak |
| Preview Engine | `previewEngine.js` | Preparación/render previo | B | Identidad y live updates implementados | Suite dedicada | Browser E2E |
| Program Engine | `programEngine.js` | Estado oficial al aire | B | Separado de Preview y data-only update | Suite dedicada | Prueba remota multi-cliente |
| Program Projection | Program/Output routing | Composición declarativa | B | Conserva composición y revisiones | Suite dedicada | Telemetría operativa |
| Output Routing | `outputRouting.js` | Enrutar Program a salidas | B | Contrato e idempotencia cubiertos | Suite dedicada | Backpressure/observabilidad |
| Browser Output común | `browserOutput.js`, `browser-output.html` | Infraestructura web de salida | B | Funcional y probada | Suite dedicada | Empaquetado y soporte |
| Program Main Output | `programMainOutput.js`, HTML/CSS | Salida oficial Program | B | Realtime y composición implementados | Suite dedicada | Validación cross-device repetible |
| Announcer Monitor | `announcerMonitor.js`, HTML/CSS | Contexto operativo de locutor | B | Canal independiente, stale/offline | Suite dedicada | Datos/NDI futuros |
| Broadcast realtime transport | `broadcastRealtimeTransport.js`, Firebase | Sesiones, revisiones y acceso temporal | C | Implementado; tenant fijo y pruebas sin producción | Suites de transport/rules | Tenant real + emulator |
| Broadcast Workspace | `broadcastStudioWorkspace.js`, HTML/CSS | Cabina unificada | C | Operativa con presets; no editor profesional | Suite workspace | UX operativa y catálogo real |
| Production Console | `productionConsole.js`, HTML/CSS | Laboratorio/control técnico | B | Amplia, pero compleja y orientada a operadores expertos | Suite dedicada | Separar diagnóstico de operación |
| Broadcast Access Hub | `broadcastAccessHub.js` | Acceso anterior | G | Solo referenciado por test; workspace activo usa otro entrypoint | Suite dedicada | Retirar cuando se confirme no uso |
| Asset Manager | `assetManager.js` | Registro y resolución en memoria | C | Modelo completo; no Storage/UI/persistencia | Suite dedicada | Integrar almacenamiento después de P0 |
| Timer Display V2 | Modelo/rutas parciales, tarjeta deshabilitada | Salida oficial Broadcast del timer | D | Contrato/placeholder, sin salida V2 operativa dedicada | Cobertura indirecta | Ticket separado |
| Editor profesional Broadcast | No existe | Layout/layers visuales | H | Presets declarativos no equivalen a editor | Ninguna | Fase 5 |
| NDI/video/audio Broadcast | Placeholder | Señal audiovisual profesional | H | No implementado | Ninguna | Fase 5, no antes |
| Master Data | Documentos de arquitectura | Charros/caballos/equipos canónicos | H | Solo lineamientos, no modelo operativo | Ninguna | Fase 2 |
| Organizaciones/tenants core | No existe | Aislamiento SaaS | H | Rutas core no tienen tenant; Broadcast fija uno | Ninguna | Fase 3 |
| Suscripciones/facturación | No existe | Comercialización SaaS | H | Sin planes, entitlement, billing ni grace period | Ninguna | Fase 3 |
| Papelera/archivo/restauración | No existe de punta a punta | Recuperación administrativa | H | Borrado es permanente después de backup no restaurable | Ninguna | Fase 2 |
| Modo offline/Arena | No existe | Operación LAN y reconciliación | H | Caché local no forma una arquitectura offline | Ninguna | Fase 4 |
| Functions de usuarios | `functions/index.js` | Administración Auth segura | C | Callable focal; dependencias vulnerables y `latest` | Sin emulator | Pinning y pruebas |
| Google Apps Script | `google-apps-script/*` | Formato federación/hojas | C | Integración auxiliar separada, operación no verificada | Sin suite | Documentar ownership/deprecación |
| Documentación técnica | `*.md` | Arquitectura y tickets | C | Extensa pero fragmentada; README desactualizado | No aplica | Baseline y runbooks |
| Observabilidad | Consola/logs locales | Diagnóstico | C | Muchos logs, sin métricas/SLO/alertas centralizadas | Sin pruebas | Fase 1 |

## Resumen de clasificación

- A: contratos deportivos focales con evidencia suficiente.
- B: funcionalidades operativas con deuda acotada.
- C/D: módulos parciales o visibles sin cierre de lifecycle.
- E: publicación, Firebase, auditoría, cronómetro y eliminación por riesgo de integridad/producción.
- G: rutas V1 y adaptadores conservados.
- H: capacidades comerciales, multi-organización, offline, editor profesional y restauración real.
- I: no se usó para afirmar estados que sí podían resolverse por evidencia; la validación real contra producción se registra como limitación, no como sustituto de la clasificación.
