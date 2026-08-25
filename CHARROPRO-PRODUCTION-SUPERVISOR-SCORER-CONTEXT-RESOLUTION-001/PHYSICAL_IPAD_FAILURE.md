# Physical iPad Failure

## Evidencia inicial

En Produccion, un Supervisor en iPad recibia `Sin suertes calificables` aunque la autoridad global mostraba `FMCH_2026_LIBRE 0.6.0`, estado `active`, certificacion PASS, P0 0 y fingerprint `rptp_0f90f7a3944a82d7`.

## Causa

Algunos torneos Libre productivos existian sin `ruleProfileAssignment`. El render agrupaba ese estado incompleto con un catalogo deportivo realmente vacio. Ademas, la creacion podia navegar antes de confirmar la asignacion server-side.

## Gate pendiente

La automatizacion visual local fue rechazada por la politica de seguridad del navegador para la URL local. Tras el deploy debe ejecutarse una prueba fisica en iPad con Supervisor: crear torneo Libre nuevo, crear charreada por equipos, abrir Calificar, verificar diez suertes, hard refresh y cambio entre torneos.
