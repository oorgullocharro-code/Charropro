# Riesgos residuales

## Functions y Rules no desplegadas

La garantia entra en vigor en produccion solo cuando se publiquen la Callable,
el trigger y las Rules. Este ticket no hizo deploy.

Orden recomendado para una ventana controlada:

1. Desplegar Functions nuevas de forma aditiva.
2. Verificar la Callable con un torneo aislado.
3. Desplegar Rules que cierran escrituras cliente.
4. Publicar el cliente versionado.
5. Ejecutar smoke test concurrente y recovery publico.

Publicar Rules antes de Functions bloquearia clientes nuevos y legacy. Publicar
el cliente antes de la Callable produciria `functions/not-found`.

## Sin RTDB Emulator

Las Rules tienen parseo, inspeccion y pruebas estaticas, pero no ejecucion en
Firebase Emulator. Debe agregarse ese gate antes del deploy productivo. Este
limite no se oculta ni se sustituye con Firebase real.

## Contencion por torneo

La transaccion cubre el torneo completo para que score, published record,
ledger, audit y fanout sean atomicamente consistentes con las rutas legacy.
Esto evita estados intermedios, pero una competencia con escrituras privadas de
muy alta frecuencia puede producir retries de RTDB.

El lock es por torneo, nunca global. Debe monitorearse latencia, abortos y numero
de retries. Si el volumen real lo exige, una evolucion futura puede mover la
fuente canonica a un agregado por intento y proyectar vistas legacy, mediante
migracion formal y sin perder compatibilidad.

## Dispositivo no atestado

`authUid`, rol y permisos provienen de Firebase Auth y del perfil servidor. El
descriptor de dispositivo se conserva para auditoria operativa, pero no es una
identidad de hardware atestada. No debe usarse como factor de autorizacion.

## Eliminacion de torneos con historia

Las Rules bloquean la eliminacion cliente de torneos que ya tienen scores
oficiales. Una eliminacion administrativa futura debe ser server-side,
autorizada, auditable y conservar el historial. No se creo ese flujo en este
ticket.

## Rama local adelantada

Antes del ticket, `main` ya estaba dos commits por delante de `origin/main`.
No se hizo push y esa diferencia permanece. Cualquier publicacion posterior
debe revisar los commits locales completos, no solo este ticket.

## Estado del programa

Este P0 puede cerrarse tecnicamente sin aprobar todo CSP-M1. Los demas gates P0
del programa siguen independientes y `CHARROPRO_CORE_STABILIZATION_PROGRAM.md`
no se modifica aqui.
