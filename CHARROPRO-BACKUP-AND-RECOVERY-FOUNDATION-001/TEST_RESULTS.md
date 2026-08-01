# Resultados De Pruebas

## Suite Nueva

Comando:

```bash
node tests/backup-foundation.test.mjs
```

Resultado: `backup foundation tests passed`.

Cobertura reproducible:

- respaldo completo por torneo;
- respaldo de torneo vacio;
- datos historicos, auditoria, Projection Outbox y Scores Oficiales;
- respaldo completo por organizacion;
- respaldo completo de sistema;
- programacion automatica por torneo;
- 20 solicitudes concurrentes sobre el mismo scope;
- repeticion idempotente de solicitud y worker;
- objeto inmutable sin duplicacion;
- checksum correcto y payload alterado;
- corrupcion de Storage y agotamiento controlado de cinco intentos;
- permisos, tenant y organizacion;
- cancelacion y cancelacion cruzada denegada;
- torneo eliminado antes de captura;
- retencion, expiracion de payload y poda de control;
- eventos de auditoria deterministas;
- serializacion segura y no mutacion;
- preservacion de `0`, `false`, `""` y `null`;
- reglas cliente cerradas.

## Sintaxis Y JSON

```bash
node --check functions/backupFoundation.js
node --check functions/backupService.js
node --check functions/index.js
node --check tests/backup-foundation.test.mjs
node -e "JSON.parse(require('fs').readFileSync('firebase-rules-auditoria.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('functions/package.json','utf8'))"
```

Resultado: todos aprobados.

## Regresion Completa

Se ejecutaron los 47 archivos `tests/*.test.mjs`, uno por uno. Resultado: 47 aprobados, 0 fallidos. La corrida incluye Core deportivo, Cala, penalizaciones, contexto de torneo, Official Score Concurrency, Public Projection Recovery, Portal Publico, Broadcast Studio, Outputs, Production Console y reglas Firebase.

## Higiene

```bash
git diff --check
```

Resultado: sin errores.

La revision dirigida no encontro `debugger`, logs de depuracion nuevos, credenciales, API keys, private keys ni secretos. El unico `console.log` nuevo pertenece al mensaje final de la prueba automatica.

## Infraestructura Real

No se uso Firebase productivo y no se hizo deploy. Los flujos distribuidos se validaron con un adapter determinista en memoria. La validacion IAM/bucket se conserva como gate obligatorio del ticket de despliegue.
