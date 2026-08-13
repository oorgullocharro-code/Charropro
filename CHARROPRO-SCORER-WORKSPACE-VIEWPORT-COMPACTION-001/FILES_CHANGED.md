# Files Changed

## Functional scorer changes

- `js/app.js`: keeps the existing scoring actions and Attempt V2 state model, but groups manual score controls into a single responsive form row and projects Manganas attempt status and detail from the existing attempt records.
- `css/styles.css`: compacts the desktop and iPad-landscape scorer header, preserves footer action size, creates the Manganas operation/history composition, and provides portrait and mobile fallbacks.

## Tests

- `tests/scorer-workspace-viewport-compaction.test.mjs`: verifies the three-zone workspace contract, one-row manual capture, Manganas projection-only history, responsive fallbacks, and preserved scorer boundaries.
- `tests/scorer-screen-by-screen-ux-refinement.test.mjs`: updates the existing Manganas assertion from the previous presentation string to the status/detail projection used by this ticket.

## Versioning

- Cache-buster references use `20260813-scorer-workspace-viewport-compaction-001-v1` so the scorer CSS and JavaScript are loaded as one consistent release.

## Explicitly unchanged

No sporting rules, Rule Profile `FMCH_2026_LIBRE` 0.6.0, Attempt V2 model, Flow Engine, Pending Review, Timer Authority, official publication, Firebase Rules, public portal, graphics, or production data path was changed.
