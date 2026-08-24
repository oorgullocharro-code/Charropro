# Files Changed

## Autoridad y bootstrap

- `functions/configuration.defaults.json`
- `js/core/clientBootstrap.js`
- `js/core/configurationBootstrap.js` no cambia; se reutiliza como bootstrap validado.
- `js/core/version.js`
- `tools/release/applyClientBuildVersion.mjs`

## Consumidores

- 26 HTML productivos: politica uniforme de bootstrap y CSS derivado.
- Modulos bajo `js/`: solo imports/versiones y constantes de build derivadas.
- `fixtures/templateEngineFixtures.js` y fixtures runtime de Broadcast: imports uniformes.
- Tests: imports uniformes y expectativas adaptadas al contrato de autoridad.

## Pruebas nuevas

- `tests/cache-buster-single-authority.test.mjs`
- `tests/module-build-identity.test.mjs`
- `tests/html-entrypoint-build-consistency.test.mjs`
- `tests/configuration-build-integrity.test.mjs`

## Documentacion

- Los 10 documentos de esta carpeta.

El manifiesto exacto y definitivo es `git diff --cached --name-status` previo al commit. No se incluyen cambios de scoring, Rules, Functions productivas, dependencias ni datos.
