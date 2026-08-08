# FMCH 2026 Cala Scorer Implementation

## Scope

This ticket reconciles the existing Cala scorer with the approved FMCH 2026 specification. It does not replace the scorer, create a new scoring engine, activate the FMCH profile in production, migrate historical scores, or redesign the Federation exporter.

## Architecture

The implementation keeps the approved resolution path:

`PRODUCT_BASE -> RULE_PROFILE -> TOURNAMENT_OVERRIDE`

- `js/data/calaRules.js` preserves the Product Base catalog and provides the confirmed FMCH 2026 Cala catalog.
- `js/data/ruleProfiles.js` loads only Cala into `FMCH_2026_LIBRE` version `0.2.0`.
- `js/app.js` renders the resolved catalog and reuses the existing handlers, manual adjustments, evidence, note, footer, and official publication flow.
- `js/core/scoringAttempt.js` adapts the draft to Attempt V2 and freezes resolved identities, quantities, values, profile context, Punta inputs, DQ, evidence, and note.
- `js/core/scoring.js` remains the shared calculation boundary.

No `CalaEngine`, store, route, Firebase namespace, publication path, or dedicated feed was created.

## Effective FMCH Cala catalog

| Group | Count | Resolution |
| --- | ---: | --- |
| Base | 1 | Confirmed, 20 points exactly once |
| Additionals | 7 | Confirmed |
| Individual infractions | 43 | Confirmed; repeatable rules retain quantity |
| Team infractions | 2 | Confirmed and separate from individual infractions |
| Disqualifications | 36 | Confirmed and identified by stable RuleID |

Three legacy identities remain physically available for historical compatibility but are disabled in the effective FMCH profile.

## Behavior preserved

- Specialized Punta calculator and quick controls.
- Manual additional and manual infringement.
- `timeEvidence` and judge note.
- `Marcar 0` as a state distinct from disqualification.
- Team penalties as a separate category.
- Footer connection state, `Ajustar botonera`, `Deshacer`, `Marcar 0`, and `Guardar y siguiente`.
- Atomic official publication before navigation.
- Existing official score, audit, snapshot, live feed, exporter, and history paths.
- Legacy score values without retrospective recalculation.

## Corrections

- Punta accepts decimal meters and applies the approved threshold: fractional centimeters greater than 51 round to the next meter.
- No arbitrary maximum distance is added.
- Repeatable infractions persist `quantity`, unit value, and resolved total.
- DQ uses the approved shared contract: good points are annulled while individual and team bad points remain.
- DQ can be removed in draft without losing selections, infractions, evidence, or note.
- DQ selections persist `descRuleId` and still read legacy labels.

## Profile status

- Profile: `FMCH_2026_LIBRE`
- Version: `0.2.0`
- Status: `draft`
- Cala status: `COMPLETE_WITH_BLOCKED_FIELDS`
- Activation ready: `false`

The profile is available only through explicit local/fixture context for this validation. Canonical production selection rejects it because it is not active.

## Certification boundary

The sports calculation and operational UI are implemented from confirmed rules. Exact exporter equivalence for `ML/CR` against `MD/MI/PC` remains unresolved. The system therefore does not claim full sporting certification and does not activate the profile in production.

## Expected closure

- Technical implementation: `PASS` when automated and visual validation complete.
- Sporting certification: `BLOCKED` by the documented FieldID equivalences.
- Profile activation ready: `NO`.
