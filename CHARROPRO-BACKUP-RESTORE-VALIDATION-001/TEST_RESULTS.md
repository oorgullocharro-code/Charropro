# Resultados De Pruebas

## Suite Nueva

```bash
node tests/backup-restore-validation.test.mjs
```

Resultado: `backup restore validation tests passed`.

Cobertura:

- Restore completo de sistema.
- Restore por organizacion.
- Restore por torneo.
- Restore por charreada.
- Creacion de target inexistente.
- Backup inexistente, corrupto y checksum invalido.
- Safety backup obligatorio y coincidencia exacta.
- Confirmacion incorrecta.
- Permisos y organizacion incorrecta.
- Ledger oficial inconsistente.
- Cambio del target despues del preflight.
- Dos workers concurrentes.
- Solicitud y ejecucion repetidas.
- Cancelacion antes de aplicar.
- Auditoria y catalogo Restore.
- Preservacion de auditoria historica.
- Postvalidacion y fingerprint.
- Eliminacion de fanout pendiente y terminalizacion de Outbox.
- Publicacion oficial posterior al Restore.
- Generacion de fanout/proyeccion posterior al Restore.
- Rules cliente cerradas y exports de Functions.

## Sintaxis Y JSON

```bash
node --check functions/restoreEngine.js
node --check functions/restoreService.js
node --check functions/index.js
node --check tests/backup-restore-validation.test.mjs
node -e "JSON.parse(require('fs').readFileSync('firebase-rules-auditoria.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('functions/package.json','utf8'))"
```

Resultado: aprobado.

## Regresion Completa

Se ejecutaron los 48 archivos `tests/*.test.mjs`, uno por uno.

- Aprobados: 48.
- Fallidos: 0.

La corrida incluye Core deportivo, reglas de Cala, penalizaciones, contexto de torneo, Backup Foundation, Official Score Concurrency, Public Projection Recovery, Portal Publico, Broadcast Studio, Program Main, Announcer, Outputs y Firebase Rules.

## Higiene

`git diff --check`: aprobado.

`git diff --cached --check`: aprobado al validar staging controlado.

No se detectaron `debugger`, logs de depuracion nuevos, credenciales, tokens, private keys o secretos. El unico `console.log` nuevo es el resultado terminal de la prueba automatica.

## Infraestructura Real

No se uso Firebase productivo. Las pruebas distribuidas usan un adapter determinista en memoria con Storage simulado y transacciones serializadas. No hubo push ni deploy.
