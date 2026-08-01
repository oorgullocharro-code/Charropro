# CHARROPRO-OFFICIAL-SCORE-CONCURRENCY-001

## Objetivo

Garantizar una sola revision oficial activa por intento deportivo, aun con
publicaciones simultaneas, reintentos, recargas, latencia o perdida de la
respuesta al cliente.

## Punto de autoridad

La autoridad se movio de una escritura multipath iniciada por el navegador a
la Callable Function autenticada `publishCharroProOfficialScore`.

```text
Calificador
    |
    v
Callable autenticada
    |
    v
Transaccion RTDB por torneo
    |-- score vigente
    |-- publishedScores canonicos
    |-- officialScoreLedger
    |-- officialScoreAudit
    |-- officialScoreFanout durable
    |
    v
Fanout servidor idempotente
    |-- audit/publishedScores legacy
    |-- projectionOutbox
    `-- live/current
```

La transaccion se limita al torneo afectado. No existe lock global entre
organizaciones o torneos.

## Identidad del intento

La llave canonica se deriva exclusivamente de:

- torneo;
- charreada;
- equipo o participante representado por la unidad competitiva vigente;
- suerte;
- indice de intento;
- indice de coleador.

De esa llave se deriva `attemptId`. Cada ledger conserva exactamente un
`activeRecordId` y una revision monotona.

## Compare-And-Swap

Cada operacion declara `expectedRevision`. La transaccion acepta la operacion
solo si coincide con la revision confirmada por servidor.

- La primera operacion valida incrementa la revision una vez.
- Una operacion concurrente basada en la revision anterior se rechaza.
- Nunca se usa el reloj del navegador para elegir ganador.
- Nunca se aplica una politica de ultimo write gana.
- Un conflicto no reemplaza el score vigente.

## Idempotencia

El navegador conserva temporalmente la operacion por intento y reutiliza su
`idempotencyKey` despues de timeout, refresh o reconexion. El servidor vincula
esa llave a un fingerprint inmutable.

- Misma llave y mismo payload: devuelve el commit anterior.
- Misma llave y payload diferente: conflicto.
- Retry de una revision ya reemplazada: conflicto, sin reactivar historia.
- Cien reintentos equivalentes producen un registro y una revision.

## Campos de autoridad

El servidor genera o fija:

- `revision`;
- `version`;
- `createdAt`;
- `updatedAt`;
- `timestamp`;
- `actor`;
- `authUid`;
- `idempotencyKey`;
- `source`;
- `sourceFingerprint`.

El total y el desglose oficial se conservan exactamente como los entrega el
motor deportivo existente. No se recalculan.

## Historial

`officialScoreLedger/{attemptId}` contiene:

- un unico `activeRecordId`;
- revision vigente;
- registros historicos completos;
- indice de requests idempotentes;
- identidad de competencia e intento;
- actores y timestamps de servidor.

Una correccion crea un registro nuevo. El anterior cambia a `historical` y
conserva el vinculo `supersededBy`. Ningun registro anterior se elimina.

El bootstrap de datos legacy resuelve deterministamente una cabeza dividida:
mayor revision y, en empate, menor ID lexicografico. La siguiente correccion
conserva todos los registros encontrados.

## Auditoria

Cada commit, conflicto o rechazo registra en `officialScoreAudit`:

- usuario y `authUid`;
- actor y rol;
- dispositivo declarado;
- fecha y timestamp servidor;
- revision;
- operacion;
- resultado;
- motivo;
- fuente e idempotency key.

Las Rules impiden escrituras cliente a ledger, published scores, fanout y audit
oficial. Un torneo con historia oficial tampoco puede eliminarse desde cliente.

## Fanout y compatibilidad

El fanout se registra dentro de la misma transaccion que el score. La Callable
intenta entregarlo de inmediato y el trigger
`deliverCharroProOfficialScoreFanout` reintenta fallas parciales.

Esto conserva:

- Public Projection Recovery y su outbox;
- Portal Publico y Live Feed;
- Broadcast Studio y Program Main;
- rutas legacy de audit y live;
- estructura deportiva y flujo visible del juez.

No se modificaron reglas deportivas, calculos, rankings ni estadisticas.

## Version

`20260801-official-score-concurrency-001-v1`

No hubo push ni deploy en este ticket.
