# FMCH 2026 Cala Test Evidence

## Automated scope

The dedicated suite verifies:

- exact catalog counts `1 / 7 / 43 / 2 / 36`;
- unique RuleID values;
- Product Base immutability;
- profile draft activation block;
- no sports-rule changes to the other suertes;
- tournament override precedence and isolation;
- Punta minimum, decimal threshold, high distance, and invalid time count;
- repeatable infraction quantity and total;
- Attempt V2 profile context and calculation detail;
- DQ preservation and draft reversibility;
- official freeze;
- legacy score non-recalculation;
- no Punta `max` attribute;
- official publication before `Guardar y siguiente` advances;
- ticket cache identity.

## Calculation cases

| Case | Input | Expected |
| --- | --- | --- |
| Base | Base only | 20 |
| Punta | 8 m / 1 time | +5 |
| High distance | 90 m / 1 time | Accepted and serialized; no artificial max |
| Additional | Base + confirmed additional | RuleID/value frozen |
| Infraction | Repeatable `-2` x2 | 4 individual bad points |
| Team infraction | `-5` reviewer rule | 5 team bad points, separate category |
| DQ | 27 good, 4 individual bad, 5 team bad | net `-4`, team-adjusted `-9` |
| DQ reversible | Remove DQ in draft | net 23, team-adjusted 18; detail retained |
| Zero | Explicit zero toggle | Distinct from DQ |
| Legacy | Existing official total 20 | Remains 20; no recalculation |

## Visual evidence

Synthetic local/emulator data only. Screenshots and viewport results are stored under `evidence/` after validation.

| Viewport | Expected | Result |
| --- | --- | --- |
| Desktop 1600 x 900 | Full scorer, footer and Punta usable; no horizontal overflow | PASS: one scorer root, 51 rule controls, footer visible, 0 px horizontal overflow |
| iPad landscape 1024 x 768 | Wide controls remain usable; vertical scroll allowed | PASS: one scorer root, 51 rule controls, footer visible, vertical scroll available, 0 px horizontal overflow |
| iPad portrait 768 x 1024 | Controls remain touchable; no horizontal overflow | PASS: one scorer root, 51 rule controls, footer visible, vertical scroll available, 0 px horizontal overflow |

Evidence files:

- `evidence/desktop-cala.png`
- `evidence/ipad-landscape-cala.png`
- `evidence/ipad-portrait-cala.png`

The real scorer was loaded from `torneo.html` against the explicit LOCAL / EMULATOR fixture. A clean browser tab produced no application warnings or errors. The responsive fixture reports `data-validation="pass"` in both iPad orientations.

## Manual control validation

- The real DOM exposes the confirmed FMCH catalog and does not expose the grouped legacy `No correr en linea recta` rule.
- A repeatable `-2` infraction was applied twice and produced 4 individual bad points and a total of 16 from base 20.
- Applying the confirmed DQ reason `Faena incompleta o negativa a ejecutarla` annulled good points but retained the 4 bad points, producing total `-4`.
- Removing the DQ and both repeated applications restored the draft to base 20 without publishing.
- The decimal Punta input exposes `step="0.01"` and no `max`; the dedicated tests verify the 51/52 cm boundary and high-distance behavior.

## Publication and protection

The complete repository suite includes official-score publication, Outbox/Recovery, public snapshot, and score-protection regressions.

| Validation | Result |
| --- | --- |
| `node --check` over repository JS/MJS sources | PASS: 156 files |
| Complete repository test suite | PASS: 59/59 test files |
| Dedicated FMCH Cala suite | PASS |
| JSON parse validation | PASS: 27 files |
| `git diff --check` | PASS |
| `git diff --cached --check` with empty staging | PASS |
| Old cache token scan | PASS: 0 matches |
| Functional/cache-only classification | PASS: 0 unexpected non-cache changes |
| Added `debugger` / `console.*` scan | PASS: none |
| Added dependency or secret scan | PASS: none |

The synthetic publication regressions cover official score, Outbox/Recovery, public snapshot, idempotency, and the destructive score guard (`remote 453 / proposed 450`). No production Firebase write, deploy, push, or profile activation occurred.
