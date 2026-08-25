# Test Results

## Pruebas dirigidas

- Ocho contratos de bootstrap: PASS.
- Rules reales en Firebase Emulator: PASS.
- Juez `selected` no lee raiz global: PASS.
- Juez lee A y no B: PASS.
- Cero asignaciones: PASS.
- Inactivo: PASS.
- Rol invalido: PASS.
- Supervisor: PASS.
- Cache-buster, identidad de modulos y 26 entrypoints: PASS.
- Checksum de configuracion: PASS.

## Emulator

- Proyecto: `demo-charropro-local`.
- Auth: `127.0.0.1:9099`.
- RTDB: `127.0.0.1:9000`.
- Produccion referenciada por la prueba: no.
- Fixtures sinteticos eliminados al finalizar.

## Validacion final

- Suite completa: `111/111 PASS`, ejecutada una sola vez.
- `node --check`: `232/232 PASS`.
- JSON versionados: `28/28 PASS`.
- Secret scan del diff: PASS.
- Debugger scan del diff: PASS.
- Nuevos `console.log/debug`: 0.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS con staging vacio antes del cierre.
- FMCH certification y fingerprint: PASS / `rptp_0f90f7a3944a82d7`.

Despues de un endurecimiento final de roles legacy e IDs, se repitieron solamente las pruebas dirigidas afectadas; todas pasaron. No se repitio la suite completa.
