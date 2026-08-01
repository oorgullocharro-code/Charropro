# CharroPro FMCH Official Document Specification 001

## Scope

This directory is the documentary contract for the one-page FMCH `HOJA DE CALIFICACION POR EQUIPO DE CHARROS 2024-2028` source supplied by the user. It does not implement, validate, correct, or map any sports rule, score calculation, exporter, PDF, spreadsheet, or CharroPro data model.

## Result

- Fourteen visual blocks were inventoried in their printed order.
- The field dictionary assigns a deterministic, singular FMCH ID and row/column reference to every visible identifiable data, control, signature, and institutional cell.
- Every formula-looking relationship is marked `STRUCTURAL` and `PENDING_SPORTS_VALIDATION` unless the source itself prints an explicit value or label.
- Visible abbreviations and unlabeled controls remain unresolved rather than expanded from sports knowledge.
- The existing repository references are listed without any compliance conclusion.

## Source confidence

The PDF was rendered at 360 DPI and visually inspected. No text extraction utility was used as a substitute for the image; the locally installed Poppler build did not expose `pdftotext`. The page itself was legible at the rendered resolution.

## Boundary

The next authorized step is `CHARROPRO-FMCH-OFFICIAL-DOCUMENT-DATA-MAPPING-001`. It must map this document contract to the existing implementation. That mapping was not started here.
