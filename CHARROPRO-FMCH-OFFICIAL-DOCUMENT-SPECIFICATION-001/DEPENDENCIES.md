# Visible Dependencies

## Rule for this document

Only a printed label, grouping, position, arrow, or repeated layout may establish a dependency. No arithmetic formula has been inferred from the form.

| Output / control | Apparent inputs or scope | Dependency type | Confidence | Sports validation |
| --- | --- | --- | --- | --- |
| Cala `TOTAL` | Base plus adjacent labelled cells | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Cala `TOTAL MALOS` | `MALOS` grid | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Cala `PUNTOS PARCIALES` | Cala block | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Piales attempt Total | Good and Malos in same attempt | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Piales Total | Three printed attempt groups | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Coleadero row Total | Three pass groups in that row | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Coleadero Total | Four-row body | STRUCTURAL | AMBIGUOUS | YES |
| Jineteo Total | Detailed score cells before `MALOS` | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Jineteo final Total | Total, Malos, and `T` positions | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Terna Total | Base/Adicionales, Remate, Malos, T | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Manganas Total | Three printed attempt groups and `T` | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| Paso Total | Base/vuelta and `JINETEADA` cells plus Malos | STRUCTURAL | STRUCTURAL_INFERENCE | YES |
| `TOTAL, PUNTOS MALOS` | Arrow joins the section side-control area to closing cell | STRUCTURAL | AMBIGUOUS | YES |
| `PUNTUACIÓN FINAL` | Arrow points to final gray cell | STRUCTURAL | STRUCTURAL_INFERENCE | YES |

`SUMA CONTROL`, dotted boxes, and three-cell outlined strips are visible controls, but the source does not print their formulas or validation rules. They are not treated as confirmed calculations.
