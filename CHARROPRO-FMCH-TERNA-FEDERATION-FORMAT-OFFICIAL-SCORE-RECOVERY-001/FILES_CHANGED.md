# Files Changed

## Correctivo funcional

- `js/core/officialFormatSnapshot.js`: resuelve la identidad agrupada de Terna
  en la validación de suertes requeridas.
- `tests/fmch-terna-federation-official-score-recovery.test.mjs`: cobertura real
  Scorer -> Attempt V2 -> Official Score -> Team Total -> Formato Federación ->
  resultados.

## Publicación

- `functions/configuration.defaults.json`: nueva identidad de build y checksum.
- Imports relativos bajo `js/`, `fixtures/` y `tests/`: propagación mecánica por
  `tools/release/applyClientBuildVersion.mjs`.
- Documentación de esta carpeta: evidencia y rollback del ticket.

## Fuera de alcance

No se modifican Rules, Functions runtime, Timer, lifecycle, sporting values,
RuleIDs, FieldIDs ni la definición de `FMCH_2026_LIBRE 0.6.1`.
