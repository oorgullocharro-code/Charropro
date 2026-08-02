# Authentication Emulator

El cliente local conecta Auth Emulator en `http://127.0.0.1:9099` antes de procesar login, sesión o logout. El seed administra únicamente usuarios con correos `@example.test` y UIDs `local-*` dentro del Auth Emulator.

Validado visualmente: login correcto del juez, rechazo de contraseña inválida, logout, login de supervisor y resolución diferenciada de rol. La recarga conservó la sesión y reconstruyó el torneo local. No se utilizaron cuentas ni credenciales productivas.
