# Contrato de Estado Compartido de Terna

## Identidad

La identidad estable se construye con:

```text
tournamentId + competitionId + charreadaId + teamId
```

De ella derivan `ternaSessionId`, cinco `sharedOpportunityId` y un `sharedTimerId`. No se usa el nombre del equipo ni el reloj del cliente como identidad.

## Estructura

```json
{
  "contractVersion": "1.0.0",
  "ternaSessionId": "terna:torneo:competencia:charreada:equipo",
  "tournamentId": "...",
  "competitionId": "...",
  "charreadaId": "...",
  "teamId": "...",
  "status": "READY",
  "sharedTimerId": "...:timer",
  "opportunityLimit": 5,
  "opportunities": [],
  "currentOpportunity": 1,
  "activeOpportunity": null,
  "history": [],
  "remateHistory": { "HEAD": [], "PIAL": [] },
  "headCounted": false,
  "pialCounted": false,
  "timeAdditional": {},
  "revision": 0,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

## Oportunidades

- El limite es exactamente cinco.
- `sharedSequenceNumber` debe ser consecutivo y sin duplicados.
- Solo puede existir una oportunidad activa por sesion.
- `HEAD` y `PIAL` comparten la misma secuencia.
- Una reserva usa `ACTIVE` y no modifica el historial.
- Solo una publicacion oficial exitosa genera `CONSUMED`.
- Reintentar el mismo `sharedOpportunityId` es idempotente.
- Una correccion sustituye la entrada de la misma oportunidad sin crear una sexta ni alterar el resto del historial.
- Tras consumir 5/5, `currentOpportunity` es `null` y la sesion queda `COMPLETED`.

## Scores oficiales

Lazo Cabecero y Pial en el Ruedo conservan sus propios `scoreId`, `publishedScoreId`, participante y total. El snapshot oficial recibe los campos compartidos:

- `sharedOpportunityId`;
- `sharedSequenceNumber`;
- `sharedTimerId`;
- `opportunityType`;
- `opportunityStatus: CONSUMED`;
- remate y timing cuando aplican.

El intento editable no se muta para simular exito. El congelamiento oficial se construye a partir de una copia desacoplada.

## Timer oficial

El contexto de Terna dura `420000 ms` y soporta:

- `READY`;
- `RUNNING`;
- `PAUSED`;
- `FINISHED`.

Cada comando exige una revision esperada. `officialElapsedMs` suma solo periodos en ejecucion; `wallElapsedMs` conserva el tiempo real transcurrido. Cada pausa registra inicio, fin, duracion de pared y motivo. Cambiar entre Cabecero y Pial no crea ni reinicia el timer.

## Adicional por tiempo

El adicional se habilita solo cuando existe una cabeza valida y un pial valido. Se calcula con minutos oficiales completos no utilizados y se publica como correccion oficial independiente sobre ambos scores contados. El estado comun registra publicaciones y fallos como `NOT_REQUIRED`, `PENDING`, `PUBLISHED`, `PARTIAL` o `FAILED`.

## Invariantes

- No hay mas de cinco elementos historicos.
- No existe consumo sin publicacion oficial.
- No existe avance ante fallo.
- No se infiere una oportunidad desde el indice visual.
- No se comparten referencias mutables entre draft, snapshot oficial e historial.
- Dos timers con IDs distintos pueden estar activos simultaneamente.
- Cero no equivale a DQ.
- Los historicos no se recalculan.
