# Field Dictionary

## Contract

`FIELD_DICTIONARY.json` is the machine-readable source of this specification. It contains 239 deterministic, singular field definitions: one `fieldId` for each visually distinct, identifiable data, control, signature, or institutional cell. `fieldCount` and the physical-cell count are both 239.

## Effective record shape

Each `fields[]` entry is a record. It inherits `requiredOrOptional`, `unit`, `defaultDisplay`, `dependency`, `source`, `notes`, and `sportsValidationRequired` from `fieldDefaults` only when that entry does not override the value. This preserves an explicit effective value for every required inventory attribute without repeating unchanging source metadata 239 times.

| Property | Meaning |
| --- | --- |
| `fieldId` | Stable FMCH technical ID; never a spreadsheet coordinate |
| `officialLabel` | Exact visible label, or empty string for a blank visual cell |
| `section` / `subsection` | Printed block and local visual group |
| `visualOrder` | Unique, deterministic source-inspection order from 1 through 239 |
| `visualOrder` | Deterministic source-page order |
| `rowReference` / `columnReference` | Source-page visual locator, not an Excel cell address |
| `dataType` / `semanticType` | Storage shape and neutral business classification |
| `inputOrCalculated` | Captured, calculated, identification, signature, display-only, mixed, or unknown |
| `repeatability` / `cardinality` | `NONE` / `1` for every singular visible field; repeated source patterns are represented by separate IDs |
| `visibleFormat` / `defaultDisplay` | Physical appearance and visible default symbol/value |
| `dependency` | Only a source-supported dependency; otherwise empty |
| `confidence` | `EXPLICIT`, `STRUCTURAL_INFERENCE`, `AMBIGUOUS`, or `ILLEGIBLE` |
| `source` | `PAGE_1_VISUAL` for this ticket |
| `sportsValidationRequired` | `YES` where an expert must establish semantic or formula meaning |

## Repetition rule

Repeated printed structures are intentionally expanded. For example, the twelve cells in Coleadero's first-pass body have IDs from `FMCH.TEAM_SHEET.COLEADERO.PASS_1.ROW_01.GOOD` through `FMCH.TEAM_SHEET.COLEADERO.PASS_1.ROW_04.TOTAL`. This avoids merging conceptually distinct rows or cells while preserving their physical source references.

## Deliberate non-assertions

- `MIXED` means the printed grid visibly contains fields that look captured and fields that look calculated, without asserting which individual formula applies.
- A visible gray fill or `TOTAL` label supports a structural calculation hypothesis only; it is not a formula.
- Empty or dotted controls retain a technical ID so a future exporter can preserve them, but their sports purpose remains unresolved.
