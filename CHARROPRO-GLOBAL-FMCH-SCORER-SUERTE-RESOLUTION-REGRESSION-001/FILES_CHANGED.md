# Files Changed

## Logica

- `js/core/state.js`: contexto estricto, cache no provisional y firma de autoridad completa.
- `js/data/competitionTypes.js`: normalizacion central de aliases por equipos y validacion sin fallback silencioso.

## Configuracion y build

- `functions/configuration.defaults.json`: build canonico y checksum.
- Referencias `?v=` propagadas por `tools/release/applyClientBuildVersion.mjs` en el grafo cliente y sus pruebas.

## Pruebas

- Cinco regresiones nuevas exigidas por el ticket.
- Fixture de cache de latencia actualizado para usar una asignacion FMCH real.
- Aserciones literales de build alineadas con la autoridad canonica.

## Documentacion

- Once documentos en esta carpeta.

No se modificaron Functions de negocio, Firebase Rules, valores deportivos ni dependencias.
