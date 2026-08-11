# Pending Review Contract v1

## Identidad

Cada intento genera un `attemptKey` determinista con torneo, competencia, charreada, entrada, suerte, coleador, oportunidad y oportunidad compartida. `pendingId` deriva de esa identidad y evita duplicados por doble toque o retry.

## Registro

El registro incluye:

- `pendingReviewVersion`, `pendingId`, `attemptKey`, `idempotencyKey`;
- `tournamentId`, `competitionId`, `charreadaId`;
- `teamId` o `participantId`, y `participantScope`;
- `suerteId`, `attemptIndex`, `coleadorIndex`;
- `sharedOpportunityId`, `sharedSequenceNumber`, `scoreId`;
- `status`, `reason`, `metadata`;
- `draftSnapshot` con score collection y Attempt V2 draft;
- `returnContext` con puntero y borrador operativo exacto;
- `resolutionSession`, `officialScore`;
- `revision`, actores, timestamps y `audit`.

## Estados

`pending_review` es distinto de draft, cero, DQ y error de publicacion. `resolved` solo se alcanza despues de una publicacion oficial confirmada.

Transiciones:

```text
create -> pending_review
pending_review -> open -> draft_updated*
open -> close -> pending_review
open -> official publication -> resolved
```

Un fallo de publicacion no ejecuta la transicion `resolved`, no borra el draft y no altera `returnContext`.

## Concurrencia

- Toda escritura remota usa `runTransaction()`.
- Crear exige revision remota 0 y registro revision 1.
- Cada cambio exige `expectedRevision` exacta y aumenta una revision.
- La identidad y los campos de creacion son inmutables en Rules.
- Repetir el mismo request es idempotente.
- Una revision obsoleta se rechaza y devuelve el registro remoto vigente.
- La sesion que abre una pendiente conserva una identidad por pestana en `sessionStorage`: sobrevive a la recarga de esa pestana y no activa la resolucion en otras pestanas del mismo dispositivo.
- La recuperacion reactiva el guard de borrador antes de hidratar scores remotos, evitando que un valor oficial anterior reemplace el draft pendiente.
- Dos publicaciones oficiales siguen protegidas por Official Score Concurrency; Pending no duplica esa autoridad.

## Seguridad

La clonacion segura elimina funciones, simbolos, BigInt, ciclos y claves `__proto__`, `constructor` y `prototype`; limita profundidad, arreglos y strings, y conserva `0`, `false` y `""`.

Rules permiten escribir solo a Juez o Supervisor activos con acceso al torneo. No se permite delete. Un registro resuelto requiere identidad del score oficial y conserva auditoria.

## Navegacion exacta

Al abrir se guarda el punto actual y su score collection. Al resolver o cancelar se restaura por IDs canonicos, usando indices solo como fallback. Esto evita volver al inicio de la suerte, del equipo o de la charreada.
