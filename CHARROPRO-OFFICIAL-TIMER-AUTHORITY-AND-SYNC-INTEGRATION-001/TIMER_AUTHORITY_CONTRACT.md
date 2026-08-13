# Timer Authority Contract

## Fuente única

El Timer Engine existente de `js/core/timerRules.js` es la única autoridad temporal. Ninguna interfaz mantiene un cronómetro oficial independiente.

Ruta canónica durable:

`charropro/tournaments/{tournamentId}/officialTimers/{timerKey}`

Cada consumidor usa el mismo `timerId`, `status`, `revision`, `officialElapsedMs` y `remainingMs`.

## Identidad de contexto

El contexto puede incluir:

- `tournamentId`
- `competitionId`
- `charreadaId`
- `teamId` o `participantId`
- `suerteId`
- `contextType`

No existe fallback cruzado entre torneos, competencias, charreadas o participantes.

## Estado y transiciones

Estados oficiales:

- `READY`
- `RUNNING`
- `PAUSED`
- `FINISHED`

Transiciones autorizadas:

| Estado actual | Comando | Estado siguiente |
| --- | --- | --- |
| READY | START | RUNNING |
| RUNNING | PAUSE | PAUSED |
| RUNNING | FINISH | FINISHED |
| PAUSED | RESUME | RUNNING |
| PAUSED | FINISH | FINISHED |

`FINISHED` no se reactiva mediante un comando ordinario. Reset no es una acción primaria y conserva las protecciones del flujo existente.

## Concurrencia

Cada transición exige:

- usuario autenticado y rol autorizado;
- controller ownership compatible;
- `controllerUid` igual al usuario autenticado;
- `expectedRevision` igual a la revisión canónica;
- `commandId` válido;
- transición de estado permitida.

La escritura usa transacción RTDB. Un conflicto de revisión o de controlador se rechaza de manera atómica; no se usa last-write-wins ciego.

## Idempotencia

`commandId` identifica una operación lógica. Si el mismo comando se reintenta:

- no se crea una transición adicional;
- no se incrementa `revision`;
- no se cambia estado;
- no se reescribe `updatedAt`;
- no se reescribe `authorityAcceptedAt`;
- no se vuelve a publicar la proyección como una aceptación nueva.

El adaptador aborta la transacción idempotente y devuelve el timer canónico existente con `projectionResult.skipped: true`.

## Tiempo oficial y tiempo real

Mientras `RUNNING`, el tiempo oficial avanza a partir de la autoridad. Mientras `PAUSED`, `officialElapsedMs` queda congelado y el tiempo real continúa como evidencia auditable. Al reanudar no se suma el intervalo de pausa al tiempo oficial.

## Ownership y failover

Tipos preparados:

- `field_remote`
- `scorer_backup`
- `supervisor_backup`
- `system`
- `smartwatch` (contrato solamente)
- `hardware_remote` (contrato solamente)

El Remote reclama control al iniciar cuando no existe controlador. El Scorer no se apropia automáticamente: usa `TAKEOVER_CONTROL`. El retorno al campo usa `HANDOFF_CONTROL`. Ambos conservan `timerId`, tiempos, pausas e historial, e incrementan una sola revisión.

## Proyecciones

Timer Display, Announcer y Broadcast reciben copias sanitizadas. Las proyecciones conservan identidad, estado, revisión, tiempos y motivo de pausa; no pueden escribir el timer ni mutar la autoridad.

## Seguridad

Firebase Rules bloquea:

- usuarios sin rol operativo autorizado;
- suplantación de `controllerUid`;
- revisión obsoleta;
- saltos de revisión;
- transiciones inválidas;
- modificación de identidad estable;
- reescritura de `authorityAcceptedAt` para un comando ya aceptado.

La idempotencia se resuelve en el adaptador antes de Rules; una lectura idéntica no se convierte en una nueva escritura.
