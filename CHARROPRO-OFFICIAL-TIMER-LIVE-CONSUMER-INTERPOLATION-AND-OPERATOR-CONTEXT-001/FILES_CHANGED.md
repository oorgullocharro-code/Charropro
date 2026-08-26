# Files Changed

## Runtime Behavior

- `js/core/officialTimerLiveDisplay.js`: shared deterministic display and ticker.
- `js/core/timerRules.js`: exact certified policy activation and context projection.
- `js/core/state.js`: shared Timer context transition without restart.
- `js/data/fmch2026PialesColeaderoRules.js`: canonical previous-attempt timer mode.
- `js/app.js`: Flow-derived context and scoped Scorer Timer updates.
- `js/views/cronometro-control.js`: operator context and shared live display.
- `js/views/cronometro-pantalla.js`: shared live display and stale protection.
- `js/views/grafico.js`: scoped Graphics Timer updates.
- `js/broadcast/dataContract.js`, `js/broadcast/liveBindings.js`,
  `js/broadcast/outputRouting.js`: official Timer projection fields.
- `css/styles.css`: responsive operator context styling.

## Tests

Added seven directed suites for activation, live display, drift, consumer parity,
operator context, ticker lifecycle and policy runtime behavior. Existing Timer,
Broadcast and lifecycle expectations were updated for the certified authority.

## Build Identity

`functions/configuration.defaults.json` carries build
`20260825-official-timer-live-context-001-v1` and checksum
`1505cb158c7dde182f2df2852c20bc9b2f0c654931d6ae48e81e3fed6c893b56`.
The canonical cache-buster tool propagated that identity through 152 existing
module/test references. Those mechanical files contain no additional behavior.

## Not Changed

- sporting profile content or sporting score values;
- `firebase-rules-auditoria.json` or other Rules;
- Firebase Functions runtime;
- dependencies;
- production data.

The exact release file list is the staged/committed Git manifest; this document
groups that manifest by responsibility to distinguish functional changes from
canonical build propagation.
