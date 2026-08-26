# Brake Review Flow

## Estados

- `BRAKE_REVIEW`: revision activa o lista para iniciar.
- `WAITING_PROTOCOL`: revision autorizada; Cala aun bloqueada.
- `JUDGES_CALL`: protocolo concluido y llamada de jueces pendiente.
- `CALA_READY`: habilita el scorer normal de Cala.
- `DISQUALIFIED`: resultado terminal; no habilita Cala normal.

## Transiciones

`AUTORIZADO` finaliza el timer oficial de Brake Review y pasa a protocolo. `LLAMADA DE JUECES` y `LISTO PARA CALA` son decisiones explicitas; ninguna inicia el timer de Cala.

La Cala crea/resuelve una identidad temporal propia. No hereda `timerId`, elapsed, revision ni estado del timer de Brake Review.

## Profile awareness

La frontera se habilita solo cuando coinciden `FMCH_2026_LIBRE`, version `0.6.1` y fingerprint `rptp_10e596046446e850`. Cualquier otra combinacion falla cerrada y conserva el flujo publicado de `0.6.0`.
