# Secuencia oficial de Deploy

## Condicion previa

- Manifest en estado `approved`.
- Checksum verificado.
- Commit y tree hash coinciden con el artefacto.
- Todos los gates criticos en `passed`.
- Ventana y operadores autorizados.
- Artefactos anteriores disponibles para rollback.

## Orden

### 1. Congelar candidato

Bloquear cambios al build, confirmar refs, artefactos y evidencia. Si cambia cualquier byte, cancelar el candidato y generar otro.

### 2. Backup y Restore

Crear backup pre-deploy durable, verificar checksum y catalogo. Validar Restore contra un target aislado. No continuar con una prueba documental o fixture.

### 3. Rules

Desplegar Rules retrocompatibles que soporten al cliente y Functions anteriores y nuevos durante la ventana. Validar lectura/escritura autorizada, denegaciones y namespaces tecnicos.

Si falla:

- detener la secuencia;
- conservar cliente y Functions anteriores;
- restaurar Rules anteriores solo si siguen siendo compatibles;
- no borrar rutas ni datos.

### 4. Functions

Desplegar Functions por nombre y artefacto congelado. Validar carga, region, runtime, IAM, callables, triggers, idempotencia y health.

Si falla:

- no publicar cliente;
- volver al artefacto Functions anterior;
- mantener Rules compatibles;
- revisar logs sin exponer secretos.

### 5. Configuracion

Publicar configuracion mediante Configuration Management con `expectedVersion` e `idempotencyKey`. Nunca editar una version publicada.

Si falla:

- no publicar cliente;
- corregir o crear una nueva version;
- no modificar RTDB manualmente.

### 6. Cliente

Publicar el build inmutable con cache-busters/versiones correspondientes al manifest. Verificar que Hosting sirve exactamente el hash autorizado.

Si falla:

- reactivar el build cliente anterior;
- no cambiar datos ni Functions por reflejo;
- conservar evidencia de CDN/cache.

### 7. Verificacion

Ejecutar el checklist completo. Las pruebas incluyen Portal, Broadcast, Official Score Concurrency, Projection Recovery, Backup, Restore, Rules y Configuration.

### 8. Monitoreo y cierre

Observar errores, latencia, jobs, outbox, auditoria y salud durante la ventana definida. Cerrar como `completed` solo con todos los checks aprobados.

## Reglas de ejecucion

- No usar `firebase deploy` sin `--only` para el alcance aprobado.
- No desplegar desde un working tree sucio.
- No instalar dependencias durante la ventana.
- No reconstruir artefactos despues de validarlos.
- No mezclar cambios fuera del manifest.
- No usar Firebase productivo para pruebas destructivas.
- No continuar automaticamente despues de un fallo.
