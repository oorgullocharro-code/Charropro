# Evidence Matrix

Ticket: `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001`

Profile: `FMCH_2026_LIBRE` `0.6.0`

The matrix uses only evidence already present in the repository and the verified source PDF. Similar names are not treated as equivalent sporting rules.

| BLOCKER | SOURCE | SOURCE LOCATION | PRINTED LABEL | NORMALIZED ID | CURRENT RULE ID | CURRENT SPORTING VALUE | MAPPING STATUS | CERTAINTY | ACTION ALLOWED | HUMAN DECISION REQUIRED |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cala medio lado | Official team sheet; scorer audit; sports questionnaire | `CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPECIFICATION-001/ABBREVIATIONS_AND_AMBIGUITIES.md`; `CHARROPRO-FMCH-2026-CALA-SCORER-001/FMCH_2026_CALA_FIELDID_MAP.md`; SCQ-002 | `MD`, `MI`; scorer group `ML` | `FMCH.TEAM_SHEET.CALA.MD`, `FMCH.TEAM_SHEET.CALA.MI` | `cala_medio_derecho`, `cala_medio_izquierdo` | 1 point each | `FIELDID_MAPPING_BLOCKED` | Printed cells and scorer rules both exist; their exact export equivalence is not certified | Preserve current rules and values; document the unresolved relationship | Yes. Define `MD`, `MI` and `ML`, and certify their exact relationship |
| Cala cambio | Official team sheet; scorer audit; sports questionnaire | `CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPECIFICATION-001/ABBREVIATIONS_AND_AMBIGUITIES.md`; `CHARROPRO-FMCH-2026-CALA-SCORER-001/FMCH_2026_CALA_FIELDID_MAP.md`; SCQ-002 | `PC`; scorer group `CR` | `FMCH.TEAM_SHEET.CALA.PC` | `cala_cambio_rectangulo_costado` | 1 point | `FIELDID_MAPPING_BLOCKED` | The source does not certify that `PC` and `CR` are aliases | Preserve current rule and value; do not add an alias | Yes. Define `PC` and `CR` and certify whether they are the same conduct |
| Cala bad-points side sum | Official team sheet and FieldID matrix | `CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPORTS-VALIDATION-001/OPEN_QUESTIONS.md`; `CHARROPRO-FMCH-OFFICIAL-SPORTS-COMMISSION-VALIDATION-001/FIELD_VALIDATION_MATRIX.md` | `SUMA PUNTOS MALOS` | `FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL` | None | None | `FIELDID_MAPPING_BLOCKED` | The printed control exists; its role as rule, subtotal, validation, or non-scoring control is unresolved | Keep it non-operational and blocked | Yes. Define purpose, inputs, calculation and whether it affects score |
| Coleadero fourth participant row | Official team sheet and regulation reconciliation | `CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001/FMCH_2026_UNRESOLVED_SOURCE_ITEMS.md` USI-002; `CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPORTS-VALIDATION-001/REGULATION_CONFLICTS.md`; SCQ-004 | Fourth name row | `FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME` | None | Current model remains 3 participants x 3 opportunities | `FIELDID_MAPPING_BLOCKED` | The sheet shows a fourth row while the cited regulation describes three coleadores and possible substitution | Do not add a fourth active participant | Yes. Define whether the row is substitute, reserve, administrative control, summary, or active competitor |
| Coleadero fourth bottom control | Official team sheet and FieldID matrix | `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/FIELDID_AND_BLOCKERS.md`; SCQ-004 | Fourth bottom control | `FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04` | None | None | `FIELDID_MAPPING_BLOCKED` | The printed control has no certified sporting or administrative meaning | Keep it non-operational and blocked | Yes. Define its purpose and relationship to the fourth name row |
| Contra mascara duplicate printed identity | FMCH 2026 scoring specification and Manganas reconciliation | `CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001/FMCH_2026_UNRESOLVED_SOURCE_ITEMS.md` USI-003; `CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001/RULE_RECONCILIATION_AND_BLOCKERS.md` | `Contra mascara` appears in two printed contexts | USI-003 | `manganas_caballo_base_contra_mascara` | 14 points | `SOURCE_CONFIRMATION_REQUIRED`; duplicate collapsed | One safe sporting identity and value exist; the source does not establish a second distinct execution | Preserve one rule and the duplicate marker; do not create a second RuleID | Yes. Confirm whether the second mention is editorial/reference or a distinct execution |

## Source integrity

- Source PDF: `HOJA-CALIFICACION-EQUIPO-CHARROS-2024-2028 (2).pdf`
- Verified SHA-256: `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7`
- FieldID baseline: `239/239` reviewed.
- Direct sports decisions recorded: `0`.
- Direct expert/interview evidence recorded: `0`.

## Classification

| Blocker | Classification | Result |
| --- | --- | --- |
| Cala `ML/MD/MI` | `REQUIRES_SPORTING_AUTHORITY` | Blocked |
| Cala `CR/PC` | `REQUIRES_SPORTING_AUTHORITY` | Blocked |
| Cala side bad-points sum | `REQUIRES_SPORTING_AUTHORITY` | Blocked |
| Coleadero fourth row and control | `REQUIRES_SPORTING_AUTHORITY` | Blocked |
| Contra mascara duplicate mention | `REQUIRES_SPORTING_AUTHORITY` | Blocked |
