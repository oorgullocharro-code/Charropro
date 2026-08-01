# Resultados de pruebas

## Suite dedicada

`tests/release-management.test.mjs` cubre:

- generacion determinista;
- version y build;
- manifest y checksum;
- changelog;
- compatibilidad;
- gates y evidencia;
- gates fail-closed;
- gate critico no renunciable;
- CAS e idempotencia;
- atomicidad;
- estados;
- secuencia de deploy;
- post-deploy obligatorio;
- rollback sin borrado;
- serializacion e inmutabilidad;
- limites y claves peligrosas;
- rechazo de secretos;
- preservacion de valores falsy.

## Resultado final

- `node --check`: 135/135 archivos aprobados.
- Suite completa: 50/50 suites aprobadas.
- Suite dedicada: aprobada.
- JSON: 6/6 archivos aprobados.
- `git diff --check`: aprobado.
- `git diff --cached --check`: aprobado antes del commit local.
- `debugger` nuevo: 0.
- `console.log` nuevo en codigo productivo: 0.
- `console.log` en prueba dedicada: 1, mensaje terminal de exito.
- Patrones de private keys, tokens GitHub/Slack o Firebase API keys nuevos: 0.
- Dependencias nuevas: 0.
- Push: no ejecutado.
- Deploy: no ejecutado.
- Firebase remoto: no utilizado.

La suite dedicada usa fixtures en memoria para evidencia de gates. No afirma que Emulator, IAM, Storage, Backup o Restore de un release productivo hayan sido ejecutados; esos gates permanecen obligatorios para cada candidato real.
