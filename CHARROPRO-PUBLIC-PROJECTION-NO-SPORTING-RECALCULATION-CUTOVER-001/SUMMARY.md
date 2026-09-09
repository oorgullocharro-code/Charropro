# Public Projection V3 Cutover

## Result

Public Projection now materializes the resolved canonical result view through this path:

`Official Score Authority -> Canonical Tournament Results -> Canonical Public Tournament Data V3 -> publicTournaments/{tournamentId}`

The V3 writer does not select attempts, resolve ledger heads, sum sporting values, calculate rankings, or break ties. The temporary legacy adapter consumes only V3 fields to keep the current Portal presentation operating during the transition.

## Historical Fixture

The certified historical fixture resolves the corrected Pial as `21` and the team total as `193`.

- Canonical PR: `21`
- Public V3 PR: `21`
- Legacy presentation PR: `21`
- Canonical total: `193`
- Public V3 total: `193`
- Legacy presentation total: `193`

The legacy triple-head input (`21`, `21`, `21`) cannot materialize `63` in V3 because Canonical Tournament Results resolves the authoritative record before V3 receives any public row.

## RTDB Representation

RTDB omits empty maps and arrays. V3 treats an absent optional empty section as the canonical persisted form of `branding`, `modules`, `sponsors`, and empty public collections. The content hash canonicalizes this representation, so a read-back validates identically without introducing placeholder data.

## Boundaries Preserved

- Sporting values, RuleIDs, FieldIDs, Attempt V2, Timer Authority, and rule profiles were not changed.
- Existing V2 data remains historical/read-only compatibility data; V2 is not accepted for a new V3 public write.
- No production read, write, reconciliation, test-tournament repair, deploy, or cache-buster update occurred.
