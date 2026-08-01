# Current Modules Inventory

| File | Responsibility | Vigency / evidence |
| --- | --- | --- |
| js/core/state.js | Current state, attempts, teams, charreadas, publishedScores | CURRENT; attempt shape and local state |
| js/core/scoring.js | Current attempt/suerte/charreada totals | CURRENT; not certified as FMCH sheet formula |
| js/data/suertes.js; js/data/calaRules.js | Rule/static catalog and Cala grouping | STATIC_CONFIGURATION; PC/CR ambiguity |
| js/app.js | Capture, roster, compact published score | CURRENT; roster/captain omitted from compact team |
| js/core/firebaseSync.js | Client callable/retry/reconciliation | CURRENT official publication adapter |
| functions/officialScoreConcurrency.js | Ledger, active/historical record, audit/idempotency | CURRENT server authority |
| functions/index.js | Callable transaction host | CURRENT server authority |
| firebase-rules-auditoria.json | Client restrictions for ledger/audit/published paths | CURRENT; tested |
| js/core/officialFormat.js | Federation-like XLSX/visual layout | PARTIAL; current-state export |
| js/views/formato-federacion.js | Screen/print presentation | PARTIAL; no historical revision |
| google-apps-script/formato-federacion.gs | Sheets writer | PARTIAL; visual row transfer |
| js/core/sync.js | Live package transport | DERIVED; not document authority |
| js/core/history.js | Aggregate statistics history | DERIVED; not raw document detail |
| js/core/exporters.js | Generic export/backup | CURRENT generic; not FMCH form |
| tests/official-score-concurrency.test.mjs | Ledger/rules verification | CURRENT evidence; no FMCH golden tests |

The official-score transaction and the current Federation exporter are separate authority levels.
