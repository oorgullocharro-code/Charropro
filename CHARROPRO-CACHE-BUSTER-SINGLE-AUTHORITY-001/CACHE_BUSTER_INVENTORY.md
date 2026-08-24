# Cache Buster Inventory

## Metodo

Se auditaron `?v=`, `&v=`, `appVersion`, variantes de `BUILD_VERSION`, imports estaticos y dinamicos, scripts module, configuracion, fixtures, tests y documentacion. La busqueda distinguio runtime productivo de evidencia historica.

## Antes

- Referencias `?v=` de runtime: 295.
- Archivos runtime afectados: 80.
- Referencias al build productivo anterior: 153.
- Referencias stale: 142.
- Valores de build distintos: 25.

| Valor | Referencias | Clasificacion | Accion |
| --- | ---: | --- | --- |
| `20260824-fmch-team-sheet-html-print-geometry-001-v1` | 153 | Consumer previo | Derivar del build canonico |
| `20260708-recovery-001b-panel-status1` | 27 | Stale runtime | Sustituir mediante generador |
| `20260727-broadcast-live-graphics-001-live-data-geometry-v1e` | 24 | Stale runtime | Sustituir mediante generador |
| `20260727-public-portal-program-ux-001-program-phase-pm-v1` | 12 | Stale runtime | Sustituir mediante generador |
| `20260713-broadcast-output-001-output-v1` | 11 | Stale runtime | Sustituir mediante generador |
| Otros 20 builds historicos | 68 | Stale runtime | Sustituir mediante generador |

## Despues

- Imports `?v=` de runtime: 242.
- Valores efectivos de build en runtime: 1.
- Referencias runtime historicas no justificadas: 0.
- HTML productivos con build hardcodeado: 0 de 26.
- Autoridades: 1, `values.system.appVersion`.

## Clasificacion

- `AUTHORITY`: `functions/configuration.defaults.json`.
- `CONSUMER`: bootstrap, HTML, CSS, entrypoints e imports internos.
- `HISTORICAL_DOCUMENTATION`: se conserva sin sustituciones.
- `TEST_FIXTURE`: valores sinteticos de navegacion y releases se conservan cuando prueban su propio contrato.
- `INTENTIONALLY_PINNED`: el bootstrap inicial queda sin query para romper el ciclo de descubrimiento; no contiene un build paralelo.
- `STALE_RUNTIME_REFERENCE`: 0 despues del correctivo.
- `UNKNOWN`: 0.
