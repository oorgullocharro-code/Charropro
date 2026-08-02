# Guía Operativa Local

1. Exportar `JAVA_HOME=/Users/orgullocharro/.local/charropro-runtime/jdk-21.0.12+8/Contents/Home` y anteponer `/Users/orgullocharro/.local/charropro-runtime/node-v20.20.2-darwin-arm64/bin` al `PATH`; confirmar `java -version` y `node --version`.
2. Desde el repositorio ejecutar `node tools/development/charropro-development.mjs emulators:start --background`.
3. Ejecutar `node tools/development/charropro-development.mjs local:seed`.
4. Ejecutar `node tools/development/charropro-development.mjs web:start --port 8765`.
5. Abrir `http://127.0.0.1:8765/index.html` y verificar `LOCAL / EMULATOR`.
6. Iniciar con `juez.local@example.test` y la contraseña fixture.
7. Abrir `http://127.0.0.1:8765/jueces.html?tournamentId=demo-local-fmch-2026` y entrar a la jornada.
8. Detener el servidor web con `Ctrl+C` y los emuladores con `node tools/development/charropro-development.mjs emulators:stop`.

Para recrear datos usar `node tools/development/charropro-development.mjs local:reset --confirm`.
