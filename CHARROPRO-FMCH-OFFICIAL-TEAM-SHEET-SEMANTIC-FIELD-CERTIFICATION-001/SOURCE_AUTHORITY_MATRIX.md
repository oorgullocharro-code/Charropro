# Source Authority Matrix

| Dominio | Autoridad | Snapshot | Transformación permitida | Prohibido |
| --- | --- | --- | --- | --- |
| Identidad/evento | torneo, charreada, equipo y roster | metadata | texto seguro | inventar participante |
| Score | Official Score activo + Attempt V2 | `suertes.*.attempts` | orden/suma documental | `state.scores` mutable |
| Cala | Attempt V2 `calculationDetail` y selections | `documentalEvidence.cala` | proyección explícita | recalcular P/T en exportador |
| Malos | Attempt V2 `infractions[]` | slots + controles laterales | suma documental sin efecto | segundo descuento |
| Terna | `sportState.remate` | `documentalEvidence.remate` | label canónico | inferir por puntos |
| Paso | `sportState.vuelta` + base selection | `documentalEvidence.paso` | depósito por vuelta | inferir por total/RuleID |
| Tiempo | Timer Authority congelado en Attempt V2 | `documentalEvidence.officialTime` | `M:SS` | reloj actual/estimación |
| Institucional | PDF SHA + manifiesto de assets | `institutionalFields` | literal/asset | vigencia global futura |
| Firmas | captura manual | `manualFields` | ninguna | inventar firma/sello/folio |

La matriz detallada `SEMANTIC_FIELD_CERTIFICATION.md` contiene las 239 filas.
