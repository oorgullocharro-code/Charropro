# Brechas reales actuales

## Reanudacion de la auditoria

La evidencia visual pendiente se completo sobre `main` en
`c45ecfe110801b03df23bb06f2657e7fe8f8c3aa`, usando exclusivamente el proyecto
local `demo-charropro-local`, el usuario sintetico `local-juez` y Firebase Emulator.
No se conecto a `charropro-e8a68` ni se modifico el producto.

Se recorrieron las diez vistas reales del calificador: Cala, Piales, Colas, Toro,
Lazo, Pial en el Ruedo, Yegua, Manganas a Pie, Manganas a Caballo y Paso. La
inspeccion registro 236 botones visibles, los controles comunes, los intentos y
la separacion operativa de Terna. Cala produjo 20 puntos, el score oficial quedo
activo con revision 1, el historial de auditoria conservo el mismo registro y el
fanout oficial termino en `DELIVERED`. Despues de recargar, Panel y Resultados
conservaron el total de 20.

## Cobertura de los 239 FieldID

La matriz base se reviso completa sin modificarla. La evidencia visual actual
funciona como una capa de reconciliacion sobre sus 239 registros.

| Capa | FieldID con evidencia |
| --- | ---: |
| UI | 182 |
| Estado | 195 |
| Calculo | 184 |
| Persistencia deportiva | 184 |
| Score oficial | 184 |
| Auditoria | 184 |
| Exportacion | 232 |
| Derivable | 215 |

La matriz conserva su clasificacion original: 13 presentes directos, 177
derivables, 42 ambiguos y 7 faltantes reales. Estas cifras son una particion de
los 239 FieldID. Las categorias operativas siguientes son lentes de diagnostico
y pueden superponerse:

| Categoria solicitada | Resultado actual |
| --- | --- |
| Ya existe | Base, adicionales, infracciones, tiempo, descalificacion, penalizacion de equipo, punta, intentos y total se observaron en el cliente real y llegan al score oficial segun su aplicabilidad. |
| Existe con otro nombre | Terna se opera como `Lazo` y `Pial R.`. Cala expone `Medio lado derecho`, `Medio lado izquierdo` y `Cambio de rectangulo`, mientras el desglose agrupa `ML` y `CR`. |
| Existe pero no se persiste en el score | No hay controles deportivos visibles sin persistencia. Los 7 datos de encabezado se resuelven desde torneo, charreada y equipo; las 4 firmas existen como asignacion nominal, pero no como captura de firma dentro del score. |
| Requiere transformacion para exportar | 177 FieldID derivables necesitan aplanado, suma, separacion de intentos o composicion documental; no representan controles deportivos ausentes. |
| Falta realmente | 7 FieldID: logo de Federacion, cuarto participante de Coleadero, cuarto control inferior de Coleadero y cuatro elementos institucionales de footer. |
| Requiere validacion deportiva | Equivalencias Cala `ML/CR` frente a `MD/MI/PC`, controles laterales/auxiliares del formato y el significado correcto del `ttm` duplicado de Toro. |

## Brechas vigentes

| Prioridad | Brecha | Evidencia | Efecto |
| --- | --- | --- | --- |
| P0 trazabilidad | Toro reutiliza el id `ttm` en un adicional y una infraccion. | `js/data/suertes.js` y `toggleRule()`. | Puede confluir la activacion o evidencia de conceptos opuestos. |
| P0 cobertura | Coleadero modela solo tres coleadores. | La UI real muestra Coleador 1, 2 y 3; la matriz marca ausentes `PARTICIPANT_04.NAME` y `BOTTOM_CONTROL_04`. | No cubre la cuarta fila FMCH. |
| P1 semantica | Cala usa grupos `ML` y `CR` frente a FieldID `MD`, `MI` y `PC`. | UI real, score oficial `breakdown.adicGroups` y matriz. | Requiere validacion deportiva antes de certificar equivalencia oficial. |
| P1 integracion documental | La pagina independiente `formato-federacion.html` no recupero la charreada activa al abrirse desde Resultados. | Con Cala=20 persistida, la pagina mostro `No hay una charreada activa con equipos para mostrar`. | Hoy existe dato suficiente para una hoja parcial, pero el visor independiente no la presenta de forma confiable. |
| P1 formato | Firmas, logo FMCH y footer no tienen captura o composicion oficial completa. | `officialFormat.js` y los 7 FieldID faltantes. | La hoja no alcanza equivalencia documental completa. |
| P1 operacion | Confirmacion o refutacion multi-juez no es estado explicito del flujo revisado. | `OFFICIAL_SCORE_FLOW.md`. | Requiere validacion operativa autorizada. |

El bloqueo anterior de autenticacion y navegador queda cerrado; ya no es una
brecha del diagnostico. Tampoco se incluyen como faltantes los valores que ya
existen como regla aplicada, estado, calculo o desglose y solo necesitan
transformacion de exportacion.

## Hoja llenada al estado actual

Con la informacion validada hoy, la hoja seria parcial: Charros Demo del Norte
con Cala igual a 20 y las demas suertes sin registro. El motor dispone del score,
el desglose, el equipo, la jornada y el torneo para construir esa representacion.
Sin embargo, el enlace visual independiente no resolvio `activeCharreadaId`, por
lo que no debe declararse todavia una hoja FMCH completa y reproducible desde ese
entrypoint.

## Observaciones separadas del score

Durante la prueba local, el intento directo de snapshot publico reporto error y
el trabajo de Recovery quedo inicialmente en `PROCESSING`; el score oficial, su
auditoria, `live/current` y el fanout server-side si quedaron confirmados. Esta
observacion pertenece a Public Projection Recovery y no cambia la evaluacion de
los FieldID del calificador.

## Exclusiones mantenidas

No se corrigieron la cuarta fila de Coleadero, el id `ttm` duplicado ni las
equivalencias FMCH de Cala. Tampoco se alteraron reglas deportivas, calculos,
persistencia, Firebase Rules, Portal Publico, Broadcast ni Produccion.
