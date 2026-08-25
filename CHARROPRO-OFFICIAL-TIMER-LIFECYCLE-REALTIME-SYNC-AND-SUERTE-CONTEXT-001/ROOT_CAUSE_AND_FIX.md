# Root Cause and Fix

## Incidente Finish

`FINISH` producia correctamente `FINISHED`; no llamaba `destroy()`. El defecto estaba en `reconcileSelectedTimer()`: mientras el Timer terminado siguiera en el registro, la seleccion persistida se consideraba valida aun cuando ya no perteneciera a las definiciones de la suerte activa.

## Correctivo

`resolveOfficialTimerSelection()` separa definiciones vigentes de registros historicos:

- conserva la seleccion si pertenece al contexto actual;
- cambia al nuevo Timer si el anterior esta terminado/inactivo;
- bloquea el cambio silencioso si el anterior esta corriendo o pausado;
- limpia la seleccion para suertes sin Timer;
- preserva todos los registros historicos.

Piales y Coleadero incluyen oportunidad/participante en el `timerId`, evitando que una oportunidad posterior herede un estado terminal.

## Scorer y Graphics

La auditoria confirmo que ambos enlaces siguen presentes. La regresion aparente del Scorer es compatible con el bootstrap de acceso corregido en el ticket anterior; este ticket agrega cobertura especifica y no duplica la autoridad.
