# Resultados de pruebas

## Checks

Pasaron:

- `node --check js/app.js`
- `node --check js/core/firebaseSync.js`
- `node --check js/core/publicProjectionOutbox.js`
- `node --check js/core/version.js`
- `node --check js/tournamentApp.js`
- `node --check tests/firebase-public-rules.test.mjs`
- `node --check tests/production-nav.test.mjs`
- `node --check tests/public-live-feed-integration.test.mjs`
- `node --check tests/public-projection-outbox.test.mjs`
- parseo JSON de `firebase-rules-auditoria.json`
- `git diff --check`

Las busquedas finales no encontraron:

- marcadores de conflicto;
- `debugger`;
- nuevos `console.log` o `console.debug`;
- credenciales o secretos reales agregados por el ticket.

La unica coincidencia de patron `password`/`token` es un valor sintetico dentro
de `tests/public-projection-outbox.test.mjs`, usado para comprobar que el
sanitizador elimina esas cadenas. No es una credencial funcional.

## Pruebas nuevas y ampliadas

- `tests/public-projection-outbox.test.mjs`: identidad, estados, lease, retry,
  backoff, dead-letter, supersesion, sanitizacion, no mutacion y observabilidad.
- `tests/public-live-feed-integration.test.mjs`: falla publica posterior al
  exito privado, persistencia, reinicio, recovery, idempotencia, timeout
  posterior al commit publico, revision nueva, dead-letter, identidad ligada a
  autenticacion y confirmacion cliente sin elevar a `VERIFIED`.
- `tests/firebase-public-rules.test.mjs`: esquema, roles, acceso por torneo,
  intent immutable, actores ligados a `auth.uid`, rechazo de autores y cierres
  falsificados, transiciones, `CLIENT_CONFIRMED` y campos permitidos.

Casos negativos confirmados:

- autor falsificado y mutacion posterior de autor;
- `VERIFIED` directo por creador o administrador cliente;
- `VERIFIED` con revision, fingerprint y fecha aportados por el cliente;
- `PENDING`, `PROCESSING`, `RETRY_WAIT` y `DEAD_LETTER` a `VERIFIED`;
- actor falsificado de retry y cancelacion;
- campos de identidad mutados;
- `verifiedAt` prematuro;
- usuario sin rol autorizado;
- reescritura de un estado `VERIFIED` sin autoridad `trusted-server`.

## Regresion completa

Se ejecutaron 45 suites; 45 pasaron y 0 fallaron:

1. `announcer-monitor.test.mjs`
2. `broadcast-access-hub.test.mjs`
3. `broadcast-action-engine.test.mjs`
4. `broadcast-asset-manager.test.mjs`
5. `broadcast-component-library.test.mjs`
6. `broadcast-component-renderer.test.mjs`
7. `broadcast-data-contract.test.mjs`
8. `broadcast-output-routing.test.mjs`
9. `broadcast-output.test.mjs`
10. `broadcast-playground.test.mjs`
11. `broadcast-preview-engine.test.mjs`
12. `broadcast-program-engine.test.mjs`
13. `broadcast-program-projection.test.mjs`
14. `broadcast-realtime-transport.test.mjs`
15. `broadcast-state.test.mjs`
16. `broadcast-studio-workspace.test.mjs`
17. `broadcast-template-engine.test.mjs`
18. `broadcast-theme-engine.test.mjs`
19. `browser-output.test.mjs`
20. `cala-rules.test.mjs`
21. `firebase-broadcast-rules.test.mjs`
22. `firebase-public-rules.test.mjs`
23. `live-bindings.test.mjs`
24. `output-synchronization.test.mjs`
25. `production-console.test.mjs`
26. `production-nav.test.mjs`
27. `production-variables.test.mjs`
28. `program-main-output.test.mjs`
29. `public-foundation-integration.test.mjs`
30. `public-live-feed-integration.test.mjs`
31. `public-live-feed-templates.test.mjs`
32. `public-live-feed.test.mjs`
33. `public-portal-client.test.mjs`
34. `public-portal-core.test.mjs`
35. `public-portal-design-system-v2.test.mjs`
36. `public-portal-router.test.mjs`
37. `public-portal-selectors.test.mjs`
38. `public-portal-ux.test.mjs`
39. `public-projection-outbox.test.mjs`
40. `public-projection.test.mjs`
41. `supervisor-navigation.test.mjs`
42. `team-penalties-zero.test.mjs`
43. `template-renderer-integration.test.mjs`
44. `theme-template-integration.test.mjs`
45. `tournament-context.test.mjs`

## Limite de validacion

No se ejecuto Firebase Emulator porque no existe configuracion Emulator en el
repositorio. No se usaron Firebase ni datos de produccion. La integracion se
probo con el adapter falso existente y fallas controladas. La validacion
estatica y su espejo ejecutable no sustituyen una prueba real de Realtime
Database Rules; ese riesgo queda abierto para
`TEST-INFRA-E2E-EMULATOR-001`.

## Historial de cierre

El correctivo reserva `VERIFIED` para autoridad servidor futura. El cliente
termina en `CLIENT_CONFIRMED` despues de una lectura de vuelta coincidente y el
diagnostico manual permanece de solo lectura. Ninguna prueba utiliza payloads
del cliente como prueba autoritativa.
