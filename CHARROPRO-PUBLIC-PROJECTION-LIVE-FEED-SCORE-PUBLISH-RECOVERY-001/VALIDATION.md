# Validacion

## Reproduccion del defecto

La prueba de integracion fuerza un error `permission-denied` exclusivamente en
la transaccion de `publicTournaments`, despues de que el `update()` privado
multiruta termina.

Resultado reproducido antes de la recuperacion:

- score privado presente;
- `publishedScores` privado presente una sola vez;
- audit y live privado confirmados por la misma escritura;
- snapshot publico sin la nueva revision;
- operacion reportada como parcial.

## Validacion de la solucion

La misma prueba confirma:

1. El intent existe en `projectionOutbox` junto con el score privado.
2. La falla publica deja estado `RETRY_WAIT`.
3. El error queda clasificado y sanitizado.
4. Una importacion nueva de `firebaseSync.js` recupera el trabajo durable.
5. El retry no vuelve a escribir ni duplica el score privado.
6. El destino publico se lee y compara antes de `CLIENT_CONFIRMED`.
7. Una llamada equivalente reutiliza el mismo `projectionId`.
8. Un timeout despues de escribir el destino converge al reintentar.
9. Una revision anterior queda `SUPERSEDED`.
10. Una fuente ausente llega a `DEAD_LETTER` sin loop infinito.
11. La reparacion manual autorizada recupera el dead-letter.
12. Un rol no autorizado no puede ejecutar retry desde la API.
13. El UID autenticado sustituye cualquier `createdBy.uid` aportado por payload.
14. La lectura diagnostica no muta el trabajo a `VERIFIED`.
15. El flujo cliente termina en `CLIENT_CONFIRMED`.

## Contrato publico

El reconciliador llama a `buildPublicProjection()` y
`reconcilePublicProjection()` existentes. No copia el torneo privado al
destino. Las pruebas de proyeccion, Portal Publico, Live Feed y Broadcast
continuan pasando.

La verificacion usa:

- validacion del schema publico;
- `metadata.tournamentId`;
- `projectionRevision`;
- `sourceUpdatedAt`;
- fingerprint estable de la proyeccion.

Una proyeccion exactamente igual o una proyeccion estrictamente mas nueva y
compatible se considera coincidente por lectura cliente. Esto no equivale a
verificacion autoritativa.

## Seguridad

Las reglas propuestas:

- mantienen root deny;
- requieren autenticacion y perfil activo;
- requieren Supervisor, Operador o Juez para escribir;
- respetan el acceso del usuario al torneo;
- hacen immutable `intent`;
- exigen `createdBy.uid === auth.uid` y vinculan el rol al perfil;
- ligan `state.sourceRevision` al intent;
- limitan el incremento de intentos;
- enumeran transiciones validas;
- rechazan cualquier escritura cliente a `VERIFIED`;
- exigen revision, fingerprint y fecha para `CLIENT_CONFIRMED`;
- vinculan actores de claim, retry y cancelacion con `auth.uid`;
- reservan cancelacion a Supervisor con actor, razon y fecha;
- rechazan campos no declarados.

Los errores persistidos excluyen URL, credenciales, tokens, password, secretos,
cookies y claves privadas. `createdBy` se reduce a `uid`, `name`, `role` y
`clientId`.

## Historial del dictamen

El cierre tecnico inicial fue `DICTAMEN: NO APROBADO` por autor falsificable y
`VERIFIED` autodeclarable. Este correctivo conserva esa evidencia y corrige
ambos bloqueos sin crear commit, push ni deploy.

## Firebase Emulator

El repositorio no contiene infraestructura RTDB Emulator. Por ello, las reglas
se validaron mediante parseo JSON, inspeccion estatica y espejo ejecutable de
logica equivalente en `firebase-public-rules.test.mjs`. El espejo detecta
regresiones basicas, pero no sustituye ni demuestra la semantica completa del
motor Firebase. No se afirma una prueba Emulator.

El gate real de reglas queda pendiente para `TEST-INFRA-E2E-EMULATOR-001`.
Las reglas no fueron desplegadas en este ticket.

## Git y alcance

- Rama inicial: `main`.
- HEAD inicial: `9124fbdab9ec0ff703d10d7bbc4f869d641dee41`.
- `main`: mismo commit.
- `origin/main`: `78a51f23ae1f2b13e48667041048b9624f57d6ae`.
- Estado inicial: limpio, staging vacio.
- No se hizo commit.
- No se hizo push.
- No se hizo deploy.
- `CHARROPRO_CORE_STABILIZATION_PROGRAM.md` no fue modificado.
- CSP-M1 permanece `NO APROBADO`.
