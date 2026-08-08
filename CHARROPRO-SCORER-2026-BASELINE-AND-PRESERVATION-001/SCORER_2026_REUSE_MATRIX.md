# Scorer 2026 Reuse Matrix

## Clasificacion

- A: preservar sin cambios.
- B: reutilizar y extender.
- C: corregir con ticket dirigido.
- D: refactorizar controladamente conservando contrato.
- E: reemplazar solo si se demuestra imposible reutilizar.

No se identifico ningun componente E en este baseline.

## Matriz

| Componente | Estado actual | Suertes | Clase | Extension/correccion | Riesgo | Ticket futuro probable |
| --- | --- | --- | --- | --- | --- | --- |
| Login, roles y acceso | Operativo y probado en Emulator | Todas | A | Ninguna para reglas 2026 | Exponer score sin rol | Infraestructura, no FMCH |
| Resolver competencia/participante | Team e individual con fallback legacy | Todas | A/B | Extender solo si nace modelo de participante 2026 | Mezclar team/individual | Master Data futuro |
| Shell del calificador | Cabecera, suerte, oportunidad, contenido y footer | Todas | B/C | Mejorar iPad sin romper acciones | Overflow horizontal | Scorer responsive 2026 |
| Rule button renderer | Catalogo + overrides + layout | Todas | B | Agregar reglas versionadas, no otro engine | Cambiar IDs/puntos | FMCH 2026 scoring spec |
| Editor de reglas | Global y torneo/convocatoria | Todas | B | Validar alcance/version antes de editar 2026 | Override sin trazabilidad reglamentaria | Rule governance 2026 |
| Base exclusiva | `toggleRule(base)` | Todas | A | Reusar | Mutacion de semantica | Por suerte |
| Adicionales | Acumulables | Todas | A/B | Extender catalogos aprobados | Duplicar conceptos | Por suerte |
| Infracciones | Acumulables | Todas | A/B | Extender catalogos aprobados | Colision de ID | Por suerte |
| Adicional manual | Motivo + puntos | Todas | A | Preservar como excepcion auditada | Abuso sin catalogo | Governance futuro |
| Infraccion manual | Motivo + puntos | Todas | A | Preservar como excepcion auditada | Abuso sin catalogo | Governance futuro |
| Infraccion de equipo | Catalogo general + Cala + manual | Todas | A/B | Reusar y mapear FieldID | Confundir con infr individual | FMCH 2026 mapping |
| DQ | Transversal, total cero, conserva restas/evidencia | Todas | B/C | Resolver identidad `ttm` y semantica de deshacer | Perdida de buenos no reversible | DQ preservation fix |
| Cero no logrado | Estado explicito | Multi-intento y todas via guardar | A | Reusar | Confundir cero con ausencia | Por suerte |
| Punta Cala | Calculador especializado | Cala | A | Preservar; solo cambios con especificacion | Sustitucion manual o limite arbitrario | Cala FMCH 2026 |
| Cala rule migration | Migra IDs legacy y recalcula | Cala | A/B | Extender si hay version nueva | Romper scores historicos | Cala migration 2026 |
| Intentos genericos | Arreglo por oportunidad | Piales, Lazo, Pial, Manganas | A/B | Reusar | Orden incorrecto | Scoring Attempt V2 futuro |
| Coleadero matrix | 3 x 3 actual | Colas | C | Agregar cuarta fila mediante migracion compatible | Cambiar dimensiones existentes | Coleadero row 4 |
| Terna compuesta | Lazo + Pial independientes | Terna | A/B | Reusar composicion oficial | Crear entidad duplicada | Terna FMCH mapping |
| Jineteo compartido | Panel y total comunes | Toro/Yegua | A/B | Reusar | Catalogos no equivalentes | Por suerte |
| Manganas compartidas | Panel, 3 intentos y floreo | Pie/Caballo | A/B | Reusar helpers, mantener catalogos separados | Fusionar reglas distintas | Por suerte |
| Participante/roster resolver | Nombres reales con fallback | Todas | B/C | Completar 4o coleador y Master Data | Placeholder visible | Participants/Master Data |
| Evidence + notes | Tiempo, etiqueta, fecha y nota | Todas | A/B | Extender tipos sin perder historico | Datos no exportados | Evidence contract futuro |
| Timer engine | Elapsed general, countdown Colas | Todas | A/B | Extender reglas por suerte solo con validacion | Revisiones stale | Timer rules 2026 |
| Footer | Acciones y estado | Todas | B/C | Corregir etiqueta/undo sin perder navegacion | “Deshacer” no deshace accion | Scorer footer UX |
| Save local | Draft por torneo | Todas | A | Preservar | Reemplazo cruzado | Core preservation |
| Next flow | Publica y luego avanza | Todas | A | Preservar | Doble clic/falla parcial | Official score tests |
| Official publisher | Callable + transaccion + ledger | Todas | A | No tocar por reglas deportivas | Duplicidad/conflicto | Core stabilization |
| Public Projection Outbox | Fanout durable | Todas | A | Preservar | Snapshot stale | Public recovery |
| Safety snapshot/ID guards | Evitan reemplazo destructivo | Todas | A | Preservar | Perdida masiva de scores | Critical recovery |
| Results engine | Totales/rankings existentes | Todas | A/B | Consumir reglas versionadas, no duplicar | Recalculo divergente | Results FMCH validation |
| Official format/exporter | Paquete y hoja actual | Todas | B/C | Completar mapping y resolver charreada activa | Hoja parcial | FMCH exporter 2026 |
| FieldID matrix | 239 IDs reconciliados | Todas | A/B | Mantener identidad y actualizar capas | Romper trazabilidad | FMCH 2026 spec |
| Broadcast consumers | Contrato sanitizado | Todas | A | No escribir score | Convertirse en autoridad | Broadcast regression |
| Fusiones/fusionales | No existe componente autonomo | No determinada | C | Validar termino deportivo antes de modelar | Equipararlo a floreo sin evidencia | Sports validation |

## Reutilizacion por familia

### Intentos repetidos

Piales, Lazo, Pial en el Ruedo y Manganas ya comparten el modelo de arreglo y el panel
`renderAttemptMainPanel()` cuando aplica. La extension 2026 debe agregar reglas o
metadata, no duplicar estado ni navegacion.

### Jineteos

Toro y Yegua comparten renderer, calculo y persistencia. Sus catalogos son distintos y
no deben fusionarse.

### Terna

La composicion de Lazo y Pial en el Ruedo ocurre en resultado/exportacion. Crear una
tercera coleccion `terna` duplicaria fuente y no esta justificado.

### Floreos

Lazo, Pial en el Ruedo y ambas Manganas tienen botones denominados Floreo. Comparten el
renderer, no una regla deportiva comun. Cualquier motor compartido requiere primero una
especificacion que pruebe equivalencia.

## Correcciones ya delimitadas

1. `ttm`: separar identidades sin alterar historial.
2. Coleadero: agregar cuarta fila y migrar dimensiones de forma compatible.
3. Cala: validar equivalencias `ML/CR` frente a `MD/MI/PC`.
4. Formato Federacion: resolver charreada activa de forma canonica.
5. Footer: distinguir navegar anterior de undo real.
6. DQ: definir reversibilidad y cubrir colisiones sin borrar infracciones.
7. Responsive: eliminar overflow estructural sin ocultar footer ni controles.
8. Fusiones/fusionales: obtener definicion deportiva antes de crear modelo.

## Componentes nuevos necesarios

Para establecer este baseline: **ninguno**.

Los gaps futuros pueden requerir nuevas estructuras, pero solo despues de probar que no
pueden expresarse extendiendo colecciones, catalogos, mapper y contratos existentes.
