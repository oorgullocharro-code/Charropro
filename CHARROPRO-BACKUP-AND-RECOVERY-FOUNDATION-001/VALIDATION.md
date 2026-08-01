# Validacion

## Requisitos Cubiertos

| Requisito | Evidencia |
| --- | --- |
| Respaldo manual | Callable `requestCharroProBackup` fuerza modo manual y tipo full. |
| Respaldo automatico | Scheduler diario solicita un respaldo por torneo con idempotencia por fecha. |
| Completo y por torneo | Contrato soporta scopes tournament, organization y system. |
| Consistencia | Dos capturas canonicas consecutivas deben tener el mismo fingerprint. |
| No bloqueo operativo | Captura de solo lectura; ejecucion asincrona en worker independiente. |
| Concurrencia | Transaction, lock por scope, lease renovable y revision CAS. |
| Idempotencia | IDs deterministas y objeto Storage inmutable con generation precondition. |
| Integridad | Fingerprint del payload, checksum del archivo y read-back validation. |
| Auditoria | Eventos deterministas y write-if-absent para cada operacion. |
| Retencion | Expiracion de payload, catalogo historico y poda de control/idempotencia. |
| Cancelacion | Permitida antes de upload; no borra archivos ya validados. |
| Seguridad | Auth, rol, torneo, tenant y organizacion validados server-side. |
| Restore futuro | Manifest versionado declara compatibilidad y `supported: false`. |

## Identidad Y Permisos

- Roles manuales: `supervisor` y `operador`.
- Scope de organizacion manual: solo `supervisor` de la misma organizacion.
- Scope de sistema: `platformAdmin` o autoridad interna `system`.
- Scope de torneo: torneo existente, acceso autorizado, tenant y organizacion coincidentes.
- La cancelacion exige mismo scope y solicitante, supervisor del scope o platform admin.
- El cliente no puede definir politica de retencion, modo automatico ni tipo incremental.

## Fronteras De Seguridad

- `charropro/backupFoundation` tiene `.read: false` y `.write: false` para clientes.
- Los objetos se escriben por Admin SDK; no se generan signed URLs.
- El payload no contiene `live`, `broadcastStudio`, backups legacy ni el namespace recursivo.
- La clonacion rechaza funciones, simbolos, BigInt, ciclos, accessors, numeros no finitos y claves peligrosas.
- Se conservan `0`, `false`, cadena vacia y `null`.
- Los errores de auditoria eliminan URLs y redactan tokens, passwords, secrets, credentials y private keys.
- No se agregaron secretos ni dependencias.

## Estados

```text
REQUESTED -> CAPTURING -> UPLOADING -> VALIDATING -> COMPLETED
                 |              |             |
                 +-> CANCELLED  +-----------> FAILED
```

Los reintentos desde upload/validation vuelven a captura bajo el mismo `backupId`; el objeto ya almacenado se reutiliza de forma inmutable. Una revision terminal no puede mutarse. Si se pierde el lease, el worker es rechazado.

## Validacion De Alcance

- Motor deportivo: sin cambios.
- Reglas deportivas y calculos: sin cambios.
- Official Score Concurrency: sin cambios.
- Public Projection Recovery: sin cambios.
- Portal Publico: sin cambios.
- Broadcast Studio y Output Routing: sin cambios.
- Recovery Center: sin cambios.
- UI: sin cambios visibles.
- Datos reales: sin escrituras.
- Deploy: no realizado.
- Push: no realizado.

## Condicion De Activacion

La implementacion queda lista para deploy controlado posterior. Antes de activarla en produccion se debe confirmar la existencia del bucket por defecto, IAM del service account, cuota de Storage/Functions y politica organizacional de retencion.
