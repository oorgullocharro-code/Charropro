# Validacion

## Preflight Obligatorio

Antes de escribir se valida:

1. Catalogo existente y estado `COMPLETED`.
2. Payload presente en Storage.
3. Checksum del archivo.
4. JSON, schema, archive version y version de Backup Foundation.
5. Fingerprint interno del payload.
6. Identidad del manifiesto y de cada torneo contenido.
7. Rol, `auth.uid`, tenant, organizacion y autoridad de plataforma.
8. Invariantes de Scores Oficiales.
9. Fingerprint del target actual.
10. Safety backup exacto para todo target existente.

El preflight no escribe datos deportivos. Solo crea un registro tecnico temporal y devuelve una frase exacta y un token de un solo uso con vigencia de 15 minutos.

## Promocion Atomica

El worker vuelve a descargar y validar source y safety. Despues ejecuta una transaccion sobre `charropro`:

- compara el target contra el fingerprint del preflight;
- construye el estado restaurado sobre la copia transaccional;
- valida fingerprint e invariantes antes de devolver la nueva raiz;
- aborta sin cambios cuando existe conflicto.

No hay actualizaciones multipath parciales ni estado deportivo intermedio.

## Politicas De Compatibilidad

- Backup Foundation V1 escribio `restoreCompatibility.supported: false` porque en ese momento no existia lector. Restore Engine admite esos archivos solamente cuando coinciden exactamente con `charropro-backup/1`, version `1` y pasan todas las validaciones.
- No se implementan migraciones entre schemas.
- Los perfiles RTDB pueden restaurarse en scope sistema; Firebase Authentication no forma parte del archivo.
- El scope charreada elimina la proyeccion publica del torneo para impedir resultados publicos parcialmente restaurados. Debe ejecutarse una nueva proyeccion oficial.

## Evidencia Reproducible

```bash
node --check functions/restoreEngine.js
node --check functions/restoreService.js
node --check functions/index.js
node --check tests/backup-restore-validation.test.mjs
node tests/backup-restore-validation.test.mjs
for test_file in tests/*.test.mjs; do node "$test_file"; done
node -e "JSON.parse(require('fs').readFileSync('firebase-rules-auditoria.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('functions/package.json','utf8'))"
git diff --check
git diff --cached --check
```

## Resultado

- Preflight: aprobado.
- Confirmacion explicita: aprobada.
- CAS y aborto por cambio concurrente: aprobado.
- Postvalidacion dentro de la promocion: aprobada.
- Restore repetido y ejecucion concurrente: aprobados.
- Preservacion de auditoria: aprobada.
- Compatibilidad con Concurrency y Projection Recovery: aprobada.
- Firebase productivo: no utilizado.
- Deploy: no realizado.
