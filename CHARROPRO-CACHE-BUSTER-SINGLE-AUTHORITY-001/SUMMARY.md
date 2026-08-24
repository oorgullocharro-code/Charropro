# CHARROPRO-CACHE-BUSTER-SINGLE-AUTHORITY-001

## Resultado

Antes, el runtime productivo contenia 295 referencias `?v=` repartidas entre 25 builds. Esto permitia que un mismo archivo fisico se evaluara con identidades ES Module diferentes.

Despues, `functions/configuration.defaults.json` es la unica autoridad canonica mediante `values.system.appVersion`. Los HTML cargan un bootstrap estable, este obtiene la configuracion con `cache: no-store` y deriva las URLs versionadas de CSS y del entrypoint. Un generador determinista aplica el mismo build a todos los imports internos.

## Build

- Anterior: `20260824-fmch-team-sheet-html-print-geometry-001-v1`
- Nuevo: `20260824-cache-buster-single-authority-001-v1`
- Autoridad: `functions/configuration.defaults.json`
- Bootstrap estable: `js/core/clientBootstrap.js` y `js/core/configurationBootstrap.js`
- Consumidores derivados: HTML, CSS, entrypoints, imports estaticos y dinamicos.

## Limites preservados

- No se modifico scoring ni logica deportiva.
- `FMCH_2026_LIBRE 0.6.0` permanece sin cambios.
- Fingerprint deportivo esperado: `rptp_0f90f7a3944a82d7`.
- No se modificaron Functions productivas ni RTDB Rules.
- Firebase Production Writes: 0.
- Hostinger deploy: no incluido.
