# Auditoria funcional del calificador actual

## Dictamen

DICTAMEN: NO APROBADO

La auditoria confirma que el calificador actual contiene una base funcional mas rica
que la inferida desde exportadores aislados: captura por oportunidades, botones de
base/adicional/infraccion/descalificacion, punta calculada, ceros, penalizaciones de
equipo, desglose y score publicado con historial. Sin embargo, no fue posible ejecutar
las pantallas autenticadas de juez en un entorno local permitido. La aplicacion web no
consume hoy los hosts del Firebase Emulator, y no se usaron credenciales ni Produccion.
Por ello no se puede afirmar la ejecucion visual completa requerida por este ticket.

## Alcance realizado

- Inspeccion estatica de los entrypoints, componentes, estado, calculos, publicacion y
  formato oficial.
- Ejecucion local sintetica del motor para las diez suertes y de la construccion de
  hoja oficial e historial, sin Firebase ni datos deportivos reales.
- Matriz por capas de los 239 FieldID de la especificacion FMCH.
- Reconciliacion con el diagnostico documental anterior, sin alterar sus archivos.
- Observacion local de la puerta de acceso privada; no se supero sin un perfil valido.

## Resultado de la matriz

| Evaluacion principal | FieldID |
| --- | ---: |
| PRESENT | 13 |
| DERIVABLE | 177 |
| MISSING | 7 |
| AMBIGUOUS | 42 |
| Total revisado | 239 |

Las capas no son excluyentes. Un campo puede estar en UI, estado, calculo, persistencia,
score oficial, auditoria y exportacion a la vez. La evaluacion principal expresa el
riesgo restante para una correspondencia oficial FMCH exacta.

## Hallazgos prioritarios

1. Bloqueo de evidencia visual: el navegador local exige autenticacion y el bootstrap
   web aun no tiene conector de Emulator por perfil. Es un bloqueo de auditoria, no una
   afirmacion de ausencia funcional del calificador.
2. Coleadero crea tres coleadores por equipo; la hoja FMCH tiene una cuarta fila. No se
   observo modelo nativo de cuarta fila.
3. Cala expone LD, LI, ML y CR. La equivalencia solicitada de PC con CR requiere
   validacion deportiva FMCH antes de declararla exacta.
4. Toro reutiliza el identificador ttm para un adicional (Tentemozo) y una infraccion
   (Tiempo excedido). Como attempt.applied es una lista plana, la seleccion visual y la
   trazabilidad de ambos conceptos pueden confluir.
5. Firmas, emblema institucional y pie de pagina son huecos de formato/captura oficial;
   no invalidan por si solos la captura de puntos, pero no deben presentarse como hoja
   FMCH completamente equivalente.

## Restricciones respetadas

No se modificaron archivos funcionales, reglas deportivas, Firebase, exportadores,
Portal, Broadcast, Backup, Restore, configuracion, datos, Produccion, staging, push ni
deploy. Estos 25 archivos son evidencia documental nueva y quedan sin staging.

## Siguiente paso propuesto

Antes de repetir este ticket con dictamen aprobatorio se requiere un ticket separado de
configuracion segura de runtime de navegador para Emulator, con perfiles explicitos y
sin fallback implicito a Produccion. Despues debe repetirse la auditoria con un usuario
local Juez/Supervisor y fixtures de torneo de ensayo.
