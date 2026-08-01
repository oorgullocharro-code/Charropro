# CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001

## Objetivo

Hacer durable, idempotente, observable y verificable la obligacion de actualizar
`publicTournaments` despues de guardar un score oficial.

## Flujo anterior

`publishOfficialScoreForContext()` llamaba a
`publishFirebaseOfficialScoreAtomic()`. Esta funcion confirmaba primero una
actualizacion multipath privada con:

- `charropro/tournaments/{tournamentId}/scores/{scoreId}`;
- `charropro/tournaments/{tournamentId}/publishedScores/{publishedScoreId}`;
- `charropro/audit/publishedScores/{tournamentId}/{publishedScoreId}`;
- `charropro/live/{tournamentId}/current`;
- metadata privada del torneo.

Despues ejecutaba por separado `publishPublicTournamentSnapshot()`. Si esa
segunda operacion fallaba, el score privado permanecia oficial y el Portal
Publico podia quedar desactualizado, sin una obligacion durable de reintento.

## Flujo implementado

```text
score oficial + audit + live privado + intent durable
                    |
                    v
        projectionOutbox/{tournamentId}/{projectionId}
                    |
                    v
       reconciliador con claim y lease transaccional
                    |
                    v
       proyector publico existente y sanitizado
                    |
                    v
        lectura cliente de confirmacion + fingerprint
                    |
                    v
   CLIENT_CONFIRMED / RETRY_WAIT / DEAD_LETTER
```

La intencion immutable se escribe en el mismo `update()` raiz que confirma la
fuente privada. El reconciliador nunca usa un payload publico almacenado por el
navegador: reconstruye la proyeccion desde el torneo privado vigente y utiliza
el proyector V2 existente.

## Modelo durable

Ruta:

`charropro/projectionOutbox/{tournamentId}/{projectionId}`

Subnodos:

- `intent`: identidad y contrato de fuente, immutable despues de crearse.
- `state`: estado operativo, intentos, lease, error sanitizado y evidencia de
  convergencia.

`projectionId` e `idempotencyKey` derivan deterministicamente de:

- `projectionType`;
- `tournamentId`;
- `attemptKey`;
- `publishedScoreId`;
- `sourceRevision`.

Una nueva revision crea un trabajo distinto. El reconciliador compara trabajos
del mismo intento y marca los anteriores como `SUPERSEDED`.

## Estados

| Estado | Significado | Retry |
| --- | --- | --- |
| `PENDING` | Existe obligacion durable | Automatico o manual |
| `PROCESSING` | Un worker posee un lease temporal | Al expirar el lease |
| `PROJECTED` | Se confirmo escritura; falta lectura de confirmacion | Si |
| `CLIENT_CONFIRMED` | El mismo cliente leyo un destino convergente; no es autoridad servidor | No |
| `VERIFIED` | Verificacion autoritativa reservada para backend futuro | No |
| `RETRY_WAIT` | Falla recuperable con proximo intento | Si |
| `FAILED` | Estado clasificable conservado por contrato | Si |
| `DEAD_LETTER` | Error no recuperable o intentos agotados | Solo manual |
| `SUPERSEDED` | Existe una revision mas nueva | No |
| `CANCELLED` | Cancelacion terminal con razon | No |

El SDK cliente nunca puede escribir `VERIFIED`. Una lectura coincidente termina
en `CLIENT_CONFIRMED`; `VERIFIED` permanece reservado para una autoridad
confiable que no existe todavia en este ticket. El diagnostico manual solo lee
el destino y no cambia el estado.

## Autoridad de transiciones

- Creacion del intent: SDK cliente autorizado; `createdBy.uid` debe ser
  `auth.uid`.
- `PENDING`/`RETRY_WAIT`/`FAILED` a `PROCESSING`: cliente autorizado con claim,
  lease y actores ligados a `auth.uid`.
- `PROCESSING` a `PROJECTED`: el mismo actor del claim mientras el lease sigue
  vigente.
- `PROJECTED` a `CLIENT_CONFIRMED`: cliente autorizado despues de readback
  coincidente; es evidencia operativa, no autoridad servidor.
- Retry: cliente autorizado; `retriedBy.uid` debe ser `auth.uid`.
- Cancelacion: solo Supervisor; actor, razon y fecha son obligatorios.
- `SUPERSEDED`: reconciliador autorizado y referencia a un intent durable con
  revision superior.
- `VERIFIED`: reservado a Admin SDK o backend confiable futuro; todas las
  escrituras del SDK cliente son rechazadas.

## Correctivo de seguridad

El cierre tecnico inicial fue rechazado porque `createdBy.uid` podia
falsificarse y un cliente podia autodeclarar `VERIFIED`. El correctivo:

- vincula `createdBy.uid` con `auth.uid` y conserva el intent immutable;
- toma el UID del usuario autenticado, no del payload externo;
- vincula `updatedBy`, `claimedBy`, `lastAttemptBy`, `retriedBy` y
  `cancelledBy` con `auth.uid` cuando el cliente los escribe;
- prohibe cualquier escritura cliente con estado `VERIFIED`;
- usa `CLIENT_CONFIRMED` para la evidencia de readback del cliente;
- reserva cancelacion a Supervisor con razon, actor y fecha;
- conserva `VERIFIED` solo para compatibilidad y autoridad servidor futura.

## Retry y reconciliacion

- Maximo: 5 intentos automaticos.
- Backoff base: 1 s, 5 s, 15 s, 60 s y 5 min.
- Jitter determinista habilitado en operacion normal.
- Lease por defecto: 30 s.
- Errores recuperables: red, timeout, desconexion, unavailable, permisos,
  transaccion abortada y destino aun no verificado.
- No recuperables: fuente ausente, intent invalido, proyeccion invalida,
  conflicto de fuente o tenant.

Se activa al iniciar una sesion autorizada, preparar la aplicacion, abrir o
cambiar torneo, recuperar conexion, publicar un score y cada 30 segundos. Solo
existe un timer y una ejecucion concurrente por instancia.

## Operacion manual

Recovery Center muestra, por torneo:

- pendientes;
- en espera;
- dead-letter/intervencion;
- proyecciones escritas;
- confirmados por lectura cliente;
- verificacion autoritativa pendiente;
- verificados por autoridad, normalmente cero en esta version;
- intentos;
- revision;
- ultimo error sanitizado;
- proximo retry o fecha de verificacion.

Acciones controladas:

- actualizar backlog;
- reintentar uno;
- reintentar elegibles;
- diagnosticar convergencia sin mutar el estado.

Las mutaciones de recovery se limitan a roles con capacidad `sync`:
Supervisor, Operador y Juez.

## Compatibilidad

- La fuente oficial privada conserva su estructura.
- `publicTournaments` sigue siendo la proyeccion publica V2 existente.
- Portal Publico, Live Feed y Broadcast no cambian de contrato.
- No se migran torneos ni scores historicos.
- No se eliminan rutas legacy.
- No se modifican scores, calculos, rankings ni reglas deportivas.

## Version

`20260729-public-projection-recovery-001-v1`
