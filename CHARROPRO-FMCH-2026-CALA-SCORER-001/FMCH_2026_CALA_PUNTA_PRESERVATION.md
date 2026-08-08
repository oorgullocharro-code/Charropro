# FMCH 2026 Cala Punta Preservation

## Existing pipeline

| Stage | Contract |
| --- | --- |
| Input | Existing specialized Punta controls plus decimal meter input |
| Normalization | Finite non-negative meters; integer scoring times with default 1 |
| Calculation | Existing Punta helper, extended only for the approved centimeter threshold |
| Result | `metros`, `metrosCalificados`, `centimetros`, `tiempos`, distance points, time points, total |
| Attempt | Existing draft fields plus effective meters and centimeters |
| Persistence | Existing attempt persistence; no Cala route created |
| Official score | Attempt V2 freezes relevant Punta input and calculated detail |
| FieldID | Existing `METERS`, `TIMES`, `P`, and `T` relations are preserved |
| Export | Existing exporter consumes the frozen score; no form redesign |

## Formula

- Minimum scored distance: 6 m.
- Distance points: one point for each full meter from the seventh meter.
- Fractional centimeters round to the next meter only when they exceed 51 cm.
- Time points: `+3`, `+2`, `+1` for one, two, or three times.
- Four times receive no time bonus; more than four times produce no valid Punta score under the existing calculator contract.
- No arbitrary maximum distance exists.

Examples:

| Input | Effective meters | Total |
| --- | ---: | ---: |
| 5 m, 1 time | 5 | 0 |
| 5.99 m, 1 time | 6 | 3 |
| 8 m, 1 time | 8 | 5 |
| 8.51 m, 1 time | 8 | 5 |
| 8.52 m, 1 time | 9 | 6 |
| 90 m, 1 time | 90 | 87 |
| 8 m, 5 times | 8 | 0 |

## Preservation evidence

- The existing `calculatePuntaBreakdown()` boundary remains the only Punta calculator.
- `ruleProfiles.js` describes the calculator but does not copy its formula.
- No manual point field, duplicate table, or second scoring source was created.
- Quick controls remain available.
- The meter input has no `max` attribute.
- Attempt V2 freezes raw and effective measurements so later profile changes cannot recalculate an official score.
