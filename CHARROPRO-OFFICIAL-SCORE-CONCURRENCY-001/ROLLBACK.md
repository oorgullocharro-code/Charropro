# Rollback

## Antes de deploy

Como este ticket no despliega, el rollback local consiste en revertir su commit
completo. No deben borrarse manualmente archivos ni mezclarse partes del cliente,
Functions o Rules.

## Despues de deploy

La autoridad, el cliente y las Rules forman una unidad de compatibilidad.

1. Detener temporalmente la publicacion oficial.
2. Exportar y verificar `officialScoreLedger`, `officialScoreAudit`,
   `publishedScores` y `officialScoreFanout`.
3. Confirmar que no existen fanouts `PENDING` sin diagnostico.
4. Revertir el cliente solo a una version que siga usando la Callable, o mantener
   el cliente actual durante la contencion.
5. Revertir Functions y Rules en una misma ventana controlada.
6. No reabrir escrituras cliente directas sin una excepcion aprobada y temporal.
7. Ejecutar suite, smoke concurrente, Portal Publico, Broadcast y recovery.

## Datos que nunca deben borrarse

- `charropro/tournaments/{tournamentId}/officialScoreLedger`;
- `charropro/tournaments/{tournamentId}/officialScoreAudit`;
- `charropro/tournaments/{tournamentId}/publishedScores`;
- `charropro/tournaments/{tournamentId}/officialScoreFanout`;
- `charropro/audit/publishedScores`;
- `charropro/projectionOutbox`.

Los records del ledger V1 son evidencia historica compatible aunque una version
anterior del cliente no los lea.

## Contencion de emergencia

Si la Callable presenta una falla despues del deploy:

- congelar publicaciones oficiales;
- conservar drafts locales;
- no habilitar ultimo write gana;
- no editar el ledger directamente desde cliente;
- corregir o revertir la Function con evidencia exportada;
- reanudar solo despues de validar idempotencia y revision.

## Verificacion posterior

Confirmar:

- un unico record activo por intento;
- historial completo;
- outbox convergente;
- Portal Publico vigente;
- Broadcast sin regresion;
- Rules sin bypass cliente;
- cero secretos y cero cambios deportivos.
