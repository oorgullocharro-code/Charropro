# CHARROPRO-SCORER-SAVE-AND-NEXT-LATENCY-AUDIT-001

## Dictamen tecnico

APROBADO para integracion local. No publicado.

La preparacion de publicacion usa el build
`20260822-scorer-save-next-latency-audit-001-v1`. El reemplazo transversal se
limito a las 74 referencias existentes del build anterior y no agrego rutas al
working tree.

El avance del scorer sigue esperando la confirmacion autoritativa de
`publishCharroProOfficialScore`. La reconciliacion de Projection Outbox y la
publicacion del estado live se ejecutan despues del avance visual.

## Causa principal

`publishFirebaseOfficialScoreAtomic()` esperaba la reconciliacion completa de
Projection Outbox antes de devolver el score oficial. Esa espera mantenia
bloqueados `advanceScoringPointer()` y el render del siguiente turno aunque la
transaccion oficial ya estuviera confirmada.

## Flujo final

1. Validacion deportiva y de contexto local.
2. Snapshot Attempt V2 y persistencia local.
3. Callable oficial con Auth, CAS e idempotencia.
4. Confirmacion del score oficial, historial y fanout durable.
5. Resolucion de Terna o Pending Review, si corresponde.
6. Avance canonico del Flow Engine y render del siguiente turno.
7. Projection Outbox, Portal Publico y live sync en segundo plano.
8. Estado visible `Guardado ✓` o `Pendiente de sincronizar`.

## Garantias preservadas

- CAS e idempotencia permanecen en la autoridad de servidor.
- Un fallo de escritura critica no avanza el puntero.
- Un fallo secundario conserva el score y usa Recovery.
- No se duplican scores ni attempts ante retries.
- Timer Authority, Pending Review, Terna y Flow Engine conservan su contrato.
- La charreada activa se valida de nuevo dentro de la transaccion oficial.
- No hubo cambios deportivos, Firebase Rules, deploy ni escrituras productivas.
- `FMCH_2026_LIBRE 0.6.0` permanece `ACTIVE` y no fue modificado durante esta
  preparacion.

## Limitacion

La meta ideal de 500 ms no se alcanzo. El callable oficial consume la mayor
parte de la ruta critica y no se hizo optimista porque eso permitiria mostrar
el siguiente turno antes de confirmar la escritura oficial. El intento
secundario termino dentro de 1 a 2 segundos en Emulator; con rol juez quedo
pendiente para Recovery por la politica de escritura publica. El estado
terminal `CLIENT_CONFIRMED` fue validado por la prueba de integracion.
