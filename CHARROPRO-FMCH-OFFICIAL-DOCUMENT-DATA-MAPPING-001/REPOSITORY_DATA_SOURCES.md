# Repository Data Sources

| Domain | Current canonical or authoritative source | Derived/secondary source | Audit finding |
| --- | --- | --- | --- |
| Event identity | tournament info and charreada records | compact published score snapshot | name/time/team/venue snapshot exists for official attempts |
| Team identity | team record | compact team snapshot | captain/roster omitted from published snapshot |
| Current score | tournament scores/{scoreId} | UI state | mutable operational source |
| Official attempt | officialScoreLedger active record | publishedScores | server transaction authority per attempt |
| Audit | officialScoreAudit and audit/publishedScores | diagnostics | actor/revision/device preserved, no signature |
| Totals | js/core/scoring.js | officialFormat output | derived from current collections, not document revision |
| Rule labels | suertes/calaRules static configuration | exporter token matching | no approved FMCH field relation |
| Federation package | buildOfficialPackage() | Google Sheets/print/live payload | present-state export only |

Sources examined include state, scoring, rule catalogs, app publication snapshot, Firebase adapter, callable transaction, rules, format view, Google Sheets, live sync, history, generic exporters and concurrency tests.
