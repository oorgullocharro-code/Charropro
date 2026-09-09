# Files Changed

## Portal V2

- `js/portalV2/portalV2LiveTimelineModel.js` creates the direct, idempotent public Live/Timeline presentation model.
- `js/portalV2/portalV2Model.js` exposes the live presentation alongside existing results data.
- `js/portalV2/portalV2Render.js` renders the Live Center, current direct summaries, and safe timeline.
- `css/portal-v2.css` supplies responsive Live/Timeline layout and reduced-motion treatment.
- `fixtures/portalV2PreviewFixtures.js` provides local V3 narrative fixtures.

## Tests And Evidence

- `tests/portal-v2-live-timeline.test.mjs` covers direct live data, correction history, deduplication, lifecycle, stale/revision guards, privacy, sanitization, and non-calculation boundaries.
- This directory records the implementation boundary and validation result.

## Mechanical Build Files

The canonical build update refreshes configuration checksum and JavaScript module cache queries only. It does not alter application behavior outside the Portal V2 Live/Timeline surface.
