# Riesgos

## Mitigados

### Respaldo En El Mismo Medio Operativo

El mecanismo legacy guardaba copias mutables dentro de RTDB y el Recovery Center generaba archivos desde estado local. Backup Foundation guarda el payload en Cloud Storage y usa RTDB solo como plano de control y evidencia.

### Duplicacion Y Concurrencia

Un lock transaccional por scope, lease renovable, revision CAS, idempotency key y precondicion de generacion impiden dos respaldos activos equivalentes y objetos duplicados.

### Archivo Corrupto

El worker vuelve a descargar el objeto, verifica checksum, parsea JSON y valida el fingerprint interno antes de declarar `COMPLETED`.

### Crecimiento Del Plano De Control

La retencion elimina payloads expirados, conserva catalogo/auditoria y poda jobs e idempotencias que ya no deben seguir activos.

### Acceso Cruzado

Las autorizaciones validan auth, rol, tenant, organizacion, torneo y scope. El namespace tecnico no es legible ni escribible por clientes.

## Pendientes No Bloqueantes Para Foundation V1

### Restore No Implementado

El archivo esta preparado y versionado, pero no existe lector oficial de restauracion. Ningun operador debe tratar estos respaldos como restaurables automaticamente hasta aprobar el ticket Restore.

### Incrementales Diferidos

No existe todavia un journal global de mutaciones con checkpoints verificables. Implementar incrementales ahora podria producir falsos respaldos completos; v1 rechaza expresamente ese tipo.

### Dominio De Falla Del Proyecto

Cloud Storage separa el payload de RTDB, pero ambos pueden pertenecer al mismo proyecto Google Cloud. Para recuperacion ante perdida total del proyecto se recomienda replicacion con retencion bloqueada a un bucket de otra cuenta/proyecto y region en un ticket posterior.

### Scopes Grandes

Los respaldos de organizacion o sistema se construyen en memoria y tienen limite predeterminado de 200 MiB. La operacion diaria escala por torneo; para organizaciones con volumen superior se recomienda un manifest compuesto por archivos de torneo o export administrado antes de declarar respaldo monolitico ilimitado.

### Consistencia Entre Ramas RTDB

El nodo principal del torneo se lee atomicamente y las ramas auxiliares se aceptan solo si dos capturas canonicas consecutivas coinciden. RTDB no ofrece una transaccion de lectura selectiva entre ramas; una exportacion administrada global puede endurecer este punto para snapshots de sistema.

### Dependencia De Tournament Index

El scheduler usa `tournamentIndex` para evitar leer todos los torneos. Un torneo ausente de ese indice no recibira solicitud automatica. Se recomienda monitoreo de consistencia del indice.

### Activacion Pendiente

No hubo deploy. Deben validarse bucket, IAM, cuotas, costos, alarma de jobs fallidos y politica de retencion antes de activar el scheduler.

### Backups Legacy

El nodo `charropro/backups` y el historial local de Recovery Center permanecen por compatibilidad. No son equivalentes a Backup Foundation y no se migran ni eliminan en este ticket.
