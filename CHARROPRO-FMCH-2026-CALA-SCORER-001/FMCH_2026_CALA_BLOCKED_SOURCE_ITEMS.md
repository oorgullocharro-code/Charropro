# FMCH 2026 Cala Blocked Source Items

## Status

`COMPLETE_WITH_BLOCKED_FIELDS`

## Unresolved items

| Item | Confirmed fact | Missing source | Current action | Calculation | UI | Certification | Activation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ML/CR` vs `MD/MI/PC` | The scorer uses `ML` and `CR`; the audited form exposes `MD`, `MI`, and `PC` | Exact one-to-one or aggregate equivalence | `BLOCKED`; preserve sports RuleID without claiming export equivalence | Not blocked | Not blocked | Blocked | Blocked |
| `FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL` | The printed control exists | Certified aggregation semantics | `FIELDID_MAPPING_BLOCKED` | Not blocked | Not blocked | Blocked | Blocked |
| `FMCH.TEAM_SHEET.CALA.PC` | The prior ledger relates current `CR` to `PC` ambiguously | Approved meaning and transformation | `FIELDID_MAPPING_BLOCKED`; do not infer `PC = cambio de rectangulo` | Not blocked | Not blocked | Blocked | Blocked |

## Safety decision

The confirmed base, Punta, additional, individual infraction, team infraction, and DQ rules are implemented. The unresolved items are isolated to exact official-document mapping. No provisional alias, FieldID, score value, or production activation was introduced.

## Required resolution

An approved FMCH source or recorded sports-commission decision must define the printed relationships. After that decision, a separate exporter/profile activation ticket can add the mapping, update certification evidence, and activate an approved profile version.
