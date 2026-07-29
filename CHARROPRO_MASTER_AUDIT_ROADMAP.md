# CharroPro Master Audit - Roadmap priorizado

## Principio

El orden prioriza integridad y recuperación antes de expansión. No se recomienda una reescritura: cada fase debe conservar contratos funcionales, añadir pruebas y migrar de forma controlada.

## Fase 0 - Incidentes de producción

Objetivo: eliminar estados donde un evento activo puede divergir o perder confiabilidad.

| Orden | Iniciativa | Prioridad | Dependencias | Riesgo | Impacto | Esfuerzo | Resultado |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Recovery de publicación pública/Live Feed | P0 | Ninguna | Crítico | Portal coherente | M | Outbox/retry/repair |
| 2 | Ledger transaccional de score oficial | P0 | Diseño attemptKey | Crítico | Una versión activa | M/L | Publicación concurrente segura |
| 3 | Auditoría append-only | P0 | Rules Emulator | Crítico | No repudio | S/M | Registro inmutable |
| 4 | Identidad única de módulos/cache-busters | P0 | Import graph tests | Alto | Runtime determinista | M | Una instancia por módulo |
| 5 | Consistencia de delete/tombstone | P0 | Lifecycle policy | Alto | No quedan datos públicos huérfanos | M | Borrado/archivo verificable |
| 6 | Autoridad de timer/turno | P0 | Protocol/revision | Alto | Tiempo/turno confiables | M | Lease + transaction |

### Gate de salida

- Score privado, audit, live y público se reconcilian.
- Dos clientes no crean dos publicaciones activas.
- Auditoría no se sobrescribe.
- Timer tiene una autoridad.
- Mismo módulo no se carga con dos URLs.
- Tests Emulator/concurrencia pasan.

## Fase 1 - Estabilización

| Orden | Iniciativa | Prioridad | Dependencias | Riesgo | Impacto | Esfuerzo | Resultado |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Reglas privadas con schema | P1 | Emulator | Alto | Integridad/security | M/L | Payloads canónicos |
| 2 | Cerrar lectura pública de live | P1 | Migración V1 | Alto | Privacidad | M/L | Solo frontera pública |
| 3 | Diferenciar missing/null/zero | P1 | Fixtures/migration | Alto | Exactitud | S/M | Semántica estable |
| 4 | Resiliencia localStorage | P1 | Cache policy | Medio | Draft confiable | S/M | Error contenido |
| 5 | Test infra E2E/Emulator | P1 | CI | Alto | Releases reproducibles | L | Gate real |
| 6 | Observabilidad/SLO | P1 | Correlation IDs | Alto | Incidentes visibles | M/L | Métricas/alertas |
| 7 | Dependency hardening | P1 | Tests Functions | Medio | Supply chain | S/M | Versiones fijadas |
| 8 | Deprecation registry | P1 | Telemetría entrypoints | Medio | Menor duplicidad | M | V1 congelado/migrado |

### Gate de salida

- Reglas probadas por rol.
- E2E juez -> portal -> Broadcast.
- Dashboard de publication lag.
- No ausencia convertida a 0.
- Dependencias sin vulnerabilidades no aceptadas.

## Fase 2 - Cierre del producto actual

| Orden | Iniciativa | Prioridad | Dependencias | Riesgo | Impacto | Esfuerzo | Resultado |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Restore completo/parcial | P1 | Schema/lifecycle | Crítico | Recuperación real | L | Drill exitoso |
| 2 | Archivo/papelera | P1/P2 | Tombstone/restore | Alto | Lifecycle completo | M/L | Eliminar reversible |
| 3 | Baseline documental/runbooks | P1 | Fase 0 definida | Medio | Operación repetible | M | Fuente única |
| 4 | Descomposición app/firebaseSync | P2 | Tests/identidad | Medio | Mantenibilidad | XL incremental | Vertical slices |
| 5 | Gestión completa de usuario | P2 | Auth/rules | Medio | Onboarding | M/L | Invite/reset/session audit |
| 6 | Importaciones gobernadas | P2 | Master schema | Medio | Migración de clientes | M/L | Import dry-run |
| 7 | UX operativa bajo presión | P2 | E2E/telemetría | Medio | Menos error humano | M | Flujos claros |
| 8 | Estadística/history governance | P2 | IDs/data lineage | Medio | Datos históricos | M/L | Schema versionado |

### Gate de salida

- Restore probado.
- Operador nuevo puede ejecutar evento con runbook.
- No acciones críticas sin confirmación/recovery.
- Lifecycle torneo completo.

## Fase 3 - Preparación comercial

| Orden | Iniciativa | Prioridad | Dependencias | Riesgo | Impacto | Esfuerzo | Resultado |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Organization/tenant foundation | P2 | Fases 0-2 | Crítico | Aislamiento | XL | Datos por organización |
| 2 | Master Data | P2 | tenant/governance | Alto | Identidad deportiva | XL | Charros/caballos canónicos |
| 3 | Entitlements/planes | P2 | tenant | Alto | Producto vendible | L | Módulos/límites |
| 4 | Billing/subscriptions | P2 | entitlement | Alto | Ingreso recurrente | L | Lifecycle comercial |
| 5 | Usage/cost metering | P2 | tenant/observability | Alto | Margen/control | M/L | Costos por cliente |
| 6 | Consent/privacy workflows | P2 | Master Data | Alto | Cumplimiento | M/L | Rectificación/retención |
| 7 | Support/onboarding | P2 | docs/telemetry | Medio | Operación SaaS | M | Cliente autoservicio |

### Gate de salida

- Prueba de aislamiento entre dos organizaciones.
- Suscripción suspende/rehabilita sin pérdida.
- Export/delete de cliente.
- Costos y SLO medibles.

## Fase 4 - CharroPro Arena

| Orden | Iniciativa | Prioridad | Dependencias | Riesgo | Impacto | Esfuerzo | Resultado |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Event log durable/offline IDs | P3 | Ledger/event model | Crítico | Base offline | XL | Eventos locales |
| 2 | Servidor LAN/authority | P3 | Auth offline | Alto | Evento sin internet | XL | Operación local |
| 3 | Outbox/reconciliation cloud | P3 | Conflicts | Alto | Sync segura | XL | Reconexion |
| 4 | License/event package | P3 | SaaS | Medio | Control comercial | L | Paquetes temporales |
| 5 | Portal/Broadcast LAN | P3 | Local APIs | Medio | Experiencia completa | L | Salidas locales |
| 6 | Power-loss recovery drills | P3 | Backups/event log | Alto | Continuidad | M/L | RTO/RPO probado |

## Fase 5 - Broadcast profesional

| Orden | Iniciativa | Prioridad | Dependencias | Riesgo | Impacto | Esfuerzo | Resultado |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Broadcast tenant context | P2/P3 | Organization foundation | Alto | Clientes aislados | L | Sesiones por tenant |
| 2 | Asset Storage/catalog | P3 | Tenant/rights | Medio | Assets productivos | L | Asset Manager persistente |
| 3 | Scene/Graphic catalog | P3 | Assets/templates | Medio | Reutilización | L | Presets gestionados |
| 4 | Layer/Layout editor | P3 | Renderer/scenes | Alto | Editor profesional | XL | Diseño visual |
| 5 | Timer Display V2 | P3 | Timer authority | Medio | Salida oficial | M | Output dedicado |
| 6 | OBS/vMix bridges | P3 | Output APIs | Medio | Integración profesional | L | Control externo |
| 7 | NDI/video/audio | P3 | Hardware/performance | Alto | Broadcast avanzado | XL | Señal profesional |
| 8 | Macros/automation | P3 | Actions/scenes | Medio | Operación rápida | L | Workflows seguros |

## Fase 6 - Escalabilidad

| Orden | Iniciativa | Prioridad | Dependencias | Riesgo | Impacto | Esfuerzo | Resultado |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Archive storage/retention | P3 | Lifecycle/tenant | Medio | 1,000+ torneos | L | Working set acotado |
| 2 | Projection workers/queues | P3 | Outbox/observability | Alto | Throughput | L | Clientes desacoplados |
| 3 | Load/soak/cost optimization | P3 | Telemetry | Medio | 100 dispositivos | M/L | Capacidad conocida |
| 4 | Automated incident response | P3 | SLO | Medio | Menor MTTR | M | Reparación asistida |
| 5 | Analytics/AI futura | P3 | Data governance/quality | Alto | Diferenciación | XL | IA sobre datos confiables |

## Qué detener

Hasta cerrar Fase 0:

- nuevos módulos grandes;
- rediseños del portal no ligados a incidentes;
- editor Broadcast;
- NDI;
- suscripciones;
- offline;
- IA;
- refactor general sin test.

## Secuencia inmediata recomendada

```text
Public projection outbox
  -> score attempt ledger
  -> audit immutability
  -> module identity
  -> delete/tombstone
  -> timer authority
  -> Emulator/E2E
  -> restore
```

## Medición

Cada iniciativa debe tener:

- before/after reproducible;
- test que falle antes;
- rollback;
- métricas;
- runbook;
- migration/compatibility;
- revisión de reglas;
- evidencia de árbol limpio y release.
