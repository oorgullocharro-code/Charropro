# Functional Contracts

## Pending Review

- Una revision remota atrasada no degrada una revision local mas nueva.
- Un snapshot remoto vacio no borra una confirmacion durable local.
- Un conflicto real entre clientes permanece bloqueado.
- `expectedRevision` y CAS siguen siendo obligatorios; no existe overwrite silencioso.

## Coleadero

- El resultado final compara el conjunto canonico de coleadores de la charreada.
- Ya no se presenta un ganador separado por equipo como resultado final de Colas.
- La identidad no depende del nombre visible.
- Los empates permanecen explicitos; no se inventa desempate.
- Los scores individual y de equipo no se recalculan ni se sustituyen.

## Terna

- Cabecero no logrado continua en Cabecero.
- Cabecero logrado avanza a Pial.
- Pial no logrado continua en Pial.
- Pial logrado completa Terna cuando Cabecero ya esta contado.
- El exito depende de `Attempt V2.scoring.baseSelection.selectedRuleId` y del estado deportivo; no depende de `attempt.base > 0`.
- `ZERO`, `NOT_ACHIEVED`, `DQ` y puntos sin seleccion base no completan fase.
- Las cinco oportunidades son un maximo compartido, no una cuota obligatoria.
- `headCounted && pialCounted` completa inmediatamente, conserva las oportunidades consumidas y cierra el resto como `CLOSED_UNUSED`.
- El avance posterior se delega al Flow Engine canonico.

## Presentacion operativa

- Manganas conserva Resultado, Floreo, Tirones, Remates, detalle e historial.
- Paso conserva clasificacion, resultado, contexto y controles temporales existentes.
- Captura manual conserva el orden Concepto, Puntos, Cancelar y Agregar cuando el ancho lo permite, con reflow responsive.
