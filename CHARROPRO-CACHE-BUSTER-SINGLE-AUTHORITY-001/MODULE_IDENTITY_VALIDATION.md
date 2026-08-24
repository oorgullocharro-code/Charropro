# Module Identity Validation

La prueba `tests/module-build-identity.test.mjs` recorre todos los imports ES Module estaticos y dinamicos bajo `js/`.

Valida que:

- cada archivo fisico tenga una sola URL efectiva;
- todos los imports de aplicacion usen `20260824-cache-buster-single-authority-001-v1`;
- `configurationBootstrap.js` sea el unico import estable sin query;
- no existan mezclas OLD/NEW;
- `state.js`, `version.js`, `firebaseSync.js` y `ruleProfiles.js` participen en el grafo unico.

Resultado: `MODULE_IDENTITY_SINGLE_BUILD: PASS`.
