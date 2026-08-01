# CHARROPRO-BACKUP-AND-RECOVERY-FOUNDATION-001

## Resumen

Se implemento Backup Foundation v1 como infraestructura server-side, modular y sin cambios visibles para operadores. El modulo genera respaldos completos de torneo, organizacion o sistema, los almacena como objetos JSON inmutables en Cloud Storage y conserva control, catalogo y auditoria en un namespace tecnico de Realtime Database cerrado a clientes.

El riesgo arquitectonico detectado antes de implementar fue que los respaldos existentes dependian del navegador o de una copia mutable dentro de la misma RTDB. Ninguna de esas opciones constituye recuperacion durable frente a perdida de la base. La nueva arquitectura separa el payload de respaldo de la base operativa.

## Arquitectura

```text
Callable autenticada / Scheduler
        |
        v
RTDB transaction: claim + idempotencia + lease por scope
        |
        v
Worker con retry
        |
        +--> captura estable en dos pasadas
        +--> seleccion y sanitizacion canonica
        +--> manifest versionado + fingerprint SHA-256
        +--> Cloud Storage con ifGenerationMatch=0
        +--> descarga y validacion de checksum
        |
        v
RTDB: catalogo + auditoria + estado terminal + retencion
```

El contrato puro vive en `functions/backupFoundation.js`; la orquestacion y el adapter viven en `functions/backupService.js`. La dependencia de Firebase queda contenida en el adapter, por lo que el contrato puede migrarse a otro almacenamiento sin modificar seleccion, integridad, estados o retencion.

## Estrategia

- Tipo implementado: snapshot completo (`full`).
- Modos: manual y automatico.
- Scopes: torneo, organizacion y sistema.
- Programacion automatica: diaria a las 03:00, zona `America/Mexico_City`.
- Retencion server-side: 90 dias y maximo 30 payloads por scope; respaldos fijados no expiran.
- Respaldo manual recomendado: antes y despues de cambios operativos de alto riesgo.
- Exclusiones: `live`, `broadcastStudio`, respaldos legacy y el propio `backupFoundation` no entran al payload.
- Integridad: fingerprint SHA-256 del payload, checksum SHA-256 del archivo completo y validacion por descarga posterior.
- Concurrencia: un lease renovable por scope, CAS de revision, idempotency key y objetos de Storage inmutables.
- Auditoria: solicitud, inicio, validacion, finalizacion, fallo, cancelacion y expiracion.

## Contenido

El snapshot de torneo incluye el registro del torneo completo y, por tanto, charreadas, equipos, participantes, scores, publicaciones, ledger y auditoria de Scores Oficiales. Tambien incluye indice, Projection Outbox, proyeccion publica vigente, estadisticas historicas, auditoria publicada, asignaciones/eventos de jueces y configuraciones criticas.

Los respaldos de organizacion seleccionan solo torneos del tenant y organizacion autorizados. El respaldo de sistema incluye los torneos y perfiles requeridos para reconstruccion administrativa. Ningun payload se expone por reglas cliente ni mediante URL firmada.

## API Operativa

- `requestCharroProBackup`: callable autenticada para supervisor u operador autorizado.
- `cancelCharroProBackup`: cancelacion cooperativa antes de upload/validacion.
- `executeCharroProBackup`: worker disparado al crear un job.
- `scheduleCharroProBackups`: solicitud automatica diaria por torneo.

## Compatibilidad

No se modificaron motor deportivo, reglas de competencia, calculos, Portal Publico, Broadcast Studio, Output Routing, Public Projection Recovery, Official Score Concurrency, Recovery Center ni UI. Los respaldos legacy permanecen intactos y no se migran automaticamente.

## Fuera De Alcance

- Restore y rollback de datos.
- Snapshots incrementales: se rechazaron en v1 porque todavia no existe un journal durable de mutaciones que permita demostrar completitud.
- Descarga comercial o interfaz de administracion.
- Replicacion automatica fuera del proyecto Firebase.
- Deploy y prueba contra infraestructura productiva.

## Versiones

- Backup Foundation: `1.0.0`.
- Schema de archivo: `charropro-backup/1`.
- Archive version: `1`.
- App marker del worker: `20260801-backup-foundation-001-v1`.
