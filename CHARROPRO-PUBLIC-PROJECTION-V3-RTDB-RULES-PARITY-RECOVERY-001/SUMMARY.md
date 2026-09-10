# Public Projection V3 RTDB Rules Parity Recovery

## Scope

This change aligns only the RTDB validation shape for `charropro/publicTournaments/{tournamentId}` with Canonical Public Tournament Data V3. It does not change public readers, authorized writers, Functions, client code, sporting data, or any Production data.

## Root Cause

The V3 producer generated a valid, complete public snapshot, but the legacy RTDB allowlists rejected valid V3 context fields in `program`, `results`, `standings`, `sheet`, and `timeline`. The first demonstrated rejection was `program.items.{id}.competitionName`.

## Resolution

- `program` accepts the exact V3 public schedule, context, and roster-name fields.
- `results`, `standings`, `sheet`, and `timeline` accept their exact V3 public context fields and resolved values.
- Legacy V2 `results.items` and `results.scopes` remain explicitly denied.
- Unknown, private, malformed, unauthenticated, and schema V2 writes remain denied.

## Recovery Boundary

No Dead Letter job, public snapshot, score, or tournament was changed. A later, explicitly authorized operation is required to retry only the three existing V3 Dead Letter jobs for `torneo_mtut0u78_ojpwf6`.
