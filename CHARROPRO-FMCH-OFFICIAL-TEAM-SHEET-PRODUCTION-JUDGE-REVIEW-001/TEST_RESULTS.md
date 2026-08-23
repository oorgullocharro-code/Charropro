# Test Results

## Final validation

- Complete repository suite: `85/85 PASS`.
- `node --check`: `197/197 PASS`.
- JSON validation: `25/25 PASS`.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS with empty staging before controlled staging.
- Secret scan: PASS.
- Debugger scan: PASS.
- Console scan: PASS; only terminal success messages remain in the two new test files.
- FieldID: `239/239`.
- Semantic mismatch: `0`.
- Missing source data in certification fixtures: `0`.
- Sporting blockers: `0`.
- Rule Profile fingerprint: `rptp_0f90f7a3944a82d7`.

Directed certification covers the eight `T` fields, 24 accumulated control fields, AH/D/R, the `5 + 4 = 9` control case, deterministic golden XLSX and one-page Letter PDF rendering.

## Rich evidence SHA-256

| Artifact | SHA-256 |
| --- | --- |
| `formato-fmch-demo-cala-positiva.xlsx` | `3beea9f42be558a2532c1b15d025c90a84aebc5b873b098cdd75b4736156e2f3` |
| `formato-fmch-demo-cala-positiva.pdf` | `e9a5c1e86d242106b3514ff25d1203ac501d722569e444b9a6b4847ac51b6941` |
| `formato-fmch-demo-cala-infracciones.xlsx` | `41b3fe470845420f6975c42636170d08b27faa70d360c0f6acd242a29031252e` |
| `formato-fmch-demo-cala-infracciones.pdf` | `955e48401f5b4d0682844fc4a09f90d53674c4afd97d0c7a290c5498e1f6087b` |
| `formato-fmch-demo-jineteos-complejos.xlsx` | `5e3ab8bb322e3b808552e222c7141200ac35c4fe36b2a429b173bf8bf879d0cb` |
| `formato-fmch-demo-jineteos-complejos.pdf` | `f7e97626bf2b032362259aef87ee680611fc2ee5145424a2a87a36815ddb46a6` |

All three PDFs are one-page Letter portrait (`612 x 792 pt`) with embedded FMCH and CONADE assets. Firebase Production sporting writes: `0`.
