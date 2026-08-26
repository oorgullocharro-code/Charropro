# Operator Context UI

The phone control displays one prominent current Timer with:

- charreada;
- suerte and certified phase;
- team or participant;
- opportunity;
- temporal rule and regulatory duration;
- textual state;
- live visible time.

The context is sourced from Flow/scorer state and official Timer metadata, not
from selected tabs or visible labels. When a shared Terna Timer moves from
Cabecero to Pial, contextual metadata changes while elapsed time, anchor,
revision and Timer identity remain intact.

The layout is phone-first, uses status text in addition to color, and preserves
the existing dominant circular control. Local browser validation found no
horizontal overflow or console errors.

A context change never silently resets a running or paused Timer and never
starts a newly prepared Timer automatically.
