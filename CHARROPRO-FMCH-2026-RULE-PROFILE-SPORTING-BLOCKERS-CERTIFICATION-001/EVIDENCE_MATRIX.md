# Evidence Matrix

Certification ticket: `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001`

Resolution ticket: `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-RESOLUTION-002`

Profile: `FMCH_2026_LIBRE` `0.6.0`

The official rulebook is the primary sporting source. The official team sheet identifies printed fields. The client-confirmed Contra mascara criterion resolves the duplicated printed mention without creating another sporting identity.

| BLOCKER | OFFICIAL SOURCE | ARTICLE/PAGE | PRINTED TERM | CANONICAL SPORTING CONCEPT | CURRENT RULE ID | VALUE | CLASSIFICATION | RESOLUTION | SPORTING CHANGE | CERTAINTY | HUMAN DECISION REQUIRED |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cala medio lado derecho | Official rulebook; official team sheet | Art. 94 / PDF p. 39 | `MD`; scorer group `ML` | Medio lado derecho, one of the two scored medios lados | `cala_medio_derecho` | 1 | Sporting alias and group member | `RESOLVED_BY_OFFICIAL_SOURCE` | No | High | No |
| Cala medio lado izquierdo | Official rulebook; official team sheet | Art. 94 / PDF p. 39 | `MI`; scorer group `ML` | Medio lado izquierdo, one of the two scored medios lados | `cala_medio_izquierdo` | 1 | Sporting alias and group member | `RESOLVED_BY_OFFICIAL_SOURCE` | No | High | No |
| Cala cambio de rectangulo | Official rulebook; official team sheet | Art. 94 / PDF p. 39 | `PC`; scorer group `CR` | Return to the main rectangle by side or giving leg | `cala_cambio_rectangulo_costado` | 1 | Printed-sheet alias | `RESOLVED_BY_OFFICIAL_SOURCE` | No | High | No |
| Cala bad-points side sum | Official rulebook; official team sheet | Cala chapter / PDF pp. 37-43 | `SUMA PUNTOS MALOS` | Subtotal or validation control; no separate sporting conduct exists | None | None | `TECHNICAL_CONTROL_ONLY` | `TECHNICAL_CONTROL_ONLY` | No | High for non-sporting classification | No; exact printable formula remains a non-blocking documentation gap |
| Coleadero fourth participant row | Official rulebook; official team sheet | Arts. 113-115, 121 / PDF pp. 50-51 | Fourth blank name row; separate `SUPLENTE` label | Administrative, non-competitor row; canonical model remains three coleadores | None | None | Non-sporting administrative control | `RESOLVED_BY_OFFICIAL_SOURCE` | No | High for participant count | No; exact administrative use remains a non-blocking documentation gap |
| Coleadero fourth bottom control | Official rulebook; official team sheet | Arts. 113-115, 121 / PDF pp. 50-51 | Fourth bottom control | Administrative sheet control with no scoring effect | None | None | `TECHNICAL_CONTROL_ONLY` | `TECHNICAL_CONTROL_ONLY` | No | High for non-sporting classification | No; exact printable purpose remains a non-blocking documentation gap |
| Contra mascara duplicate printed identity | Official rulebook plus confirmed sporting criterion | Arts. 213, 217 / PDF pp. 84, 89 | `Contra mascara` in execution context and nominal-value row | One canonical Contra mascara identity | `manganas_caballo_base_contra_mascara` | 14 | Single canonical sporting identity | `RESOLVED_BY_CONFIRMED_SPORTING_CRITERION` | No | Confirmed | No |

## Source integrity

- Primary rulebook: `Reglamento-Oficial-Charros-Libre-y-Juvenil-24-28-VF2-2026.pdf`
- Primary rulebook SHA-256: `1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b`
- Official team sheet: `HOJA-CALIFICACION-EQUIPO-CHARROS-2024-2028 (2).pdf`
- Official team sheet SHA-256: `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7`
- FieldID baseline: `239/239` reviewed.
- Confirmed sporting criteria used: `1` (single canonical Contra mascara identity at 14 points).

## Certification result

| Area | Classification | Result |
| --- | --- | --- |
| Cala `ML/MD/MI` | Certified aliases and group relationship | Resolved |
| Cala `CR/PC` | Certified printed-sheet alias | Resolved |
| Cala side bad-points sum | Non-sporting subtotal/validation control | Resolved for sporting certification |
| Coleadero fourth row and control | Non-sporting administrative controls; three active coleadores preserved | Resolved for sporting certification |
| Contra mascara duplicate mention | One canonical identity, no duplicate charge | Resolved |

Remaining uncertainty concerns only exact printable or administrative field purpose. It does not change sporting semantics and is tracked as a non-blocking documentation gap.
