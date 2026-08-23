# Current Exporters Analysis

> Reconciliacion posterior: esta tabla fue actualizada al cierre documental. Las
> referencias deportivas historicas no prevalecen sobre la certificacion final
> de `FMCH_2026_LIBRE 0.6.0`.

| Consumer | Classification | Result |
| --- | --- | --- |
| js/core/officialFormat.js | CERTIFIED DOCUMENT PROJECTION | consumes immutable Official Format Snapshot; preserves 3x3 plus one blank administrative row; emits deterministic XLSX with embedded assets |
| js/views/formato-federacion.js | CERTIFIED DOCUMENT VIEW | prints the same immutable package and authorized institutional assets |
| google-apps-script/formato-federacion.gs | PARTIAL | writes visual rows/merges without fieldId contract |
| js/core/sync.js formatoFederacion | DERIVED | transports current generated package |
| js/core/exporters.js | CURRENT generic / not FMCH | backup and generic exports only |

The current implementation includes an immutable document snapshot, field-level
golden assertions, deterministic XLSX SHA and real XLSX-to-PDF visual
verification. `downloadOfficialFormatCsv` remains an XLSX compatibility alias;
the Google Apps Script path remains outside this certified browser export.
