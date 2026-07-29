# CharroPro Master Audit - Resumen ejecutivo

## Alcance y corte

- Ticket: `CHARROPRO-MASTER-PRODUCT-TECHNICAL-AUDIT-001`.
- Corte auditado: commit `78a51f23ae1f2b13e48667041048b9624f57d6ae`.
- Rama: `main`, sincronizada con `origin/main` al iniciar la auditoría.
- Inventario: 223 archivos visibles por `rg --files`, 226 archivos rastreados por Git y aproximadamente 125,122 líneas de código/documentación de texto.
- Método: inspección estática completa, mapa de imports, revisión de reglas y rutas Firebase, trazado de flujos, ejecución segura de todas las suites existentes, validación sintáctica de JavaScript y auditoría de dependencias de Functions.
- Restricción: no se accedió ni escribió Firebase de producción; las afirmaciones sobre comportamiento remoto provienen de código, reglas y pruebas locales.

## Estado general

CharroPro tiene una base funcional amplia y valiosa: motor deportivo, operación por torneo, calificador, proyección pública V2 y una arquitectura Broadcast V2 considerable. No es un prototipo vacío. Sin embargo, el producto completo no puede considerarse listo para comercialización ni para seguir agregando desarrollos mayores porque persisten riesgos de integridad, consistencia y recuperación en los caminos más sensibles.

El estado real es:

- Producto utilizable de manera controlada por un equipo técnico conocedor.
- No confiable todavía como servicio SaaS multi-cliente.
- No recuperable de forma demostrable ante corrupción o eliminación.
- Vulnerable a divergencias entre datos oficiales y proyecciones públicas.
- Sin protección transaccional suficiente ante publicaciones simultáneas.
- Con permisos y rutas legacy más amplios que el modelo futuro requiere.
- Con cobertura local extensa en cantidad, pero insuficiente en integración real, concurrencia, reglas Firebase y navegador.

## Porcentaje real de avance

**Avance global ponderado: 53%.**

El porcentaje mide preparación de producto, no volumen de código. Cada área se calificó considerando funcionalidad (30%), calidad arquitectónica (15%), pruebas (15%), seguridad (15%), operabilidad/recuperación (15%) y documentación/preparación comercial (10%). Los pesos por área suman 100%.

| Área | Avance | Peso global | Observación |
| --- | ---: | ---: | --- |
| Motor deportivo | 76% | 15% | Reglas y cálculo existentes; publicación concurrente y normalización de ausencia/0 reducen confianza. |
| Administración | 58% | 10% | Torneos, programa, equipos, roles y resultados existen; faltan Master Data, archivo, papelera, importación y operación comercial. |
| Portal público | 70% | 8% | Frontera pública V2 segura y responsive; depende de una proyección que puede quedar pendiente. |
| Live Feed | 55% | 5% | Proyección persistida y limitada; no es un event log independiente ni tiene reparación durable. |
| Minuto a minuto | 50% | informativo | Se deriva de scores/feed/turno; comparte el riesgo de desincronización pública. |
| Usuarios y permisos | 55% | 6% | Auth y roles funcionan; el alcance por torneo es amplio y no existe aislamiento por organización. |
| Firebase y datos | 47% | 8% | Fuentes y proyecciones identificables; faltan transacciones de intento, validación privada profunda y consistencia de borrado. |
| Backups y recuperación | 30% | 5% | Exportación y backup remoto existen; no hay restauración, integridad, cifrado ni simulacros. |
| Broadcast Engine | 68% | 8% | Contratos, Preview, Program, Routing y salidas están implementados; aislamiento tenant es todavía conceptual. |
| Editor Broadcast | 35% | 4% | Workspace y presets declarativos; no existe editor profesional de layout/capas. |
| UX | 60% | 5% | Flujos ricos, pero alta densidad, preparación manual, mensajes parciales y dependencia de conocimiento técnico. |
| Testing | 45% | 6% | 44 suites pasan; predominan unit tests y aserciones estáticas, sin E2E real, emulator ni cobertura. |
| Seguridad | 48% | 6% | Denegación por defecto en raíz y contratos públicos; lectura pública de `live`, auditoría mutable y permisos amplios. |
| Documentación | 50% | 4% | Gran volumen de arquitectura/tickets; README y runbooks operativos están desactualizados o fragmentados. |
| SaaS | 15% | 4% | Sin suscripción, entitlement, facturación, métricas por cliente ni lifecycle comercial. |
| Multi-organización | 8% | 3% | El core no tiene `tenantId`/`organizationId`; Broadcast usa un tenant fijo. |
| Offline | 10% | 3% | Hay caché y drafts locales, pero no outbox, event log, reconciliación o autoridad LAN. |

## Fortalezas principales

1. **Dominio deportivo real.** Existen catálogos, reglas, calificación, equipos, participantes individuales y competencias internas.
2. **Publicación privada multipath.** Score, publicación, auditoría y `live/current` se escriben juntos en `publishFirebaseOfficialScoreAtomic`.
3. **Proyección pública V2 aislada.** El portal consume únicamente `publicTournaments`; no cae a rutas privadas.
4. **Reconciliación pública monotónica.** `publishPublicTournamentSnapshot` usa transacción y revisión de proyección.
5. **Broadcast por contratos.** Data Contract, State, Variables, Templates, Themes, Preview, Program, Routing y realtime están separados.
6. **Pruebas locales amplias por módulo.** Las 44 suites existentes pasan en el corte auditado.
7. **Control de charreada activa.** La publicación valida el contexto remoto antes de aceptar la calificación.
8. **Backups antes de eliminar.** La eliminación intenta crear un backup Firebase antes de borrar el torneo.

## Riesgos y bloqueos

### P0

1. **Publicación oficial parcial sin recuperación durable.** La escritura privada puede completar y fallar la proyección pública; el flujo avanza y libera el draft. No existe outbox/retry persistente.
2. **Publicación concurrente del mismo intento.** La revisión y supersesión se calculan localmente; dos dispositivos pueden registrar dos versiones activas.
3. **Auditoría sobrescribible.** Las reglas permiten reescribir un `audit/publishedScores/{recordId}` existente.
4. **Eliminación incompleta.** `deleteFirebaseTournament` no elimina/tombstonea `publicTournaments` ni sesiones Broadcast.
5. **Identidad duplicada de módulos.** 24 cache-busters distintos cargan el mismo módulo físico bajo varias URLs; `firebaseSync.js` se instancia más de una vez en la aplicación principal.
6. **Autoridad concurrente del cronómetro.** Juez y controlador dedicado publican al mismo nodo sin lease/transaction de autoridad.

### P1

- Conversión silenciosa de datos ausentes a `0` al normalizar publicaciones.
- `saveState` no contiene el fallo de `localStorage.setItem`.
- Lectura pública de todo `live/{tournamentId}`.
- Reglas privadas sin validación estructural suficiente para scores, publishedScores, history y meta.
- Recovery no restaura, no verifica integridad y puede exportarse por una ruta marcada como lectura.
- Falta de pruebas con Firebase Emulator, navegador real y concurrencia.
- Dependencias de Functions con 10 vulnerabilidades reportadas por npm audit y versiones directas declaradas como `latest`.

## Flujos con falla parcial

- Score privado/auditoría/live correctos, pero `publicTournaments` desactualizado.
- Turno o cronómetro actualizados en `live`, pero proyección pública fallida.
- Torneo eliminado, pero proyección pública y/o sesión Broadcast persistente.
- Datos del torneo eliminados, pero limpieza de accesos de usuarios fallida.
- Draft local guardado solo en el navegador; cierre del dispositivo conserva recuperación únicamente en ese perfil si `localStorage` funcionó.
- Reconexion o segundo publicador puede crear una corrección paralela sin supersesión remota única.

## Decisión ejecutiva

**NO GO para comercialización y para nuevos desarrollos mayores.**

Se recomienda permitir únicamente:

- corrección de incidentes P0;
- pruebas de regresión;
- instrumentación y recuperación;
- documentación operativa;
- migraciones controladas de identidad/versionado.

Debe detenerse temporalmente:

- nuevas funciones grandes del portal;
- expansión del editor Broadcast;
- NDI/video;
- suscripciones;
- modo offline;
- IA;
- nuevos módulos administrativos no relacionados con estabilización.

## Próximo ticket recomendado

`CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001`, ajustado para implementar una outbox durable, reintento idempotente, reconciliación y operación manual de reparación. Debe ejecutarse junto a un diseño inmediato del ledger transaccional de intentos oficiales; ninguno de los dos sustituye al otro.

## Dictamen

**NO APROBADO.**

La justificación completa está en `CHARROPRO_MASTER_AUDIT_FINAL_VERDICT.md`.
