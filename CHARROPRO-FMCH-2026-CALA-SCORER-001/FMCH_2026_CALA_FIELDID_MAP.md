# FMCH 2026 Cala FieldID Map

## Principle

This ticket preserves the existing 239-FieldID ledger. It does not create, rename, migrate, or reinterpret official FieldID. Attempt V2 freezes sports inputs and resolved values; the Federation exporter remains responsible for the later document transformation.

## Cala fields

| FieldID | Current source | Status in this ticket | Notes |
| --- | --- | --- | --- |
| `FMCH.TEAM_SHEET.CALA.PARTICIPANT_NAME` | Cala roster / participant context | Preserved | Roster persistence gap remains outside this ticket |
| `FMCH.TEAM_SHEET.CALA.SUBSTITUTE_NAME` | Substitute roster | Preserved | Existing partial mapping |
| `FMCH.TEAM_SHEET.CALA.METERS` | `attempt.puntaMetros` | Preserved and frozen | Decimal input retained |
| `FMCH.TEAM_SHEET.CALA.TIMES` | `attempt.puntaPiquetes` | Preserved and frozen | Maximum four valid scoring times remains in calculator |
| `FMCH.TEAM_SHEET.CALA.BASE` | `attempt.base` | Confirmed | Base 20 stored once |
| `FMCH.TEAM_SHEET.CALA.P` | Punta breakdown / applied rules | Preserved | Exact printed semantics remain exporter-owned |
| `FMCH.TEAM_SHEET.CALA.T` | Punta breakdown / applied rules | Preserved | Exact printed semantics remain exporter-owned |
| `FMCH.TEAM_SHEET.CALA.LD` | Cala additional selections | Partially mappable | No new alias invented |
| `FMCH.TEAM_SHEET.CALA.LI` | Cala additional selections | Partially mappable | No new alias invented |
| `FMCH.TEAM_SHEET.CALA.MD` | Cala additional selections | `FIELDID_MAPPING_BLOCKED` | Current UI grouping does not certify equivalence |
| `FMCH.TEAM_SHEET.CALA.MI` | Cala additional selections | `FIELDID_MAPPING_BLOCKED` | Current UI grouping does not certify equivalence |
| `FMCH.TEAM_SHEET.CALA.PC` | Current `CR` group | `FIELDID_MAPPING_BLOCKED` | It is forbidden to infer the printed meaning |
| `FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL` | No certified source | `FIELDID_MAPPING_BLOCKED` | Requires sports/source confirmation |
| `FMCH.TEAM_SHEET.CALA.BAD_POINT_01..08` | Attempt infractions and manual infractions | Preserved, transformation required | 43 possible RuleID values cannot be assigned statically to eight slots |
| `FMCH.TEAM_SHEET.CALA.BAD_POINTS_TOTAL` | `attempt.infr` / Attempt V2 bad points | Preserved | Individual bad points only |
| `FMCH.TEAM_SHEET.CALA.PARTIAL_POINTS` | Attempt total | Preserved | Uses frozen official result |
| `FMCH.TEAM_SHEET.CALA.TEAM_INFRACTION` | `teamInfractions` / `teamPenalties` | Preserved | Kept separate from individual infractions |
| `FMCH.TEAM_SHEET.CALA.TOTAL` | Frozen official total | Preserved | DQ retains negative individual bad points under approved contract |

## Blocked equivalence

| Concept | Source | Relationship | Current implementation | Confirmed | Blocks calculation | Blocks UI | Blocks activation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ML/CR` vs `MD/MI/PC` | Approved unresolved-source ledger | Unknown exact export equivalence | Sports RuleID and values are captured; exporter mapping is not asserted | No | No | No | Yes |
| Side bad-points control | `FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL` | Unknown printed aggregation | No invented transformation | No | No | No | Yes |
| `PC` | `FMCH.TEAM_SHEET.CALA.PC` | Current audit only says `CR` is related | No claim that `PC` means cambio de rectangulo | No | No | No | Yes |

## Result

FieldID are preserved. The scorer can calculate and publish a frozen official score, but the profile cannot be certified or activated until the exact document equivalences are resolved by an approved source.
