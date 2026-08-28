# Multidevice Validation

Validacion LOCAL / EMULATOR:

- Telefono y Scorer convergen en START, PAUSE, RESUME y FINISH.
- El Scorer cambio de READY a RUNNING y mostro avance continuo sin refresh.
- PAUSE conservo el mismo valor visible.
- RESUME continuo desde el estado canonico.
- FINISH dejo el Scorer en `00:00.0 FINISHED`.
- La URL del Scorer no cambio y no se recargo la pagina.
- Refresh determinista y segundo consumidor reconstruyen el mismo equipo actual del lote.
- Phone, Scorer, Graphics y Timer Display usan la misma proyeccion temporal.

Firebase Production Writes: `0`.
