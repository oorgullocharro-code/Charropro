# Current Exporters Analysis

| Consumer | Classification | Result |
| --- | --- | --- |
| js/core/officialFormat.js | PARTIAL / UNSAFE for historical official use | uses current state; no ledger-record selection; three Coleadero rows; custom controls/dynamic Cala grid |
| js/views/formato-federacion.js | PARTIAL | prints the same generated current package |
| google-apps-script/formato-federacion.gs | PARTIAL | writes visual rows/merges without fieldId contract |
| js/core/sync.js formatoFederacion | DERIVED | transports current generated package |
| js/core/exporters.js | CURRENT generic / not FMCH | backup and generic exports only |

No official PDF generator, field-level golden file, print fidelity test, immutable document snapshot or document revision selector was found. downloadOfficialFormatCsv is an XLSX alias.
