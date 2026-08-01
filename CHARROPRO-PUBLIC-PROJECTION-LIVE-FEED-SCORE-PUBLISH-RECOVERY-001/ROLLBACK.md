# Rollback

## Objetivo

Retirar el reconciliador sin perder scores oficiales, audit, outbox ni evidencia
de incidentes.

## Procedimiento

1. Detener cualquier publicacion controlada o deploy del ticket.
2. Revertir unicamente los archivos listados en `FILES_CHANGED.md`.
3. Restaurar el cache-buster anterior:
   `20260728-app-supervisor-navigation-recovery-001-v1`.
4. Retirar del cliente el timer, los triggers y el panel minimo de recovery.
5. Restaurar la version anterior de `publishFirebaseOfficialScoreAtomic()`.
6. Restaurar las reglas anteriores solo mediante un deploy controlado y despues
   de detener clientes que intenten escribir el outbox.
7. Validar lectura del torneo privado, publicacion oficial, Portal Publico,
   Live Feed y Broadcast con la suite completa.

## Datos

No borrar:

- `charropro/tournaments/{tournamentId}/scores`;
- `charropro/tournaments/{tournamentId}/publishedScores`;
- `charropro/audit/publishedScores`;
- `charropro/live`;
- `charropro/publicTournaments`;
- `charropro/projectionOutbox`.

Los registros de outbox son compatibles como evidencia inerte si el cliente
anterior no los conoce. Deben conservarse para diagnostico o migracion.

## Trabajos pendientes

Antes de deshabilitar recovery:

1. Exportar o registrar conteos por torneo.
2. Identificar `PENDING`, `PROCESSING`, `RETRY_WAIT` y `DEAD_LETTER`.
3. Verificar manualmente `publicTournaments` contra la fuente privada.
4. Proyectar los casos faltantes con la version corregida o una herramienta
   administrativa autorizada.
5. Mantener la lectura cliente como `CLIENT_CONFIRMED`; no convertirla en
   `VERIFIED`.

## Correctivo de seguridad

El rollback no debe reintroducir la posibilidad de que un cliente escriba
`VERIFIED` ni permitir actores declarados por el payload. Las intenciones y
transiciones del outbox deben seguir vinculadas a `auth.uid`. Si se retira el
estado `CLIENT_CONFIRMED`, los trabajos deben permanecer proyectados o
pendientes de reconciliacion, nunca elevarse a verificacion autoritativa.

## Riesgos

Volver al flujo anterior reabre la ventana de publicacion parcial. El rollback
solo es aceptable como contencion temporal y debe mantener monitoreo operativo
del Portal Publico.
