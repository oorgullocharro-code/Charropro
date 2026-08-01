# Validacion

## Estado inicial

- Rama: `main`.
- HEAD y `main`: `6df462a39ea846b4c8a5767e2e30550ee34c1533`.
- `origin/main`: `78a51f23ae1f2b13e48667041048b9624f57d6ae`.
- Arbol y staging iniciales: limpios.
- La diferencia local previa de dos commits contra `origin/main` no fue creada
  ni publicada por este ticket.

## Concurrencia e idempotencia

La prueba `official-score-concurrency.test.mjs` confirma:

1. Cien requests iguales producen un commit y 99 respuestas idempotentes.
2. Veinticuatro operadores con la misma revision base producen un commit y 23
   conflictos auditados.
3. Siempre queda un unico score activo.
4. Timeout, refresh o perdida de respuesta reutilizan el registro confirmado.
5. Una correccion avanza de revision 1 a 2 y conserva revision 1 historica.
6. Un retry viejo no reactiva una revision historica.
7. Una revision regresiva se rechaza atomicamente.
8. Una llave reutilizada con otro payload se rechaza.
9. Un torneo finalizado rechaza la publicacion sin cambiar estado oficial.
10. Un ledger o publishedScores legacy con cabeza dividida se normaliza de
    forma determinista y sin borrar historia.
11. Un ledger alterado con dos records activos se repara aun cuando la nueva
    solicitud termine rechazada por revision.

## Autoridad y seguridad

Se verifico que el cliente no puede imponer:

- revision ni version;
- `authUid` ni actor;
- fecha o timestamp;
- `source`;
- un `attemptKey` o `scoreId` incompatible;
- un payload distinto bajo la misma idempotency key.

Tambien se validaron:

- autenticacion obligatoria en la Callable;
- usuario activo;
- rol Supervisor, Operador o Juez;
- acceso al torneo;
- tenant y organizacion cuando el torneo los declara;
- torneo no finalizado ni congelado;
- charreada activa;
- competencia coherente.

## Atomicidad

La funcion pura `applyOfficialScoreTransaction()` representa exactamente la
mutacion usada por la transaccion de Admin RTDB. Devuelve un torneo nuevo y no
muta la fuente.

Dentro de una sola transaccion quedan:

- score vigente;
- registro publicado canonico;
- ledger;
- historial;
- auditoria;
- trabajo durable de fanout;
- metadata oficial.

Los conflictos tambien se auditan en una transaccion sin alterar el score
activo.

## Integracion con Public Projection Recovery

`public-live-feed-integration.test.mjs` usa el motor transaccional real con el
adapter Firebase falso existente. Confirma:

- publicacion privada canonica;
- creacion del outbox;
- falla publica posterior al commit oficial;
- retry sin duplicar el score;
- timeout posterior a escritura;
- correcciones y supersesion;
- dead-letter y recovery;
- convergencia del Portal Publico.

## Rules

`firebase-rules-auditoria.json` se parsea como JSON y las pruebas comprueban:

- `publishedScores` solo servidor;
- `officialScoreLedger` solo servidor;
- `officialScoreAudit` solo servidor;
- `officialScoreFanout` solo servidor;
- audit legacy solo servidor y no eliminable por cliente;
- eliminacion cliente de un torneo bloqueada cuando existe historia oficial.

## Limite del entorno

`firebase.json` no configura RTDB Emulator. Las expresiones de Rules se
validaron por parseo, inspeccion estatica y pruebas ejecutables del contrato,
pero no se ejecutaron contra el motor Emulator. No se uso Firebase de
produccion.

Antes de un deploy productivo debe ejecutarse un gate controlado con Emulator o
proyecto aislado. Functions y Rules deben publicarse en la misma ventana de
cambio.

## Alcance

- Sin cambios deportivos.
- Sin cambios de ranking o estadisticas.
- Sin cambios visuales salvo mensaje ante conflicto real.
- Sin cambios en Broadcast Studio, Portal Publico o Recovery Center.
- Sin dependencias nuevas.
- Sin datos de produccion.
- Sin push.
- Sin deploy.
