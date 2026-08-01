# Gap Matrix

| Gap | P | Section | Field | Description | Derived ticket |
| --- | --- | --- | --- | --- | --- |
| FMCH-GAP-001 | P0 | Cross-cutting controls | FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL | Official controls lack approved semantic and persistence contract. | CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPORTS-VALIDATION-001 |
| FMCH-GAP-002 | P0 | Cala | FMCH.TEAM_SHEET.CALA.PC | PC is not proven equivalent to current CR; bad-point slot cardinality also differs. | CHARROPRO-FMCH-OFFICIAL-SCORING-ENGINE-COMPLIANCE-001 |
| FMCH-GAP-003 | P0 | Coleadero | FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME | Official fourth participant and three pass values are absent. | CHARROPRO-FMCH-OFFICIAL-DOCUMENT-DATA-GAPS-REMEDIATION-001 |
| FMCH-GAP-004 | P0 | Terna | FMCH.TEAM_SHEET.TERNA.ROW_01.BASE_ADDITIONALES_01 | Separate lazo and pial_ruedo collections lack approved official topology. | CHARROPRO-FMCH-OFFICIAL-SCORING-ENGINE-COMPLIANCE-001 |
| FMCH-GAP-005 | P0 | Closing totals | FMCH.TEAM_SHEET.CLOSING.FINAL_SCORE | Current totals are derived from mutable state, not official document snapshot/formula. | CHARROPRO-FMCH-OFFICIAL-SCORING-ENGINE-COMPLIANCE-001 |
| FMCH-GAP-006 | P0 | Export authority | FMCH.TEAM_SHEET.PIALES.ATTEMPT_1.GOOD | Federation exporter reads current state rather than selected ledger revision. | CHARROPRO-FMCH-OFFICIAL-DOCUMENT-EXPORT-ENGINE-001 |
| FMCH-GAP-007 | P1 | Header/roster | FMCH.TEAM_SHEET.HEADER.CAPTAIN_NAME | Captain, roster and substitutes are not snapshotted per official record. | CHARROPRO-FMCH-OFFICIAL-DOCUMENT-DATA-GAPS-REMEDIATION-001 |
| FMCH-GAP-008 | P1 | Signatures | FMCH.TEAM_SHEET.SIGNATURES.JUDGE_01 | Audit actors are not signatures. | CHARROPRO-FMCH-OFFICIAL-DOCUMENT-DATA-GAPS-REMEDIATION-001 |
| FMCH-GAP-009 | P1 | Timing | FMCH.TEAM_SHEET.JINETEO_TORO.COMPLETION_TIME | Stored tiempo is not consistently bound to official visual time positions. | CHARROPRO-FMCH-OFFICIAL-DOCUMENT-EXPORT-ENGINE-001 |
| FMCH-GAP-010 | P1 | QA | FMCH.TEAM_SHEET.HEADER.EVENT_NAME | No 239-field fixture/golden output validation. | CHARROPRO-FMCH-OFFICIAL-GOLDEN-FILE-VALIDATION-001 |
| FMCH-GAP-011 | P3 | Institutional | FMCH.TEAM_SHEET.HEADER.FEDERATION_LOGO | No approved versioned FMCH/CONADE assets or footer profile. | CHARROPRO-FMCH-OFFICIAL-PDF-PRINT-001 |

P0 prevents a correct official document. See GAP_MATRIX.json for causes, risks and related fields.
