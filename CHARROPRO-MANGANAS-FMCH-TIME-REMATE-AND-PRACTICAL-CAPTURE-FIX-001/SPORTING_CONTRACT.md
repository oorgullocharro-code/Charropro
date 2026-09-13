# Sporting contract

## Time settlement

Identity:

`tournament + competition + charreada + team/participant + modality + official timer`

Manganas a Pie and Manganas a Caballo produce independent faena keys and settlements.

The settlement contract is version `1.0.0`; the corrected Manganas scoring contract is version `2.0.0`. The canonical owner is opportunity 3. The settlement freezes `faenaKey`, `suerteId`, `timerId`, `officialElapsedMs`, complete unused minutes, eligibility, and points.

Official publication rejects:

- more than one settlement or time-rule quantity in a faena;
- a settlement outside its canonical owner;
- a mismatched faena key, timer quantity, or point value;
- an ineligible positive bonus;
- malformed new-schema settlement or remate data.

## Remate identity

The remate schema is version `1.0.0`. It preserves `remateId`, `remateName`, `remateSignature`, shortcut identity when present, effect final, orientation, turn direction, optional body finish, and source.

The signature is derived from technical identity, not points. A remate with zero additional points is valid. Repetition is evaluated against prior opportunities; publication order and point value are not identity.

For Pie, Desden, Contra desden, and Encontrada remain separate scoring effects. They do not replace the technical remate. For Caballo, the certified base catalog remains the operational shortcut catalog and supplies a structured remate identity.

## Practical additions and floreo

`manganaManualAdditionalTotal` is the practical `- / +` scoring authority for new records. `floreoDetail` is optional documentary evidence. Selecting documentary detail does not add it again to the manual total.

Legacy records without the corrected contract keep their historical `floreoTotal` interpretation. No technical remate is inferred from points or labels.
