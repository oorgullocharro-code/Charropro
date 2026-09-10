# Validation

## Emulator

`firebase-public-projection-v3-rules-parity-emulator.test.mjs` passed against an isolated `demo-charropro-local` Auth and RTDB Emulator.

The exact diagnosed tournament identity was used only inside the isolated Emulator. The candidate contains lifecycle `LIVE`, one full program item, three results, nine standings, one sheet, and three timeline events.

| Case | Result |
| --- | --- |
| Full V3 candidate | PASS |
| V2 new write | DENIED |
| Private fields | DENIED |
| Unauthenticated writer | DENIED |
| Malformed program | DENIED |
| Malformed results | DENIED |
| Malformed standings | DENIED |
| Malformed sheet | DENIED |
| Malformed timeline | DENIED |
| Existing ranking Rules regression | PASS |
| Projection Outbox Rules regression | PASS |

## Directed Regression

- Canonical Public Tournament Data contract: PASS.
- Public Projection V3 and Functions parity: PASS.
- Public Projection Outbox: PASS.
- Canonical Public Timeline Event Producer: PASS.
- Portal V2 foundation, Timeline, Results/Standings/Sheet, and navigation/context: PASS.
- Release/cache coherence: PASS.
- `node --check` for the added test: PASS.
- Rules JSON parse: PASS.
- `git diff --check`: PASS.

No Production reads or writes were required for these validations.
