# CHARROPRO-BACKUP-RESTORE-VALIDATION-001

## Resumen

Se implemento Restore Engine v1 como infraestructura administrativa server-side, sin interfaz nueva y sin modificar Backup Foundation, el Core deportivo o los consumidores publicos. El motor restaura archivos `charropro-backup/1` de forma validada, autorizada, idempotente, auditable y atomica.

## Arquitectura

```text
Supervisor autenticado
        |
        v
Preflight: catalogo + Storage + checksum + schema + identidad + permisos
        |
        +--> compara target actual con safety backup exacto
        +--> calcula plan/fingerprints
        +--> emite token de un solo uso + frase explicita (15 minutos)
        |
        v
Confirmacion: claim transaccional + idempotencia + lock por scope
        |
        v
Worker: revalida source/safety y ejecuta CAS sobre charropro
        |
        +--> target sin cambios: promocion completa y atomica
        +--> target cambio: aborto sin escritura deportiva
        +--> valida fingerprint/invariantes dentro de la transaccion
        |
        v
Auditoria + catalogo Restore + estado COMPLETED
```

El contrato puro vive en `functions/restoreEngine.js`. La orquestacion, el adapter de Firebase y la recuperacion del worker viven en `functions/restoreService.js`.

## Scopes

- `tournament`: restaura torneo, indice, proyeccion publica archivada, outbox, estadisticas, asignaciones y auditorias relacionadas.
- `organization`: restaura exactamente los torneos pertenecientes al tenant/organizacion autorizados, sin alterar configuracion global.
- `system`: restaura el snapshot completo de Backup Foundation V1; requiere `platformAdmin`.
- `charreada`: restaura definicion, scores, publicaciones, ledger, auditoria y asignacion de la charreada, sin tocar otras charreadas.

Un target existente exige un safety backup terminado cuyo fingerprint coincida exactamente con el estado preflight. Un target inexistente puede crearse sin sobrescritura.

## Integridad Y Seguridad

- Checksum SHA-256 del archivo y fingerprint SHA-256 del payload.
- Compatibilidad limitada expresamente a Backup Foundation `1.0.0`, schema `charropro-backup/1`, archive version `1`.
- Validacion de tenant, organizacion, torneo, scope, `auth.uid`, rol supervisor y autoridad de plataforma para sistema.
- Token aleatorio de un solo uso, frase exacta e idempotency key.
- CAS sobre el root `charropro`: cualquier cambio posterior al preflight aborta el Restore.
- Validacion de una sola revision oficial activa por ledger cuando el archivo usa el contrato moderno.
- Namespace `restoreFoundation` cerrado para clientes por Rules.
- Inputs clonados y serializados mediante las primitivas seguras de Backup Foundation.

## Preservacion

Los eventos de auditoria existentes se fusionan y nunca se borran. Cada Restore referencia el safety backup que contiene el estado sustituido. Los jobs pendientes de `officialScoreFanout` no se reactivan y las proyecciones pendientes archivadas se conservan como `SUPERSEDED`, evitando publicaciones antiguas.

Los metadatos operativos de Restore no forman parte del fingerprint funcional. Repetir la misma operacion produce el mismo estado deportivo.

## Recuperacion Del Worker

El worker usa lease y lock por alcance; el scope sistema usa un lock global independiente de la organizacion del administrador. Una ejecucion concurrente no duplica la promocion. Si el proceso cae despues del CAS, la siguiente ejecucion reconoce el fingerprint restaurado y continua desde `APPLYING` o `VERIFYING` sin reescribir datos.

## API Administrativa

- `validateCharroProRestore`: preflight y emision de confirmacion temporal.
- `requestCharroProRestore`: consume la confirmacion y crea el job.
- `cancelCharroProRestore`: cancela antes de `APPLYING`.
- `executeCharroProRestore`: worker idempotente activado por la creacion del job.

## Compatibilidad

No se modificaron Backup Foundation, Official Score Concurrency, Public Projection Recovery, Portal Publico, Broadcast Studio, Output Routing, Recovery Center, calculos, rankings, estadisticas ni reglas deportivas. Las suites completas de esos modulos permanecen aprobadas.

## Versiones

- Restore Engine: `1.0.0`.
- Restore schema: `charropro-restore/1`.
- Backup reader admitido: `charropro-backup/1`.

No hubo push ni deploy.
