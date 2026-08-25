# Timer Identity Audit

## Base comun

Toda identidad certificada requiere:

`tournamentId / competitionId / charreadaId / teamId / suerteId / phaseId`

Se agregan dimensiones solo cuando el reglamento distingue una ejecucion nueva.

| Dominio | Dimensiones adicionales | Razon |
|---|---|---|
| Cala | `participantId` | Distingue calador y fases revision/salida |
| Piales | `participantId`, `opportunityIndex` | Cada oportunidad tiene su plazo, incluido 2/3 min condicional |
| Coleadero | `participantId`, `coleadorIndex`, `opportunityIndex` | Tres coleadores por tres oportunidades, sin reutilizar FINISHED |
| Toro | `participantId` | Un apretalamiento por jineteo |
| Terna | `sharedDomain:terna` | Cabecero y Pial comparten la misma ventana; no usa oportunidad como identidad del reloj |
| Yegua | `participantId`, fase | Apretalamiento y desmontarse son relojes distintos |
| Manganas Pie | `participantId` | Una ventana total para sus oportunidades |
| Manganas Caballo | `participantId`, fase | Cambio y ejecucion son fases distintas |
| Paso | `participantId`, `opportunityIndex`, fase | Salida y desmontarse no comparten identidad |

## Invariantes

- Un `FINISHED` historico no se reutiliza para una oportunidad reglamentariamente nueva.
- Cambiar Cabecero a Pial no crea ni reinicia la ventana de Terna.
- Un Timer RUNNING/PAUSED sigue bloqueando cambios silenciosos de contexto.
- La politica no elimina CAS, ownership, idempotencia ni auditoria de Timer Authority.
- El resolver entrega copias desacopladas; modificar una resolucion no altera la autoridad.
