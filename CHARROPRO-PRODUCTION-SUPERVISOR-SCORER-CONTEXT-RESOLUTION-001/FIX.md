# Fix

- Se agrego un resolver puro de contexto del scorer.
- Se modelaron nueve estados explicitos.
- La suscripcion de torneo reporta tambien errores normalizados.
- Panel, Programa, entrada directa y Scorer comparten el gate.
- La creacion productiva espera la asignacion canonica antes de navegar.
- Se conserva una accion administrativa explicita de recuperacion.
- El cache incorpora status, source, revision y fingerprint relevantes.
- El diagnostico `debugScorerContext` es visible y copiable, pero seguro.
- `Sin suertes calificables` queda reservado para competencia no soportada.

No se agrego una autoridad nueva ni un fallback FMCH dentro del scorer.
