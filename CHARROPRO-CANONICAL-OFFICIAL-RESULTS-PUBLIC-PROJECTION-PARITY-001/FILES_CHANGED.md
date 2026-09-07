# Files Changed

## Autoridad y consumidores

- `js/core/canonicalOfficialResults.js`: contrato derivado de resultado oficial vigente e identidad deportiva.
- `functions/officialScoreConcurrency.js`: ledger por identidad deportiva y fusión puntual de la colección operativa.
- `js/core/state.js`: revisiones locales por identidad deportiva y registro de ledgers por torneo.
- `js/core/firebaseSync.js`: hidratación privada del ledger existente.
- `js/app.js`: sábana, resultados y ranking internos consumen totales canónicos; corrección temporal de Terna conserva el participante.
- `js/core/officialFormatSnapshot.js`: Formato Federación selecciona resultados canónicos.
- `js/public/publicProjection.js`: proyección y ranking parten de resultados canónicos.

## Pruebas

- `tests/canonical-official-results.test.mjs`.
- `tests/canonical-official-score-write.test.mjs`.
- `tests/canonical-official-score-emulator.test.mjs`.

## Release

- `functions/configuration.defaults.json`: build y checksum canónicos.
- Imports bajo `js/`, `fixtures/` y `tests/`: cambio mecánico de `?v=` aplicado por `tools/release/applyClientBuildVersion.mjs`.
- Expectativas explícitas de build en pruebas de cache, navegación, scorer y Broadcast.

## Exclusiones verificadas

- `firebase-rules-auditoria.json`: sin cambios.
- `firebase.json`: sin cambios.
- `storage.rules`: sin cambios.
- Sin dependencias nuevas ni migración productiva.

El manifiesto definitivo es `git diff --cached --name-status` del commit del ticket.
