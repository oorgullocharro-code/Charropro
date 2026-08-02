# CHARROPRO-WEB-CLIENT-EMULATOR-RUNTIME-INTEGRATION-001

## Estado

DICTAMEN TÉCNICO: APROBADO, pendiente únicamente del commit local autorizado.

El cliente web se ejecutó con un runtime local explícito, guardas contra Producción, seed sintético idempotente y Firebase Emulator Suite real. Java 21 quedó disponible en `JAVA_HOME` y Functions se ejecutó con Node `20.20.2`.

No hubo conexión, lectura, escritura, push ni deploy contra `charropro-e8a68`.

## Alcance realizado

- Runtime `LOCAL / EMULATOR` para `demo-charropro-local`.
- Auth, RTDB y Functions conectados al loopback antes de cualquier operación Firebase.
- Storage respondió desde su Emulator en `127.0.0.1:9199`; el flujo auditado no utiliza carga ni descarga de archivos, por lo que no se importó el SDK de Storage.
- Badge visible en acceso privado, aplicación, calificador y acceso de jueces.
- Usuarios, torneo, jornada, equipos y turno sintéticos.
- Servidor estático local de loopback y comandos de seed/reset.

La validación real cubrió login de juez y supervisor sintéticos, rechazo de contraseña inválida, apertura del calificador existente, recorrido visible de las diez suertes, publicación de Cala, recarga, resultados e historial oficial en RTDB.
