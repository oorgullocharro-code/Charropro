# Functions Emulator

El cliente local configura Functions Emulator en `127.0.0.1:5001` y conserva la región existente del bootstrap. Ninguna callable se redirige a una URL remota en runtime LOCAL.

Validado con actor autenticado `local-juez`: `publishCharroProOfficialScore` respondió por Functions Emulator. La primera solicitud dejó revisión 1 e `idempotent: false`; el retry con la misma idempotency key devolvió `idempotent: true` sin duplicar score, ledger, auditoría ni fanout. Las callables no usadas por el flujo de calificación no se invocaron.
