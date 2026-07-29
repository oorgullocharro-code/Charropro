# CharroPro Master Audit - Broadcast Studio

## Dictamen

Broadcast Studio V2 es la parte arquitectónicamente más estructurada del repositorio. El motor no es aparente: existen contratos, motores, estados, revisiones, outputs y transporte realtime con pruebas dedicadas. No obstante, “motor Broadcast funcional” no equivale a “Broadcast Studio comercial terminado”.

## Pipeline auditado

```text
tournaments + live/current
  -> Broadcast Data Contract
  -> Production Variables / Live Bindings
  -> Template + Theme preparation
  -> Preview Engine
  -> Program Engine
  -> Program Projection
  -> Output Routing
  -> Realtime Transport
  -> Program Main Output

Broadcast Data Contract
  -> Announcer projection
  -> Realtime Transport
  -> Announcer Monitor
```

## Estado por bloque

| Bloque | Estado | Clase | Evidencia |
| --- | --- | --- | --- |
| Data Contract | Implementado | B | Builder, validator, sanitizer y suite |
| Broadcast State | Implementado | B | Preview/Program separados, revision/queue/output |
| Action Engine | Implementado | B | Acciones declarativas y permisos conceptuales |
| Production Variables | Implementado | B | Scope/priority/snapshot seguro |
| Asset Manager | Modelo en memoria | C | Registro/versiones/rights, sin Storage/UI |
| Component Library | Implementado | B | Catálogo y seguridad |
| Component Renderer | Implementado | B | Render declarativo y root management |
| Template Engine | Implementado | B | Inmutabilidad y snapshots |
| Theme Engine | Implementado | B | Herencia y activación |
| Theme/Template Integration | Implementado | B | Preparación temática y correctivos |
| Preview | Implementado | B | Prepare/render/update/clear/destroy |
| Program | Implementado | B | Take/Cut/Auto y data-only updates |
| Program Projection | Implementado | B | Composition/components/layers |
| Output Routing | Implementado | B | Rutas y revisiones |
| Browser Output | Implementado | B | Infraestructura común |
| Program Main | Implementado | B | Salida visual oficial |
| Announcer Monitor | Implementado | B | Proyección independiente |
| Realtime Transport | Implementado single-tenant | C | RTDB session/revision/access |
| Workspace | Operativo con presets | C | Cabina unificada |
| Production Console | Operativa/técnica | B | Laboratorio y control |
| Live Bindings | Implementado | B/C | Data-only update y tests; validación productiva no repetida |
| Timer Display V2 | Reservado/parcial | D | Tarjeta deshabilitada/no output dedicado |
| Editor visual profesional | No implementado | H | No Layer/Layout editor |
| NDI/video/audio | No implementado | H | Placeholder/reserva |
| OBS V2 bridge | No implementado | H | OBS V1 permanece separado |

## Contratos e identidad

Fortalezas:

- Preview y Program tienen identidades/revisiones separadas.
- Take/Cut/Auto congelan una copia declarativa.
- Data-only updates conservan Program ID, template, theme, capas y geometría.
- Output Routing reenvía en lugar de recalcular.
- Program Main acepta revisiones nuevas del mismo Program.
- Announcer no depende de Preview/Take.
- Snapshots eliminan runtime, DOM, listeners y secretos.
- Los módulos limitan profundidad, arrays y claves peligrosas.

## Datos consumidos

Broadcast consume:

- torneo/competencia/charreada;
- turno oficial;
- participante/equipo/caballo;
- suerte;
- score y standings;
- timer;
- siguiente participante/equipo;
- sponsor/message/context;
- datos autorizados de producción.

La fuente inmediata es `broadcastContext`/Broadcast Data Contract construido desde el estado privado/live, no la página pública. El turno se toma del contrato de turno, no del último score.

## Live updates

El Workspace contiene lógica para:

- re-resolver contexto oficial;
- aplicar contrato a Preview renderizado;
- actualizar Program solo para bindings live;
- mantener estructura/geometry;
- publicar nueva revisión Program/Announcer;
- evitar Take/Cut para cambios data-only.

Riesgos:

- la auditoría no conectó dispositivos reales a producción;
- el upstream core puede publicar un contexto stale;
- la autoridad del timer/turn sigue perteneciendo al core;
- el fallo de publicación Broadcast no forma parte de la transacción deportiva;
- no hay SLO/telemetría de latencia end-to-end.

## Geometría

La arquitectura conserva composition/components/layers/geometry desde Preview a Program y Program Main. Existen pruebas de proyección y output. No se ejecutó validación visual pixel-perfect en navegador real durante esta auditoría; por ello se considera funcional con deuda, no A.

## Realtime y acceso

Fortalezas:

- namespace Broadcast separado;
- contexto por sesión;
- expected revision;
- idempotency;
- stale/offline/reconnect;
- access temporal con expiración/revocación;
- canales Program y Announcer con visibilidades distintas.

Riesgos:

- `tenantId` está fijado en reglas a `charropro-e8a68`;
- organization/client son `null`;
- URLs temporales son capacidades bearer y pueden filtrarse por logs/referrer;
- reglas se prueban estáticamente, no con Emulator;
- no existe tenant productivo derivado del core.

## Ciclo create/destroy

Los motores V2 tienen mejor disciplina de lifecycle que el core:

- create/initialize;
- snapshot;
- update;
- clear;
- dispose/destroy;
- protección contra listeners duplicados.

Queda por verificar con browser soak:

- memoria después de horas;
- reconexiones repetidas;
- múltiples cambios de template/theme;
- cambio A->B->A bajo carga;
- 20-100 outputs.

## Consola vs editor

La Production Console y el Workspace permiten seleccionar presets, preparar Preview, enviar Program y diagnosticar. No permiten diseñar libremente:

- capas;
- timeline;
- keyframes;
- constraints;
- responsive rules;
- snapping;
- reusable compositions;
- asset placement;
- data binding visual;
- undo/redo profesional.

Por tanto, Editor Broadcast = 35%, aunque el engine sea 68%.

## V1 y compatibilidad

Siguen presentes:

- `graficos.html`;
- `grafico-*.html`;
- `obs.html`;
- locutor V1;
- cronómetro pantalla V1.

No se encontró evidencia de que todos los consumidores hayan migrado. Deben permanecer congelados hasta telemetría y plan de retiro.

`broadcastAccessHub.js` parece reemplazado por `broadcastStudioWorkspace.js`, pero todavía tiene test. Es candidato legacy, no debe eliminarse sin confirmar enlaces externos.

## Timer Display

- Existe cronómetro en el contrato y salidas V1.
- El Workspace reserva una tarjeta/route conceptual.
- No existe una salida V2 Timer Display oficial completa equivalente a Program Main.
- Debe clasificarse D, no terminado.

## Preparación comercial

Faltan:

- multi-tenant real;
- catálogo de assets persistente;
- editor profesional;
- empaquetado/URL lifecycle por cliente;
- métricas de output;
- health dashboard/SLO;
- soporte para formatos/hardware;
- simulación de carga;
- runbook de show;
- disaster recovery;
- licencia/entitlement.

## Recomendaciones

### Antes de ampliar Broadcast

1. Cerrar P0 del core: score, público, auditoría, timer y module identity.
2. Probar transporte con Emulator y dos navegadores/dispositivos.
3. Añadir telemetría de contractRevision -> outputRevision.
4. Derivar tenant/org de una fuente oficial.
5. Definir lifecycle de sesiones y limpieza al eliminar/archivar torneo.

### Fase profesional posterior

1. Asset Storage y catálogo productivo.
2. Scene/composition catalog.
3. Layer Manager/Layout Editor.
4. Timer Display V2.
5. OBS/vMix bridges.
6. NDI/video/audio.
7. Macros y automatización.

## Resultado

- Motor Broadcast: funcional con deuda y validación productiva pendiente.
- Consola: funcional para operador técnico.
- Outputs: Program Main y Announcer implementados.
- Editor: no implementado.
- SaaS Broadcast: no listo.
- Expansión inmediata: no recomendada hasta estabilizar el core.
