# Sports Validation Questions

## Cala

1. What do `P`, `T`, `LD`, `LI`, `MD`, `MI`, and `PC` mean on this exact 2024-2028 sheet? Impact: scoring input semantics and exported headings.
2. What is the intended number and identity of the individual `MALOS` cells? Impact: detailed capture and historical audit.
3. What do the dotted `Suma Puntos Malos` control and `Puntos Parciales` represent? Impact: validation versus calculation.

## Piales and Coleadero

1. Are Good, Malos, and Total fields entered per attempt/pass, or are any derived? Impact: formula ownership.
2. Does Coleadero Total belong to each row, the entire section, or both? Impact: data cardinality.
3. What do all `Suma Control` dotted cells validate? Impact: paper parity and review workflow.

## Jineteos and Terna

1. Confirm the exact capture semantics of every Toro and Yegua label, especially the event-style labels. Impact: input widgets and exports.
2. Confirm the meaning of `T` and `TERMINADO EN ... MIN.`. Impact: duration model and totals.
3. In Terna, identify the two Base/Adicionales and two Remate groups and their participant association. Impact: correct source mapping.

## Manganas and Paso

1. Confirm `T` and the meaning of `TERMINADO EN` for Manganas. Impact: timing and total calculation.
2. Confirm the exact field meanings of `DISTANCIA`, `CUARTA`, `REPAROS`, and `OREJA C/P` in Paso. Impact: data contract.
3. Does `+` in Paso denote a default displayed sign, a captured marker, or a calculated indicator? Impact: export behavior.

## Global controls and signatures

1. Identify every dotted and three-cell outlined control area. Impact: document completeness and audit fields.
2. Confirm the source and formula for `TOTAL, PUNTOS MALOS` and `PUNTUACIÓN FINAL`. Impact: parity testing.
3. Are the three Juez cells independent signatures, names, or both? Impact: signature data and printing.
4. Does a `SUPLENTE` line apply to a named individual only, the section roster, or a paper substitution record? Impact: roster model.
