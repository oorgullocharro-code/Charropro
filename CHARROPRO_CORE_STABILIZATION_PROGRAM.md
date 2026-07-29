# CharroPro Core Stabilization Program

## 1. Identidad del programa

| Campo | Valor |
| --- | --- |
| Nombre | Programa Maestro de Estabilización, Confiabilidad y Preparación Comercial |
| Código | `CHARROPRO-CORE-STABILIZATION-PROGRAM-001` |
| Versión | `1.0.0` |
| Estado | ACTIVO |
| Owner técnico | Pendiente de asignación |
| Owner de producto | Pendiente de asignación |
| Auditoría de origen | `CHARROPRO-MASTER-PRODUCT-TECHNICAL-AUDIT-001` |
| Commit base auditado | `78a51f23ae1f2b13e48667041048b9624f57d6ae` |
| Rama objetivo | `main` |
| Fecha de creación | 2026-07-29 |
| Fecha de última revisión | 2026-07-29 |
| Autoridad documental | Este archivo |

### Historial de versiones

| Versión | Fecha | Cambio | Autor | Tickets afectados |
| --- | --- | --- | --- | --- |
| 1.0.0 | 2026-07-29 | Creación inicial del programa rector a partir de la auditoría maestra | Pendiente de asignación | `CHARROPRO-CORE-STABILIZATION-PROGRAM-001` |

### Estado inicial obligatorio

```text
Programa: ACTIVO
Hito actual: CSP-M1 — Integridad transaccional
Gate CSP-M1: NO APROBADO
Tickets P0 aprobados: 0/6
Próximo ticket autorizado:
CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001
```

Este estado no implica que el próximo ticket esté implementado ni aprobado. Únicamente autoriza su análisis y ejecución controlada después de validar su propio baseline.

## 2. Resumen ejecutivo

CharroPro posee un dominio deportivo funcional y especializado. La administración de torneos, el calificador, los resultados, el Portal Público V2 y Broadcast Studio V2 representan una base de producto y arquitectura valiosa.

El bloqueo principal no es la falta de pantallas. El producto requiere estabilizar:

- integridad de publicaciones oficiales;
- concurrencia de scores;
- recuperación de proyecciones;
- autoridad del cronómetro;
- inmutabilidad de auditoría;
- lifecycle de eliminación;
- identidad única de módulos;
- reglas y permisos;
- restauración;
- observabilidad y operación reproducible.

Este programa no autoriza una reescritura total. La estrategia es incremental:

1. reproducir el riesgo;
2. aislar una frontera;
3. introducir contrato, revisión o persistencia durable;
4. validar con pruebas del nivel adecuado;
5. conservar compatibilidad controlada;
6. documentar rollback y evidencia;
7. emitir dictamen explícito.

La prioridad es estabilizar antes de expandir. La meta del programa es alcanzar un nuevo dictamen de:

**APROBADO PARA COMERCIALIZACIÓN CONTROLADA**

Ese dictamen solo puede provenir de una nueva auditoría integral después de completar los gates requeridos.

## 3. Estado base

| Evidencia | Baseline |
| --- | --- |
| Audit ticket | `CHARROPRO-MASTER-PRODUCT-TECHNICAL-AUDIT-001` |
| Audited commit | `78a51f23ae1f2b13e48667041048b9624f57d6ae` |
| Audit verdict | NO APROBADO |
| Product readiness | 53% |
| Test baseline | 44/44 passing |
| JavaScript syntax | OK |
| Functions dependency audit | 10 vulnerabilidades |
| Low | 1 |
| Moderate | 9 |
| High | 0 |
| Critical | 0 |

### Alcance de la evidencia base

- 44/44 pruebas aprobadas no equivalen a preparación productiva.
- La mayoría de las pruebas son unitarias, contractuales, in-memory o estáticas.
- No existe validación suficiente de concurrencia real.
- No existe restore verificable.
- No existe una suite Firebase Emulator completa.
- No existe navegador E2E del journey completo.
- No existen pruebas de carga y soak suficientes.
- No existe validación prolongada de dispositivos reales.
- No existe un recovery drill productivo.
- La auditoría no modificó Firebase, reglas, dependencias, datos ni infraestructura.
- El working tree estaba limpio al iniciar la auditoría maestra.
- Los 13 reportes de auditoría quedaron posteriormente como archivos nuevos sin staging; no son cambios de producto.

### Reportes de autoridad

- `CHARROPRO_MASTER_AUDIT_EXECUTIVE_SUMMARY.md`
- `CHARROPRO_MASTER_AUDIT_MODULE_MATRIX.md`
- `CHARROPRO_MASTER_AUDIT_ARCHITECTURE.md`
- `CHARROPRO_MASTER_AUDIT_FIREBASE.md`
- `CHARROPRO_MASTER_AUDIT_PRODUCT.md`
- `CHARROPRO_MASTER_AUDIT_BROADCAST.md`
- `CHARROPRO_MASTER_AUDIT_SECURITY.md`
- `CHARROPRO_MASTER_AUDIT_TESTING.md`
- `CHARROPRO_MASTER_AUDIT_FINDINGS.md`
- `CHARROPRO_MASTER_AUDIT_ROADMAP.md`
- `CHARROPRO_MASTER_AUDIT_TICKETS.md`
- `CHARROPRO_MASTER_AUDIT_EVIDENCE.md`
- `CHARROPRO_MASTER_AUDIT_FINAL_VERDICT.md`

## 4. Principios rectores

### 4.1 Integridad antes que expansión

No iniciar módulos mayores mientras exista un bloqueo P0 abierto o el gate CSP-M1 permanezca NO APROBADO.

### 4.2 Fuente de verdad explícita

Toda proyección pública, live, Broadcast, estadística o histórica debe declarar:

- fuente oficial;
- transformación;
- revisión;
- productor;
- consumidor;
- mecanismo de reconciliación.

Ninguna proyección puede convertirse silenciosamente en fuente oficial.

### 4.3 Recuperabilidad

Toda operación crítica debe contar con:

- estado durable;
- reintento;
- reparación automática;
- reparación manual;
- rollback o compensación;
- procedimiento operativo;
- estado visible;
- evidencia de recuperación.

### 4.4 Idempotencia y concurrencia

Las operaciones críticas deben tolerar:

- reintentos;
- doble clic;
- reconexión;
- clientes simultáneos;
- mensajes duplicados;
- estado stale;
- revisiones desactualizadas;
- ejecución repetida después de timeout.

### 4.5 Auditoría verificable

Los eventos oficiales deben ser append-only y conservar:

- actor;
- fecha;
- origen;
- revisión;
- relación de corrección;
- identificador idempotente;
- lineage;
- contexto autorizado;
- evidencia de rechazo cuando corresponda.

### 4.6 Evidencia antes de aprobación

Un ticket no se aprueba solo por:

- compilar;
- pasar pruebas unitarias;
- mostrar una interfaz;
- no generar errores visibles;
- producir una respuesta afirmativa;
- contener archivos con el nombre esperado;
- funcionar una vez en un fixture.

### 4.7 Evolución incremental

No permitir una reescritura total de:

- `app.js`;
- `firebaseSync.js`;
- Firebase;
- Portal Público;
- Broadcast Studio.

La extracción de módulos debe ocurrir por fronteras pequeñas, con contrato y regresión.

### 4.8 Compatibilidad controlada

El legacy puede mantenerse temporalmente, pero debe:

- inventariarse;
- congelarse;
- medirse;
- documentarse;
- asignar owner;
- contar con plan y criterio de retiro.

### 4.9 Seguridad por defecto

Aplicar:

- acceso explícito;
- mínima capacidad por rol;
- mínima exposición pública;
- validación de esquema;
- separación por tenant cuando corresponda;
- denegación ante contexto ambiguo.

### 4.10 Separación de riesgos

No mezclar en un ticket riesgos independientes como:

- proyección pública;
- concurrencia de score;
- auditoría;
- cronómetro;
- eliminación;
- identidad de módulos;
- seguridad;
- restore.

## 5. Estructura de hitos

## Hito 1 — CSP-M1 — Integridad transaccional

### Objetivo

Eliminar los seis riesgos P0 del sistema activo.

### Secuencia oficial inicial

1. `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001`
2. `OFFICIAL-SCORE-CONCURRENCY-001`
3. `AUDIT-IMMUTABILITY-001`
4. `CORE-RUNTIME-MODULE-IDENTITY-001`
5. `TOURNAMENT-DELETION-CONSISTENCY-001`
6. `TIMER-AUTHORITY-CONCURRENCY-001`

El orden solo puede cambiar mediante una revisión versionada de este programa y aprobación explícita de los owners asignados.

### Gate de salida

CSP-M1 solo puede declararse APROBADO cuando:

- una proyección pública fallida permanece registrada como pendiente reparable;
- existe reparación automática;
- existe reparación manual;
- los reintentos son idempotentes;
- dos clientes no pueden dejar dos versiones activas del mismo intento;
- existe una cabeza canónica por `attemptKey`;
- una corrección supersede de forma autoritativa la versión anterior;
- la auditoría no puede sobrescribirse;
- un torneo eliminado no permanece públicamente visible;
- las sesiones Broadcast asociadas se limpian, cierran o tombstonean;
- una única autoridad controla el timer;
- el timer usa expected revision o mecanismo equivalente;
- el mismo módulo ES no se carga con múltiples identidades URL;
- existen pruebas de integración o Emulator para concurrencia, reglas y flujos críticos.

### Estado inicial

```text
Gate CSP-M1: NO APROBADO
P0 abiertos: 6
P0 aprobados: 0
```

## Hito 2 — CSP-M2 — Confiabilidad operativa

### Objetivo

Asegurar que cualquier incidente pueda detectarse, diagnosticarse, reproducirse y recuperarse.

### Iniciativas mínimas

- `FIREBASE-PRIVATE-SCHEMA-RULES-001`
- `TEST-INFRA-E2E-EMULATOR-001`
- `SCORE-MISSING-VS-ZERO-001`
- `PUBLIC-LIVE-DATA-MINIMIZATION-001`
- `TOURNAMENT-ACCESS-EXPLICIT-GRANTS-001`
- `RECOVERY-EXPORT-AUTHORIZATION-001`
- `LOCAL-STATE-RESILIENCE-001`
- `RECOVERY-RESTORE-001`
- `RECOVERY-VERIFIED-STATUS-001`
- `OBSERVABILITY-FOUNDATION-001`
- `FUNCTIONS-DEPENDENCY-HARDENING-001`
- `DOCUMENTATION-OPERATIONS-BASELINE-001`
- `LEGACY-ENTRYPOINT-DEPRECATION-001`

### Gate de salida

- Firebase Emulator activo.
- Matriz por rol ejecutada.
- Reglas privadas validadas por esquema.
- E2E juez -> score -> portal -> Broadcast aprobado.
- Concurrencia de score probada.
- Concurrencia del timer probada.
- Restore completo probado.
- Restore parcial probado o formalmente descartado con justificación.
- Runbook de incidente vigente.
- Runbook de restore vigente.
- Publicación y proyección con métricas.
- No existe conversión silenciosa de ausencia a cero.
- Dependencias fijadas.
- Política de vulnerabilidades documentada.
- Entrypoints V1/V2 inventariados.
- Observabilidad mínima operativa.

### Estado inicial

`NOT_STARTED`. CSP-M2 no puede cerrarse antes de CSP-M1.

## Hito 3 — CSP-M3 — Cierre del producto actual

### Objetivo

Cerrar el ciclo de vida del producto existente antes de iniciar SaaS.

### Capacidades mínimas

- restore productivo controlado;
- archivo;
- papelera;
- tombstone;
- recuperación administrativa;
- gestión completa de usuarios;
- importaciones gobernadas;
- UX operativa;
- documentación base;
- historial y estadísticas gobernadas;
- descomposición incremental del core;
- runbooks de operación.

### Iniciativas rectoras

- `TOURNAMENT-LIFECYCLE-ARCHIVE-001`
- `USER-IDENTITY-LIFECYCLE-001`
- `CORE-APPLICATION-DECOMPOSITION-001`
- `RECOVERY-RESTORE-001`
- `DOCUMENTATION-OPERATIONS-BASELINE-001`
- Importación gobernada, con ID por asignar en ticket separado.
- Gobierno histórico/estadístico, con ID por asignar en ticket separado.
- UX operativa bajo presión, con ID por asignar en ticket separado.

### Gate de salida

- Borrar no significa perder sin recuperación.
- Un operador nuevo puede ejecutar un evento mediante documentación.
- Las acciones destructivas tienen confirmación y recuperación.
- El ciclo de torneo cubre:
  - preparación;
  - activo;
  - finalizado;
  - archivado;
  - eliminado;
  - restaurado.
- Los flujos principales cuentan con E2E.
- Recovery deja de ser solo exportación.
- Un backup se considera verificado únicamente después de restore exitoso.

### Estado inicial

`NOT_STARTED`.

## Hito 4 — CSP-M4 — Fundación SaaS

### Objetivo

Permitir múltiples organizaciones con aislamiento verificable.

### Capacidades mínimas

- `ORGANIZATIONS-FOUNDATION-001`
- `MASTER-DATA-001`
- `SAAS-ENTITLEMENTS-001`
- `SAAS-BILLING-001`
- `BROADCAST-MULTITENANT-CONTEXT-001`
- `tenantId`;
- `organizationId`;
- usage metering;
- cost metering;
- soporte;
- consentimiento;
- retención;
- exportación por organización;
- eliminación por organización;
- Broadcast multi-tenant.

### Gate de salida

- Dos organizaciones no pueden leer datos cruzados.
- Dos organizaciones no pueden escribir datos cruzados.
- Roles y grants pertenecen a una organización.
- Suspensión no elimina datos.
- Reactivación conserva continuidad.
- Uso y costo son medibles.
- Cada sesión Broadcast deriva tenant y organization desde contexto autorizado.
- Existe lifecycle comercial documentado.
- Existe aislamiento probado con Emulator y E2E.

### Estado inicial

`NOT_STARTED`.

## Hito 5 — CSP-M5 — Expansión profesional

### Objetivo

Habilitar nuevas líneas de producto sobre un núcleo aprobado.

### Líneas permitidas después del gate

- CharroPro Arena;
- operación offline;
- servidor LAN;
- event log offline;
- reconciliación cloud;
- Broadcast multi-tenant;
- Asset Storage;
- Scene Catalog;
- Layout Editor;
- Timer Display V2;
- bridges OBS/vMix;
- NDI;
- video;
- audio;
- replay;
- macros;
- automatización;
- analítica;
- IA.

### Iniciativas identificadas

- `ARENA-OFFLINE-FOUNDATION-001`
- `ARENA-LAN-AUTHORITY-001`
- `BROADCAST-ASSET-STORAGE-001`
- `BROADCAST-LAYOUT-EDITOR-001`
- `BROADCAST-TIMER-DISPLAY-001`
- `BROADCAST-PRO-OUTPUTS-001`
- `SCALE-ARCHIVE-OBSERVABILITY-001`

### Condición de inicio

No iniciar CSP-M5 hasta que una nueva auditoría emita, como mínimo:

**APROBADO PARA COMERCIALIZACIÓN CONTROLADA**

### Estado inicial

`NOT_STARTED`.

## 6. Matriz maestra del programa

`Pendiente` indica que el dato debe registrarse al iniciar/cerrar el ticket y no constituye omisión de evidencia.

| Orden | Ticket | Hito | Riesgo | Prioridad | Estado | Dependencias | Responsable | Commit inicial | Commit final | Pruebas | Evidencia | Rollback | Dictamen | Observaciones |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001 | CSP-M1 | Proyección pública divergente | P0 | READY | Baseline auditado | Pendiente de asignación | Pendiente | Pendiente | Por definir en ticket | Pendiente | Pendiente | Pendiente | Próximo ticket autorizado |
| 2 | OFFICIAL-SCORE-CONCURRENCY-001 | CSP-M1 | Doble cabeza activa | P0 | NOT_STARTED | Ticket 1 y diseño ledger | Pendiente de asignación | Pendiente | Pendiente | Concurrencia/Emulator | Pendiente | Pendiente | Pendiente | Separado de outbox |
| 3 | AUDIT-IMMUTABILITY-001 | CSP-M1 | Auditoría sobrescribible | P0 | NOT_STARTED | Emulator | Pendiente de asignación | Pendiente | Pendiente | Rules/append-only | Pendiente | Pendiente | Pendiente | No mezclar con score ledger |
| 4 | CORE-RUNTIME-MODULE-IDENTITY-001 | CSP-M1 | Instancias ES duplicadas | P0 | NOT_STARTED | Import graph | Pendiente de asignación | Pendiente | Pendiente | Static/browser | Pendiente | Pendiente | Pendiente | Sin refactor general |
| 5 | TOURNAMENT-DELETION-CONSISTENCY-001 | CSP-M1 | Datos/sesiones huérfanas | P0 | NOT_STARTED | Política tombstone | Pendiente de asignación | Pendiente | Pendiente | Emulator/lifecycle | Pendiente | Pendiente | Pendiente | Prueba no destructiva |
| 6 | TIMER-AUTHORITY-CONCURRENCY-001 | CSP-M1 | Dos autoridades timer | P0 | NOT_STARTED | Protocol/revision | Pendiente de asignación | Pendiente | Pendiente | Concurrencia/reconnect | Pendiente | Pendiente | Pendiente | Conservar reglas deportivas |
| 7 | FIREBASE-PRIVATE-SCHEMA-RULES-001 | CSP-M2 | Payload privado inválido | P1 | NOT_STARTED | Emulator | Pendiente de asignación | Pendiente | Pendiente | Rules matrix | Pendiente | Pendiente | Pendiente | Migración legacy |
| 8 | TEST-INFRA-E2E-EMULATOR-001 | CSP-M2 | Regresión no detectada | P1 | NOT_STARTED | Fixtures | Pendiente de asignación | Pendiente | Pendiente | Emulator/browser | Pendiente | Pendiente | Pendiente | Gate transversal |
| 9 | SCORE-MISSING-VS-ZERO-001 | CSP-M2 | Falso cero | P1 | NOT_STARTED | Schema/fixtures | Pendiente de asignación | Pendiente | Pendiente | Null/zero cases | Pendiente | Pendiente | Pendiente | Compatibilidad histórica |
| 10 | PUBLIC-LIVE-DATA-MINIMIZATION-001 | CSP-M2 | Exposición live | P1 | NOT_STARTED | Migración V1 | Pendiente de asignación | Pendiente | Pendiente | Rules/consumers | Pendiente | Pendiente | Pendiente | No romper outputs legacy |
| 11 | TOURNAMENT-ACCESS-EXPLICIT-GRANTS-001 | CSP-M2 | Acceso all | P1 | NOT_STARTED | Perfil migration | Pendiente de asignación | Pendiente | Pendiente | Roles/Emulator | Pendiente | Pendiente | Pendiente | Deny-by-default |
| 12 | RECOVERY-EXPORT-AUTHORIZATION-001 | CSP-M2 | Export no autorizado | P1 | NOT_STARTED | Policy tests | Pendiente de asignación | Pendiente | Pendiente | Roles/UI | Pendiente | Pendiente | Pendiente | Auditar exportación |
| 13 | LOCAL-STATE-RESILIENCE-001 | CSP-M2 | Falla localStorage | P1 | NOT_STARTED | Cache policy | Pendiente de asignación | Pendiente | Pendiente | Quota/storage | Pendiente | Pendiente | Pendiente | No fingir persistencia |
| 14 | RECOVERY-RESTORE-001 | CSP-M2/CSP-M3 | Backup no restaurable | P1 | NOT_STARTED | Schema/lifecycle | Pendiente de asignación | Pendiente | Pendiente | Restore drill | Pendiente | Pendiente | Pendiente | No producción primero |
| 15 | RECOVERY-VERIFIED-STATUS-001 | CSP-M2 | Falsa protección | P1 | NOT_STARTED | Restore/checksum | Pendiente de asignación | Pendiente | Pendiente | Status/manifest | Pendiente | Pendiente | Pendiente | Estado basado en evidencia |
| 16 | OBSERVABILITY-FOUNDATION-001 | CSP-M2 | Incidente invisible | P1 | NOT_STARTED | Correlation IDs | Pendiente de asignación | Pendiente | Pendiente | Metrics/alerts | Pendiente | Pendiente | Pendiente | Score -> portal -> Broadcast |
| 17 | FUNCTIONS-DEPENDENCY-HARDENING-001 | CSP-M2 | Supply chain | P1 | NOT_STARTED | Functions tests | Pendiente de asignación | Pendiente | Pendiente | Audit/Emulator | Pendiente | Pendiente | Pendiente | Fijar versiones |
| 18 | DOCUMENTATION-OPERATIONS-BASELINE-001 | CSP-M2/CSP-M3 | Operación no reproducible | P1 | NOT_STARTED | Decisiones P0 | Pendiente de asignación | Pendiente | Pendiente | Docs drill | Pendiente | Pendiente | Pendiente | README/runbooks |
| 19 | LEGACY-ENTRYPOINT-DEPRECATION-001 | CSP-M2 | V1/V2 ambiguo | P1 | NOT_STARTED | Telemetría | Pendiente de asignación | Pendiente | Pendiente | Consumer inventory | Pendiente | Pendiente | Pendiente | No borrar sin medir |
| 20 | TOURNAMENT-LIFECYCLE-ARCHIVE-001 | CSP-M3 | Lifecycle incompleto | P2 | NOT_STARTED | Delete/restore | Pendiente de asignación | Pendiente | Pendiente | Lifecycle E2E | Pendiente | Pendiente | Pendiente | Archivo/papelera |
| 21 | USER-IDENTITY-LIFECYCLE-001 | CSP-M3 | Usuario parcial | P2 | NOT_STARTED | Auth Emulator | Pendiente de asignación | Pendiente | Pendiente | Auth/roles | Pendiente | Pendiente | Pendiente | Invite/reset/revoke |
| 22 | CORE-APPLICATION-DECOMPOSITION-001 | CSP-M3 | Monolitos | P2 | NOT_STARTED | CSP-M1 + tests | Pendiente de asignación | Pendiente | Pendiente | Regression | Pendiente | Pendiente | Pendiente | Incremental |
| 23 | ORGANIZATIONS-FOUNDATION-001 | CSP-M4 | Sin tenant | P2 | NOT_STARTED | CSP-M1-M3 | Pendiente de asignación | Pendiente | Pendiente | Cross-tenant | Pendiente | Pendiente | Pendiente | Gate SaaS |
| 24 | MASTER-DATA-001 | CSP-M4 | Identidad deportiva fragmentada | P2 | NOT_STARTED | Organizations/governance | Pendiente de asignación | Pendiente | Pendiente | Merge/privacy | Pendiente | Pendiente | Pendiente | No publicar privados |
| 25 | SAAS-ENTITLEMENTS-001 | CSP-M4 | Sin límites de plan | P2 | NOT_STARTED | Organizations/usage | Pendiente de asignación | Pendiente | Pendiente | Entitlement E2E | Pendiente | Pendiente | Pendiente | Suspensión reversible |
| 26 | SAAS-BILLING-001 | CSP-M4 | Sin lifecycle comercial | P2 | NOT_STARTED | Entitlements | Pendiente de asignación | Pendiente | Pendiente | Webhook/idempotency | Pendiente | Pendiente | Pendiente | Financiero |
| 27 | BROADCAST-MULTITENANT-CONTEXT-001 | CSP-M4 | Tenant fijo | P2 | NOT_STARTED | Organizations | Pendiente de asignación | Pendiente | Pendiente | Cross-tenant realtime | Pendiente | Pendiente | Pendiente | Derivar contexto |
| 28 | ARENA-OFFLINE-FOUNDATION-001 | CSP-M5 | Sin event log local | P3 | NOT_STARTED | Nueva auditoría | Pendiente de asignación | Pendiente | Pendiente | Offline/reconcile | Pendiente | Pendiente | Pendiente | Congelado |
| 29 | ARENA-LAN-AUTHORITY-001 | CSP-M5 | Sin autoridad LAN | P3 | NOT_STARTED | Arena foundation | Pendiente de asignación | Pendiente | Pendiente | LAN/failover | Pendiente | Pendiente | Pendiente | Congelado |
| 30 | BROADCAST-ASSET-STORAGE-001 | CSP-M5 | Assets solo memoria | P3 | NOT_STARTED | Tenant/rights | Pendiente de asignación | Pendiente | Pendiente | Storage/security | Pendiente | Pendiente | Pendiente | Congelado |
| 31 | BROADCAST-LAYOUT-EDITOR-001 | CSP-M5 | Editor inexistente | P3 | NOT_STARTED | Assets/scenes | Pendiente de asignación | Pendiente | Pendiente | Visual/E2E | Pendiente | Pendiente | Pendiente | Congelado |
| 32 | BROADCAST-TIMER-DISPLAY-001 | CSP-M5 | Output parcial | P3 | NOT_STARTED | Timer authority | Pendiente de asignación | Pendiente | Pendiente | Output/stale | Pendiente | Pendiente | Pendiente | Congelado |
| 33 | BROADCAST-PRO-OUTPUTS-001 | CSP-M5 | Bridges inexistentes | P3 | NOT_STARTED | Output health | Pendiente de asignación | Pendiente | Pendiente | Hardware/load | Pendiente | Pendiente | Pendiente | Congelado |
| 34 | SCALE-ARCHIVE-OBSERVABILITY-001 | CSP-M5 | Escala no demostrada | P3 | NOT_STARTED | SaaS/telemetry | Pendiente de asignación | Pendiente | Pendiente | Load/soak/cost | Pendiente | Pendiente | Pendiente | Congelado |

## 7. Estados oficiales

Los únicos estados permitidos son:

| Estado | Definición | Condición de entrada | Condición de salida | Evidencia mínima | Quién puede cambiarlo |
| --- | --- | --- | --- | --- | --- |
| NOT_STARTED | Trabajo registrado sin análisis activo | Ticket incorporado al programa | Se inicia análisis o se cancela | Fila en matriz | Owner técnico o owner de producto asignado |
| ANALYSIS | Investigación y reproducción en curso | Baseline y alcance abiertos | READY, BLOCKED, REJECTED o CANCELLED | Diagnóstico, archivos y riesgos | Owner técnico asignado |
| READY | Listo para implementación controlada | Análisis, dependencias y aceptación definidos | IN_PROGRESS, BLOCKED o CANCELLED | Plan, tests esperados y rollback inicial | Owner técnico; prioridad por owner de producto |
| IN_PROGRESS | Implementación activa | Baseline validado y autorización | VALIDATION, BLOCKED, REJECTED o ROLLED_BACK | Commits/worktree y updates | Owner técnico asignado |
| BLOCKED | No puede avanzar sin condición externa | Bloqueo reproducible | ANALYSIS, READY, IN_PROGRESS o CANCELLED | Bloqueo, impacto y requisito | Owner técnico; prioridad por owner de producto |
| VALIDATION | Implementación completa en revisión | Alcance implementado | APPROVED, REJECTED, BLOCKED o ROLLED_BACK | Pruebas, evidencia y diff | Owner técnico asignado |
| REJECTED | No satisface el ticket | Falla de criterio o riesgo no aceptable | ANALYSIS, CANCELLED o nueva versión | Dictamen NO APROBADO | Owner técnico; owner producto confirma continuidad |
| APPROVED | Cumple alcance y gate aplicable | Todos los criterios satisfechos | Permanece o ROLLED_BACK | Evidencia completa y dictamen APROBADO | Owner técnico emite dictamen; owner producto acepta prioridad/release |
| ROLLED_BACK | Cambio retirado de forma controlada | Incidente o rechazo post-release | ANALYSIS, CANCELLED o nueva versión | Rollback, causa y estado | Owner técnico asignado |
| CANCELLED | Trabajo cerrado sin implementación | Decisión explícita de no continuar | Solo nueva alta versionada | Motivo, impacto y reemplazo | Owner de producto asignado |

### Condición especial de APPROVED

`APPROVED` solo puede usarse cuando:

- el alcance está completado;
- los criterios de aceptación están cumplidos;
- las pruebas requeridas están aprobadas;
- existe evidencia reproducible;
- el working tree está validado;
- el rollback está documentado;
- se emitió dictamen explícito;
- commit/push/deploy se reportaron con su estado real, aunque no aplicaran.

## 8. Regla de aprobación

Todo dictamen debe usar exactamente:

```text
DICTAMEN: APROBADO
```

o:

```text
DICTAMEN: NO APROBADO
```

Cada dictamen debe incluir:

- commit inicial;
- commit final;
- rama;
- archivos creados;
- archivos modificados;
- pruebas ejecutadas;
- resultados;
- evidencia;
- desviaciones;
- riesgos residuales;
- estado del working tree;
- confirmación de commit;
- confirmación de push;
- confirmación de deploy.

Ninguna afirmación informal, mensaje de éxito, compilación o test aislado cambia el estado oficial.

## 9. Métricas del programa

Los valores `NO MEDIDO` son deuda explícita. No deben reemplazarse con cero.

### 9.1 Integridad

| KPI | Baseline | Fuente futura | Meta de gate |
| --- | --- | --- | --- |
| P0 abiertos | 6 | Matriz maestra | 0 |
| P0 aprobados | 0 | Matriz maestra | 6 |
| Intentos con más de una cabeza activa | NO MEDIDO | Attempt ledger/reconciliador | 0 |
| Publicaciones públicas pendientes | NO MEDIDO | Outbox | 0 fuera de SLA |
| Reparaciones automáticas | No implementadas | Outbox metrics | 100% de reintentos elegibles |
| Reparaciones manuales | No implementadas | Repair audit | Todas auditadas |
| Dead-letter pendientes | No implementado | DLQ | 0 sin atender |
| Overwrites de auditoría rechazados | NO MEDIDO | Rules/audit metrics | 100% rechazados |
| Conflictos de timer | NO MEDIDO | Timer ledger | 0 no resueltos |
| Torneos huérfanos | NO MEDIDO | Lifecycle reconciler | 0 |
| Sesiones Broadcast huérfanas | NO MEDIDO | Session health | 0 |

### 9.2 Recuperación

| KPI | Baseline | Meta |
| --- | --- | --- |
| Backups creados | NO MEDIDO | 100% de acciones críticas según política |
| Backups verificados | 0 demostrados | 100% dentro de política |
| Restores ejecutados | 0 demostrados | Drill periódico |
| Restores exitosos | 0 demostrados | 100% en fixtures certificados |
| Restores fallidos | 0 medidos | 0 sin diagnóstico |
| Tiempo medio de recuperación | NO MEDIDO | RTO definido |
| Antigüedad del último restore drill | No existe | Dentro de política |
| Backups con checksum/manifest | NO MEDIDO | 100% |

### 9.3 Pruebas

| KPI | Baseline |
| --- | --- |
| Unit/contract/static tests | 44/44 suites totales aprobadas; clasificación fina pendiente |
| Integration tests reales | Insuficientes |
| Emulator tests | No existe harness completo |
| Browser E2E | No implementado |
| Concurrency tests reales | No implementados |
| Visual regression | No implementado |
| Accessibility tests | No implementados |
| Load tests | No implementados |
| Soak tests | No implementados |
| Coverage módulos críticos | NO MEDIDO |

### 9.4 Operación

| KPI | Baseline | Meta |
| --- | --- | --- |
| Latencia score -> portal | NO MEDIDO | SLO por definir |
| Latencia score -> Broadcast | NO MEDIDO | SLO por definir |
| Proyecciones stale | NO MEDIDO | 0 fuera de SLA |
| Listeners duplicados | Riesgo confirmado, cantidad no medida | 0 |
| Sesiones Broadcast huérfanas | NO MEDIDO | 0 |
| Errores no atendidos | NO MEDIDO | 0 críticos |
| Fallos de reconexión | NO MEDIDO | Dentro de SLO |
| Discrepancias live/portal/Broadcast | NO MEDIDO | 0 |

### 9.5 Seguridad

| KPI | Baseline | Meta |
| --- | --- | --- |
| Rutas públicas no autorizadas | `live/{tournamentId}` identificado | 0 |
| Payloads inválidos aceptados | Riesgo confirmado; no medido | 0 |
| Usuarios con acceso `all` | NO MEDIDO | 0 salvo excepción aprobada |
| Dependencias vulnerables | 10 | 0 fuera de política |
| Exportaciones de backup auditadas | 0 demostradas | 100% |
| Intentos cross-tenant | No aplicable aún/no medido | 100% rechazados |
| Tenant isolation failures | Tenant no implementado en core | 0 |
| Auditorías sobrescritas | NO MEDIDO; regla permite overwrite | 0 |
| Escrituras de juez fuera de alcance | NO MEDIDO | 0 |

## 10. Política de congelamiento

Mientras CSP-M1 no esté aprobado permanecen congelados:

- nuevas funciones grandes del portal;
- editor Broadcast;
- NDI;
- video;
- audio;
- replay;
- suscripciones;
- billing;
- multi-organización productiva;
- offline;
- Arena;
- IA;
- nueva analítica;
- refactor general;
- eliminación de legacy sin telemetría;
- cambios deportivos no relacionados;
- expansión de Firebase sin control de arquitectura.

Solo se permiten:

- P0;
- correcciones de regresión;
- pruebas;
- instrumentación;
- observabilidad;
- migraciones técnicas controladas;
- documentación;
- correcciones estrictamente necesarias para ejecutar el programa.

Un trabajo permitido no queda automáticamente aprobado: debe seguir los mismos controles de evidencia.

## 11. Política de excepciones

Una excepción requiere:

- causa;
- urgencia;
- impacto;
- riesgo de no ejecutar;
- riesgo de ejecutar;
- alcance limitado;
- rollback;
- pruebas;
- responsable;
- fecha de expiración;
- aprobación explícita.

Si responsable o fecha no están definidos, la excepción permanece `BLOCKED`.

Una excepción no puede:

- modificar silenciosamente el roadmap;
- marcar un gate como aprobado;
- abrir múltiples trabajos de expansión;
- eliminar controles de evidencia;
- mezclar riesgos críticos independientes;
- reemplazar una nueva auditoría;
- omitir rollback.

### Registro de excepciones

| ID | Causa | Estado | Responsable | Expira | Decisión |
| --- | --- | --- | --- | --- | --- |
| Ninguna | No existen excepciones registradas en versión 1.0.0 | N/A | Pendiente de asignación | N/A | N/A |

## 12. Evidencia requerida por ticket

Cada ticket debe generar o actualizar una estructura equivalente:

```text
ticket-id/
  SUMMARY.md
  VALIDATION.md
  TEST_RESULTS.md
  ROLLBACK.md
  FILES_CHANGED.md
  RISKS.md
```

Puede adaptarse a la convención del repositorio, pero debe contener:

- objetivo;
- hallazgo de origen;
- hito;
- gate al que contribuye;
- alcance;
- restricciones;
- dependencias;
- riesgos;
- baseline Git;
- implementación;
- validación;
- evidencia;
- rollback;
- archivos cambiados;
- criterios de aprobación;
- riesgos residuales;
- dictamen.

La evidencia debe ser reproducible y evitar datos de producción sensibles.

## 13. Estrategia de Git

- Un ticket por cambio independiente.
- Commits identificables.
- No mezclar correcciones ajenas.
- No hacer push ni deploy sin instrucción.
- Registrar HEAD inicial.
- Registrar HEAD final.
- Ejecutar `git diff --check`.
- Informar `git status --short`.
- Documentar archivos no relacionados.
- No limpiar cambios ajenos.
- No hacer reset destructivo.
- No alterar reportes de auditoría existentes.
- No inventar un working tree limpio si no lo está.
- Agregar archivos individualmente; no usar `git add .` en publicaciones controladas.
- Verificar staging antes del commit.
- Reportar si `HEAD`, `main` y `origin/main` divergen.
- Confirmar explícitamente rollback y backup branches/tags cuando el ticket los involucre.

## 14. Estrategia de validación

### Nivel 1 — Estático

- sintaxis;
- lint cuando exista;
- import graph;
- schema validation;
- diff check;
- module identity;
- búsqueda de rutas/versiones.

### Nivel 2 — Unitario

- contratos;
- funciones puras;
- casos de borde;
- normalización;
- idempotencia local;
- inmutabilidad.

### Nivel 3 — Integración

- repositorios;
- proyecciones;
- Firebase Emulator;
- Auth;
- Rules;
- Functions;
- outbox;
- reconciliación;
- restore sobre fixtures.

### Nivel 4 — E2E

- navegador;
- login;
- roles;
- crear torneo;
- crear programa;
- seleccionar charreada;
- capturar score;
- publicar;
- corregir;
- portal;
- Live Feed;
- Broadcast Program;
- Announcer.

### Nivel 5 — Concurrencia

- dos clientes;
- doble publicación;
- reintentos;
- revisión stale;
- takeover;
- reconnect;
- timer authority;
- correcciones simultáneas;
- duplicados/idempotency keys.

### Nivel 6 — Operación

- dispositivos reales;
- ejecución prolongada;
- simulación de incidentes;
- desconexión de red;
- cierre de navegador;
- corte eléctrico;
- recovery drill;
- restore drill;
- carga;
- soak;
- runbook ejecutado por operador nuevo.

### Nivel requerido por riesgo

| Riesgo | Nivel mínimo |
| --- | --- |
| Documentación editorial | 1 |
| Función pura | 2 |
| Firebase/rules/proyección | 3 |
| Journey usuario | 4 |
| Score/timer/revisiones | 5 |
| Recovery/comercialización | 6 |

## 15. Política de documentación viva

### Versionado

- `1.0.0`: creación inicial.
- Cambio de prioridades o gates: incremento menor.
- Cambio estructural del programa: incremento mayor.
- Corrección editorial: incremento patch.

### Reglas

- No borrar decisiones anteriores.
- Registrar decisiones reemplazadas.
- Mantener fecha de última revisión.
- Registrar el ticket que motivó cada cambio.
- No cambiar estado de ticket sin evidencia.
- No resumir una desviación como “ajuste menor” si afecta un gate.
- Conservar links o referencias a evidencia.

### Registro de decisiones

| ID | Fecha | Decisión | Motivo | Reemplaza | Ticket |
| --- | --- | --- | --- | --- | --- |
| CSP-DEC-001 | 2026-07-29 | Congelar expansión hasta aprobar CSP-M1 | Dictamen maestro NO APROBADO | N/A | CHARROPRO-CORE-STABILIZATION-PROGRAM-001 |
| CSP-DEC-002 | 2026-07-29 | Ejecutar primero recovery de proyección pública | Riesgo de publicación oficial parcial | N/A | CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001 |
| CSP-DEC-003 | 2026-07-29 | Evitar reescritura total | Conservar dominio y contratos V2 valiosos | N/A | CHARROPRO-CORE-STABILIZATION-PROGRAM-001 |

## 16. Autoridad de gobierno

Este archivo es la autoridad documental de la estabilización.

Reglas:

- Todo ticket derivado debe declarar su hito.
- Todo ticket debe indicar qué hallazgo resuelve.
- Todo ticket debe indicar qué gate satisface.
- No puede abrirse el siguiente hito sin dictamen explícito.
- El owner de producto aprueba prioridades y excepciones comerciales.
- El owner técnico emite el dictamen técnico.
- Mientras no existan owners asignados, ambos figuran como `Pendiente de asignación`.
- La ausencia de owner bloquea excepciones y cambios de gate, pero no impide preparar evidencia documental.
- Una nueva auditoría integral es obligatoria antes de declarar comercialización controlada.
- Los reportes de auditoría de origen no se alteran; nuevas conclusiones se agregan a este programa o a evidencia versionada.

## 17. Gobierno de gates

### Revisión de gate

Cada gate requiere:

1. matriz actualizada;
2. todos los tickets obligatorios en `APPROVED`;
3. KPIs medidos;
4. riesgos residuales;
5. evidencia de rollback;
6. tests del nivel mínimo;
7. working tree/release state;
8. dictamen técnico;
9. aceptación del owner de producto;
10. nueva versión de este documento.

### Gate no aprobado

Si cualquier criterio falta:

```text
DICTAMEN: NO APROBADO
```

El documento debe enumerar exactamente el bloqueo y conservar el hito actual.

### Gate aprobado

Un gate solo cambia con:

```text
DICTAMEN: APROBADO
```

y no autoriza automáticamente deploy, migración o inicio del siguiente hito sin instrucción.

## 18. Riesgos abiertos iniciales

| ID auditoría | Riesgo | Hito | Ticket principal | Estado |
| --- | --- | --- | --- | --- |
| CPA-001 | Proyección pública pendiente sin recovery | CSP-M1 | CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001 | ABIERTO |
| DAT-001 | Publicación simultánea/doble cabeza | CSP-M1 | OFFICIAL-SCORE-CONCURRENCY-001 | ABIERTO |
| AUD-001 | Auditoría mutable | CSP-M1 | AUDIT-IMMUTABILITY-001 | ABIERTO |
| ARCH-001 | Identidad ES duplicada | CSP-M1 | CORE-RUNTIME-MODULE-IDENTITY-001 | ABIERTO |
| LIFE-001 | Eliminación inconsistente | CSP-M1 | TOURNAMENT-DELETION-CONSISTENCY-001 | ABIERTO |
| TIM-001 | Timer sin autoridad única | CSP-M1 | TIMER-AUTHORITY-CONCURRENCY-001 | ABIERTO |
| REC-001 | Sin restore verificable | CSP-M2/CSP-M3 | RECOVERY-RESTORE-001 | ABIERTO |
| SEC-001/SEC-002 | Exposición y reglas laxas | CSP-M2 | PUBLIC-LIVE-DATA-MINIMIZATION-001 / FIREBASE-PRIVATE-SCHEMA-RULES-001 | ABIERTO |
| TEST-001 | Sin Emulator/E2E suficiente | CSP-M2 | TEST-INFRA-E2E-EMULATOR-001 | ABIERTO |
| SAAS-001 | Sin multi-organización | CSP-M4 | ORGANIZATIONS-FOUNDATION-001 | CONGELADO |

## 19. Criterio para solicitar nueva auditoría

La nueva auditoría puede solicitarse cuando:

- CSP-M1, CSP-M2 y CSP-M3 tengan dictamen APROBADO;
- no existan P0 abiertos;
- KPIs críticos estén medidos;
- restore drill sea exitoso;
- reglas tengan cobertura Emulator;
- journey juez -> portal -> Broadcast tenga E2E;
- concurrencia de score/timer esté aprobada;
- runbooks hayan sido ejecutados;
- vulnerabilidades estén dentro de política;
- legacy y dependencias estén inventariados;
- working tree y releases sean reproducibles.

La nueva auditoría debe decidir si el producto alcanza:

**APROBADO PARA COMERCIALIZACIÓN CONTROLADA**

## 20. Cuándo pueden iniciarse SaaS y Broadcast Pro

### SaaS

Puede iniciar su fundación únicamente después de:

- CSP-M1 aprobado;
- CSP-M2 aprobado;
- CSP-M3 aprobado;
- owner técnico y de producto asignados;
- organization/tenant design aprobado.

### Broadcast Pro

Editor, NDI, video, audio, replay y bridges profesionales permanecen congelados hasta:

- nueva auditoría favorable;
- core transaccional y recuperable;
- timer authority aprobado;
- Broadcast tenant context aprobado;
- observabilidad de outputs disponible.

## 21. Próximo trabajo autorizado

```text
CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001
```

Debe declarar:

- Hito: CSP-M1.
- Hallazgo: CPA-001 y relación acotada con PUB-002.
- Gate: proyección pendiente durable, reparación automática/manual e idempotencia.
- Restricción: no resolver concurrencia de score, audit, timer, delete o module identity dentro del mismo ticket.

## 22. Estado del documento al crear versión 1.0.0

| Pregunta | Respuesta |
| --- | --- |
| ¿En qué hito está CharroPro? | CSP-M1 — Integridad transaccional |
| ¿Qué ticket está autorizado? | CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001 |
| ¿Qué riesgos siguen abiertos? | Los seis P0 y riesgos P1/P2/P3 de la auditoría |
| ¿Qué trabajos están congelados? | Expansión Portal/Broadcast Pro/SaaS/Arena/IA y refactor general |
| ¿Qué evidencia existe? | Los 13 reportes de auditoría y baseline 44/44 |
| ¿Qué gate falta? | CSP-M1 permanece NO APROBADO |
| ¿Qué debe validarse? | Integridad, concurrencia, reglas, recovery, E2E y operación |
| ¿Cuándo puede iniciarse SaaS? | Después de CSP-M1-M3 y autorización de CSP-M4 |
| ¿Cuándo puede retomarse Broadcast Pro? | Después de nueva auditoría favorable |
| ¿Qué requiere una nueva auditoría? | Gates, KPIs, E2E, Emulator, restore y runbooks |
| ¿Qué permite comercialización controlada? | Dictamen explícito de nueva auditoría |

## 23. Control de este ticket documental

Este ticket:

- no implementa ningún P0;
- no modifica JavaScript;
- no modifica HTML;
- no modifica CSS;
- no cambia Firebase Rules;
- no actualiza dependencias;
- no despliega;
- no escribe Firebase;
- no ejecuta migraciones;
- no elimina legacy;
- no crea funcionalidad;
- no cambia reglas deportivas;
- no marca gates como aprobados;
- no altera reportes de auditoría;
- no realiza commit;
- no realiza push;
- no realiza deploy.

## 24. Dictamen de creación

El dictamen de este documento debe emitirse fuera de la especificación después de validar:

- existencia;
- versión;
- cinco hitos;
- seis P0 en orden;
- gates;
- estados;
- matriz;
- KPIs;
- congelamiento;
- excepciones;
- Git;
- evidencia;
- validación multinivel;
- próximo ticket;
- alcance único.

La creación de este archivo no aprueba CSP-M1 ni ninguno de sus tickets.

## 25. Evidencia de creación de la versión 1.0.0

| Control | Resultado |
| --- | --- |
| HEAD inicial | `78a51f23ae1f2b13e48667041048b9624f57d6ae` |
| HEAD final | `78a51f23ae1f2b13e48667041048b9624f57d6ae` |
| Rama | `main` |
| `main` | `78a51f23ae1f2b13e48667041048b9624f57d6ae` |
| `origin/main` | `78a51f23ae1f2b13e48667041048b9624f57d6ae` |
| Staging | Vacío |
| Archivos rastreados modificados | Ninguno |
| Archivo creado por este ticket | `CHARROPRO_CORE_STABILIZATION_PROGRAM.md` |
| Archivos previos sin tracking | Los 13 reportes de la auditoría maestra |
| JavaScript/HTML/CSS modificados | Ninguno |
| Firebase Rules/configuración modificada | Ninguna |
| Dependencias modificadas | Ninguna |
| Commit | No realizado |
| Push | No realizado |
| Deploy | No realizado |

### Explicación del working tree

El working tree final no está limpio porque contiene:

- los 13 reportes nuevos generados por `CHARROPRO-MASTER-PRODUCT-TECHNICAL-AUDIT-001`;
- este documento rector nuevo.

Todos permanecen sin staging. Este ticket no alteró los reportes anteriores ni creó cambios funcionales.

### Validación documental

- El archivo existe y no está vacío.
- Contiene los cinco hitos.
- Contiene los seis P0 en el orden oficial.
- Contiene gates verificables.
- Define los diez estados oficiales.
- Contiene la matriz maestra.
- Incluye KPIs.
- Incluye congelamiento y excepciones.
- Incluye estrategia Git y evidencia por ticket.
- Incluye seis niveles de validación.
- Define el próximo ticket autorizado.
- La validación de contenido no detectó espacios finales ni secciones faltantes.
- `git diff --check` no reportó errores en cambios rastreados.
- Como el documento es nuevo y no rastreado, se ejecutó además una comprobación directa de whitespace y newline final.
