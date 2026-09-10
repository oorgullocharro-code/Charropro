# Rules Parity Matrix

| Section | Previous state | V3 state after change |
| --- | --- | --- |
| `program` | V3 partial | V3 complete: competition/phase context and public roster names |
| `results` | Legacy partial | V3 complete: public charreada, competition, and phase names |
| `standings` | V3 partial | V3 complete: competition and phase names |
| `sheet` | V3 partial | V3 complete: charreada and phase context |
| `timeline` | V3 partial | V3 complete: publication, competition, charreada, participant, team, and suerte context |

The source of truth is `js/public/canonicalPublicTournamentData.js`; the Functions mirror remains unchanged because no producer field changed.

Authorization is unchanged: public projection writes still require an authenticated active `supervisor`, `operador`, or `juez` with tournament access and a strictly increasing V3 projection revision.

The following are rejected: V2, unknown schema, unknown fields, `uid`, `email`, `roles`, `officialScoreLedger`, raw `publishedScores`, `attemptV2`, `cas`, `audit`, `recovery`, and `token`.
