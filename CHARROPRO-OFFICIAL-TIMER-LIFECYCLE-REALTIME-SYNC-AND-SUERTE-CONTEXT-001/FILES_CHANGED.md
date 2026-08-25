# Files Changed

- `js/core/timerRules.js`: resolucion de seleccion por contexto, proteccion de Timer activo, identidad por oportunidad y metadata temporal derivada.
- `js/views/cronometro-control.js`: adopcion automatica segura de la suerte vigente y aviso de cambio bloqueado.
- `js/app.js`: entrega indices canonicos de oportunidad/participante al resolver Timers.
- `tests/official-timer-lifecycle-reuse.test.mjs`: regresiones de reutilizacion, stale context, identidad y proyecciones.
- `functions/configuration.defaults.json`: build canonico y checksum de configuracion.
- `CHARROPRO-OFFICIAL-TIMER-LIFECYCLE-REALTIME-SYNC-AND-SUERTE-CONTEXT-001/`: evidencia compacta requerida.

El generador de build actualiza de forma mecanica las referencias `?v=` en consumidores y pruebas. Esos archivos no contienen cambios semanticos adicionales.
