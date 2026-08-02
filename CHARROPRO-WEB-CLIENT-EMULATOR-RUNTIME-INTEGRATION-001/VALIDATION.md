# Validación

El arranque real usó Java 21 y Node 20 para Functions:

```text
JAVA_HOME=/Users/orgullocharro/.local/charropro-runtime/jdk-21.0.12+8/Contents/Home
PATH=/Users/orgullocharro/.local/charropro-runtime/node-v20.20.2-darwin-arm64/bin:$PATH
node tools/development/charropro-development.mjs emulators:start --background
```

El hub confirmó Auth `9099`, RTDB `9000`, Functions `5001` y Storage `9199`. `emulatorSmokeTest.mjs` confirmó RTDB `200`, Auth `405`, Storage `403` y Functions `404`, respuestas esperadas de endpoints sin credenciales o callable.

Se ejecutó `localRuntimeSeed.mjs --reset`: siete cuentas ficticias, un torneo `DEMO / LOCAL / NO OFICIAL`, una jornada, tres equipos y las diez suertes. El login real de `juez.local@example.test` funcionó; una contraseña inválida fue rechazada; `supervisor.local@example.test` mostró el rol diferenciado.

El calificador existente recorrió visualmente Cala, Piales, Colas, Toro, Lazo, Pial R., Yegua, Mang. Pie, Mang. Cab y Paso. Se publicó una Cala de 20 puntos. Tras recargar, la tabla y Resultados conservaron 20 puntos. RTDB conservó un score oficial activo, ledger revisión 1, auditoría `PUBLISH_OFFICIAL_SCORE / COMMITTED` y fanout `DELIVERED`.

El cliente muestra el aviso de recuperación pública pendiente porque las reglas locales impiden la escritura directa del cliente en `publicTournaments`; la Function de Official Score dejó el fanout durable entregado. Esto no afecta la persistencia oficial ni requirió cambiar reglas dentro de este ticket.
