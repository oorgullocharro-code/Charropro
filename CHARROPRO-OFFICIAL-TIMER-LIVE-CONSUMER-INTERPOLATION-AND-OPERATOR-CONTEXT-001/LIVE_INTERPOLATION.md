# Live Interpolation

`js/core/officialTimerLiveDisplay.js` is the single derivation authority for
visible Timer values.

For `RUNNING`, it combines the official accumulated base with elapsed local wall
time since the official anchor. For `READY`, `PAUSED`, `FINISHED`, `STALE` and
`OFFLINE`, it uses the corresponding frozen or diagnostic representation.
Count-up and count-down modes use the same derived elapsed value.

The derivation is pure and deterministic for a given snapshot and `now`. A new
official snapshot always reconciles the local display, including pause, resume
and finish. Snapshot ordering rejects stale revisions and incompatible context
identities.

A shared 100 ms cadence ticker starts only while there are subscribers and is
released when the last subscriber leaves. It does not own sporting time, create
Firebase listeners or perform Firebase writes.

Synthetic drift coverage validates 10, 30, 60 and 300 seconds and official
reconciliation. Per-tick full-page rendering is not used.
