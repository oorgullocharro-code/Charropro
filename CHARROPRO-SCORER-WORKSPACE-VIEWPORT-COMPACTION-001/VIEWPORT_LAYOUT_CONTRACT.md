# Viewport Layout Contract

## Three zones

The scorer is organized as:

| Zone | Responsibility | Requirement |
| --- | --- | --- |
| A - Header | Live context, team cards, score/timer strip, suerte navigation | Compact by spacing; retain all approved information |
| B - Workspace | Active scoring controls and internal scrollable content | Dominant vertical area |
| C - Footer | Pending, undo, save and next actions | Always visible with safe touch targets |

Zone A is never proportionally enlarged merely because a display is taller. Zone B receives the recovered space. Zone C is not compacted aggressively.

## Real local emulator measurement

Measured in the real local scorer client at `window.innerHeight = 1025` after loading the synthetic local tournament:

| Measure | Before | After |
| --- | ---: | ---: |
| Header height | 246 px | 228 px |
| Header ratio | 24.0% | 22.2% |
| Workspace height | 706 px | 724 px |
| Workspace ratio | 68.9% | 70.6% |
| Footer height | 73 px | 73 px |
| Save action height | 56 px | 56 px |
| Horizontal overflow | 0 px | 0 px |

The 18 px recovered from the header is assigned to the workspace. The footer and primary save target remain unchanged.

## Responsive behavior

- Desktop and iPad landscape: compact header, workspace dominance, one-row manual capture, two-column Manganas composition.
- Portrait and mobile: score workspace remains readable, manual capture stacks intentionally, Manganas history moves below the active operation, and horizontal overflow remains zero.

## Non-goals

This contract does not redefine sports flow, scoring, attempt lifecycle, timer ownership or finalization behavior.
