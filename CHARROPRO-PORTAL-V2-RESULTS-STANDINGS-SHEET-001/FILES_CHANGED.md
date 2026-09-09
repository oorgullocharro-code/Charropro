# Files Changed

## Portal V2 Presentation

- `js/portalV2/portalV2ResultsModel.js` creates a direct, non-calculating V3 presentation model.
- `js/portalV2/portalV2Model.js` exposes that model to Portal V2.
- `js/portalV2/portalV2Render.js` renders Results, Standings, Sheet, lifecycle states, parity failure, and accessible tables.
- `css/portal-v2.css` provides responsive cards, podium, and controlled tables.
- `js/portalV2/portalV2App.js` enables explicit local-only preview fixtures.
- `fixtures/portalV2PreviewFixtures.js` provides V3-only local lifecycle fixtures.

## Tests

- `tests/portal-v2-results-standings-sheet.test.mjs` covers direct values, parity, lifecycle, grouping, module visibility, local navigation, and boundary guards.

## Mechanical Build Files

The canonical build update changes the runtime configuration checksum and propagates its cache query to JavaScript modules and test fixtures. These changes are mechanical and contain no functional contract changes.
