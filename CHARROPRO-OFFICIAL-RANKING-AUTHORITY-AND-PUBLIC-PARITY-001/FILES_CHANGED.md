# Archivos modificados

## Funcionales

- `js/core/officialRanking.js`: autoridad compartida, scopes y comparador.
- `js/public/publicProjection.js`: materializa rankings oficiales.
- `js/public/publicProjectionSchema.js`: contrato estricto del ranking.
- `js/public/publicProjectionLegacyAdapter.js`: paridad legacy.
- `js/publicPortal/portalSelectors.js`: consume ranking oficial e invalida vistas.
- `js/core/sync.js`: outputs derivados solo de Official Score.
- `js/core/scoring.js`, `js/app.js`: reutilizan el comparador existente compartido.
- `firebase-rules-auditoria.json`: valida `ready/empty` y campos permitidos.

## Pruebas y fixture

- `tests/official-ranking-authority-public-parity.test.mjs`.
- `tests/firebase-public-ranking-rules-emulator.test.mjs`.
- pruebas existentes de Rules/proyeccion y fixture visual del Portal.

## Build

`functions/configuration.defaults.json` contiene el build
`20260831-official-ranking-authority-public-parity-compatibility-001-v1` y
checksum derivado. El correctivo agrega cambios funcionales acotados en
`publicProjectionSchema`, `publicPortalClient`, `portalSelectors` y
`portalRender`, mas su prueba dirigida.
Los cambios restantes son propagacion mecanica por
`tools/release/applyClientBuildVersion.mjs`; la segunda ejecucion cambio 0 archivos.
