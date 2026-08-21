# Official Source Review

## Sources

- Primary rulebook: `Reglamento-Oficial-Charros-Libre-y-Juvenil-24-28-VF2-2026.pdf`
- SHA-256: `1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b`
- Pages: `108`
- Supporting official team sheet SHA-256: `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7`
- Confirmed client criterion: one canonical Contra mascara sporting identity at 14 points.

## Cala

Article 94, PDF page 39, identifies the two scored medios lados and the additional point for returning to the main rectangle by side or giving leg. The official sheet labels `MD`, `MI` and `PC`; the scorer uses the groups `ML` and `CR`.

Safe resolution:

- `MD` maps to `cala_medio_derecho`.
- `MI` maps to `cala_medio_izquierdo`.
- `ML` remains a group, not a third rule.
- `PC` maps to `cala_cambio_rectangulo_costado` under group `CR`.
- The side bad-points sum is a subtotal/validation control with no independent scoring effect.

## Coleadero

Articles 113-115 and 121, PDF pages 50-51, establish three coleadores per team and three opportunities per coleador. The fourth printed row cannot be interpreted as an active fourth competitor.

Safe resolution:

- Preserve three active participants and three opportunities each.
- Classify the fourth row and fourth bottom field as non-sporting administrative controls.
- Preserve their exact administrative purpose as a non-blocking documentation gap.

## Contra mascara

Article 213, PDF page 84, describes the mascara/contra mascara relationship for left-handed execution. Article 217, PDF page 89, prints Contra mascara in both an execution context and a nominal-value row.

The confirmed sporting criterion establishes one canonical identity only:

- RuleID: `manganas_caballo_base_contra_mascara`
- Value: `14`
- Duplicate rule: none
- Simultaneous duplicate selection: prohibited

## Other P0 evidence

- Terna: Arts. 149-155 and the official team sheet support three charros and five shared opportunities.
- Closing: section scoring rules and official closing controls provide sufficient sporting closure; exact print/export order is non-blocking.
- Signatures: Arts. 11, 14 and 26 define captain replacement, signature and conformity effects without invalidating the score merely because a captain signature is absent under the stated conditions.

## Result

All sporting blockers are resolved. Remaining uncertainty is administrative or print/export documentation only. No sporting value was changed.
