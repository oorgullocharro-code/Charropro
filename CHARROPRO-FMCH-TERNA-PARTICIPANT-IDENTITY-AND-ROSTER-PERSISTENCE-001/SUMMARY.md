# Summary

## Dictamen tecnico

APROBADO para publicacion controlada.

La identidad de los tres participantes de Terna queda preservada desde el
roster del equipo hasta Attempt V2, Official Score, Snapshot y Formato
Federacion. La fila se resuelve por `participantId` y `participantSlot`
canonicos, nunca por orden de publicacion, exito o nombre.

## Contrato certificado

- `ROW_01` corresponde permanentemente a `participantSlot = 1`.
- `ROW_02` corresponde permanentemente a `participantSlot = 2`.
- `ROW_03` corresponde permanentemente a `participantSlot = 3`.
- Cabecero fallido del Charro 1 conserva vacia su fila.
- Cabecero 26 del Charro 2 se proyecta en `ROW_02`.
- Pial 20 del Charro 3 se proyecta en `ROW_03`.
- Total Terna permanece en 46.
- Orden de publicacion, refresh, reconexion e intentos intercalados no cambian
  el ownership de fila.

## Limites preservados

No se modificaron `FMCH_2026_LIBRE 0.6.1`, sporting values, RuleIDs, FieldIDs,
Timer, RTDB Rules, Functions ni lifecycle.

## Build

`20260828-fmch-terna-participant-identity-roster-persistence-001-v1`
