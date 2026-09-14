# Test evidence

## Directed

- `fmch-manganas-time-remate-practical-capture.test.mjs`: PASS.
- `fmch-2026-manganas-paso-scorer.test.mjs`: PASS.
- `scoring-attempt-v2.test.mjs`: PASS.
- `scoring-ui-final-polish.test.mjs`: PASS.
- `full-scorer-integration.test.mjs`: PASS.

The directed fixture covers duplicate time input, idempotent settlement, reopening/changing opportunity, zero through three successes, `10 + 10 + 10 + 3 = 33`, Official Score freeze and rejection, zero-point remates, three distinct signatures, repeated signature, optional floreo detail, manual additions without double count, and separate placement/down evidence.

The physical closeout exposed a presentation regression: the technical remate block and the scoring-effects block shared the same classic scorer grid area. Directed source/layout assertions now require independent `technical` and `effects` grid ownership, visible quick-capture actions, and the open custom technical path.

A later physical run exposed `official-publish-exception` with Rodada, Bigotona, and a third `NOT_ACHIEVED` opportunity. The exact exception was `TypeError: Cannot read properties of undefined (reading 'filter')` in `removeTimeSettlement()`: sparse UI drafts legitimately omitted optional `applied` and `ruleQuantities` collections. The regression now exercises that exact sparse payload, zero and one achieved sparse faenas, collection validation, and Attempt V2 / Official Score freeze without requiring remate identity on the not-achieved opportunity.

The corrected DOM flow published the third opportunity, stored one time settlement on opportunity 3, and advanced from Manganas a Pie to Manganas a Caballo without refresh.

## Full regression

The coordinated Auth, RTDB, Functions, and Storage Emulator suite completed with:

- Tests: `339`
- Pass: `338`
- Fail: `0`
- Skip: `1`

The suite includes FMCH profile/fingerprint, every other suerte, Official Score, Formato Federacion, team charreada, Public V3, Portal, Rules, Timer, and Functions boundaries. No production data was used or written.

Final physical certification remains pending for the visible technical capture scenarios requested by the judge workflow.
