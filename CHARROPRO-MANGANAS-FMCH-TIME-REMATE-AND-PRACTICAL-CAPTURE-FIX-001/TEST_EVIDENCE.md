# Test evidence

## Directed

- `fmch-manganas-time-remate-practical-capture.test.mjs`: PASS.
- `fmch-2026-manganas-paso-scorer.test.mjs`: PASS.
- `scoring-attempt-v2.test.mjs`: PASS.
- `scoring-ui-final-polish.test.mjs`: PASS.
- `full-scorer-integration.test.mjs`: PASS.

The directed fixture covers duplicate time input, idempotent settlement, reopening/changing opportunity, zero through three successes, `10 + 10 + 10 + 3 = 33`, Official Score freeze and rejection, zero-point remates, three distinct signatures, repeated signature, optional floreo detail, manual additions without double count, and separate placement/down evidence.

## Full regression

The coordinated Auth, RTDB, Functions, and Storage Emulator suite completed with:

- Tests: `339`
- Pass: `338`
- Fail: `0`
- Skip: `1`

The suite includes FMCH profile/fingerprint, every other suerte, Official Score, Formato Federacion, team charreada, Public V3, Portal, Rules, Timer, and Functions boundaries. No production data was used or written.
