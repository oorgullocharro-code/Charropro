# Canonical Tournament Results Builder

`buildCanonicalTournamentResults()` consumes only `Canonical Official Results` (or raw sources solely to invoke that existing authority) and materializes stable team/charreada results, sheet rows, standings, and provenance. It does not select official attempts, read a ledger directly, calculate sport rules, or write Firebase.

The canonical team total is derived once from the resolved official records. Sheet rows reuse its per-suerte totals and total. Standings reuse the certified `buildOfficialRankingItems()` comparator over those same result totals.

`adaptCanonicalTournamentResultsToPublicV3()` is a pure, sanitized adapter. It exposes resolved totals and columns only, never raw ledger records, Attempt V2, actor information, audit records, or idempotency metadata. This ticket does not connect the builder to `publicTournaments` or alter the existing Portal projection.

## Authority Map

| Need | Authority | Classification |
| --- | --- | --- |
| Official records and correction/head selection | `canonicalOfficialResults.js` | REUSE |
| Team total and charreada adjustment | `getCanonicalOfficialTeamTotals()` | COMPOSE |
| Standing comparator and tie break | `officialRanking.js` | REUSE |
| Federation Sheet source | `officialFormatSnapshot.js` | REUSE / parity regression |
| Public V3 materialization | `canonicalPublicTournamentData.js` | ADAPT |
| Legacy public projection | `publicProjection.js` | LEGACY, unchanged |

The builder treats an absent suerte as unscored and a resolved numeric zero as an official result. Its deterministic `sourceHash` excludes `generatedAt`; consumers can therefore establish that results, sheet, standings, and provenance represent the same resolved source revision.
