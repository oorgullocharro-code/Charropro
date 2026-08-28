# Summary

## Dictamen técnico

APROBADO PARA PUBLICACIÓN CONTROLADA.

## Problema corregido

La cadena Scorer -> Attempt V2 -> Official Score -> Team Total preservaba los
valores de Terna, pero el snapshot descartaba `participantId` y
`participantSlot`. Si el nombre publicado no coincidía exactamente con el
roster, el renderer asignaba Cabecero a `ROW_01` y Pial a `ROW_02` por tipo de
suerte. Ese fallback confundía orden de componente con propiedad reglamentaria
de fila.

## Correctivo

El Official Format Snapshot conserva la identidad del participante congelada en
Attempt V2. El renderer resuelve cada fila por identidad y slot canónicos, con
compatibilidad por nombre exacto, y ya no adivina la fila por `lazo` o
`pial_ruedo`. Los intentos no logrados dejan guion en la casilla de ejecución,
pero conservan sus malos, tiempo y total oficial cuando existan. No se modifican
puntuaciones, RuleIDs, FieldIDs ni el perfil `FMCH_2026_LIBRE 0.6.1`.

## Resultado

La prueba end-to-end confirma: Charro 1 falla Cabecero; Charro 2 obtiene 26 en
`ROW_02/CABECERO`; Charro 3 obtiene 20 en `ROW_03/PIAL`; total Terna 46. El
ownership permanece estable con intentos intercalados, registros entregados
fuera de orden y reconstrucción por refresh/reconexión.

Build: `20260828-fmch-terna-federation-format-row-ownership-001-v1`.
