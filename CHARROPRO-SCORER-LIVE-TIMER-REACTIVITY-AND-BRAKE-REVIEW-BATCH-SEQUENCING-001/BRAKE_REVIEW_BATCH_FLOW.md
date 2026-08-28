# Brake Review Batch Flow

La cola se deriva de los equipos de la charreada y de sus estados individuales persistidos.

Estados de lote:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

Flujo certificado:

`E1 -> E2 -> E3 -> BRAKE_REVIEW_COMPLETED -> PROTOCOL -> JUDGES_CALL -> CALA_READY -> Cala E1`

AUTHORIZED, AUTHORIZED_WITH_INFRACTIONS y DQ confirmado cierran solo la presentacion actual y avanzan al siguiente equipo. DQ conserva reglas, resultado, timer y evidencia. El ultimo equipo no inicia Cala automaticamente.

Cada equipo conserva una identidad temporal independiente y READY sin heredar tiempo operativo del equipo anterior.
