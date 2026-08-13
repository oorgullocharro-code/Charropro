# Manganas Layout Contract

## Wide layout

For Manganas a Pie and Manganas a Caballo on desktop or iPad landscape:

- Left: active attempt, floreo, tirones, result, remates and optional detail.
- Right: vertical `Historial de intentos` for attempts 1, 2 and 3.
- The right history has a stable width and never becomes a second score-entry workflow.

## Attempt V2 projection

The history is a presentation-only projection of the existing attempt record:

| Visual state | Source |
| --- | --- |
| `ACTIVO` | Existing active attempt index |
| `COMPLETADO` | Existing attempt result visible under the scorer rules |
| `PENDIENTE` | Attempt without a visible result |
| Detail | Existing disqualification, remate label, or calculated Attempt V2 total |

No `manganasHistory` state, duplicated score value, or independent persistence was introduced. Selecting an existing attempt still uses the existing navigation action.

Color semantics remain explicit: blue for the active attempt, green for a completed positive result, red for the negative result action, amber for pending attempts, and neutral gray only for inactive controls.

## Validated state transitions

- State A: attempt 1 active, attempts 2 and 3 pending.
- State B: after selecting the existing `Lograda` result on attempt 1 and selecting attempt 2, history shows attempt 1 completed, attempt 2 active and attempt 3 pending.

The state transition used only local emulator fixture data and was not published as an official score.

## Narrow layout

At narrow/portrait breakpoints the panel becomes one column, placing history after the active operation. This keeps controls reachable and prevents horizontal scrolling.
