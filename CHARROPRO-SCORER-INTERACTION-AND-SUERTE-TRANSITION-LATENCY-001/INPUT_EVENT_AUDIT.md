# Input Event Audit

The scorer retains the existing delegated click authority for logical actions. One delegated passive `pointerdown` listener now adds immediate, temporary tactile feedback to recognized scorer controls.

There is no parallel touchstart/touchend action path and no duplicated logical execution. The pointer listener is visual only.

Duplicate protection is semantic:

- Toggle and absolute-selection actions with the same identity are rejected inside 320 ms.
- Different controls remain independently actionable.
- Repeatable quantity adjustments are not suppressed.
- The browser stress test confirmed that a second immediate tap did not reverse the first logical result.

`touch-action: manipulation` is scoped to scorer controls and does not disable global scrolling or zooming.
