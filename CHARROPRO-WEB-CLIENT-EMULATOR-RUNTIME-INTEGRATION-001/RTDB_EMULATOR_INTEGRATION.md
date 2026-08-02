# Realtime Database Emulator

El cliente local usa `http://127.0.0.1:9000?ns=demo-charropro-local` y luego `connectDatabaseEmulator(127.0.0.1, 9000)`. El seed escribe solamente bajo `charropro/` del proyecto local: perfiles, accesos, torneo, índice y estado live ficticios.

Validado: lectura de torneo, equipos, jornada y turno en el cliente; score ficticio de Cala; listener que actualizó el estado; recarga que reconstruyó Panel y Resultados; `audit/publishedScores`, `officialScoreLedger` y `officialScoreFanout` locales. El único score oficial activo conservó revisión 1 y el fanout quedó `DELIVERED`.
