# Riesgos

## Mitigados

### Sobrescritura Accidental

El Restore exige preflight, token temporal, frase exacta, idempotency key y confirmacion del mismo supervisor.

### Cambio Concurrente

El target se fingerprinta en preflight y se compara nuevamente dentro de la transaccion CAS. Cualquier escritura intermedia aborta sin aplicar datos.

### Perdida Del Estado Sustituido

Un target existente exige un safety backup terminado y exacto. El catalogo Restore conserva su referencia.

### Replay De Publicaciones Antiguas

`officialScoreFanout` no se restaura como cola activa. Los jobs de Projection Outbox no terminales quedan historicos como `SUPERSEDED`.

### Inconsistencia Oficial

Los ledgers modernos deben declarar una unica revision activa y concordar con `publishedScores`. Un archivo incoherente se rechaza antes del Restore.

### Caida Del Worker

El lease evita workers simultaneos. Una reejecucion reconoce una promocion ya confirmada por fingerprint y continua sin duplicarla.

## Pendientes Operativos Antes De Produccion

### Transaccion De Scope Grande

La promocion usa una transaccion sobre la raiz `charropro` para obtener atomicidad entre ramas. Es apropiada para una operacion excepcional, pero Restore de organizacion o sistema puede superar limites practicos de memoria/latencia. Debe ensayarse con el mayor dataset real y realizarse en ventana de mantenimiento. Una version futura puede usar manifests fragmentados con un mecanismo server-side de mantenimiento exclusivo.

### Validacion IAM Y Storage

No hubo deploy. Deben verificarse permisos de lectura del bucket, cuotas, timeouts, alertas y retry de Functions antes de activar Restore.

### Firebase Authentication

El respaldo de sistema conserva perfiles y accesos RTDB, no cuentas de Firebase Authentication. Una recuperacion total del proyecto requiere export/restore administrado de Auth fuera de este contrato.

### Charreada Parcial

El Restore de charreada elimina el snapshot publico del torneo y exige reproyeccion oficial. No reconstruye estadisticas historicas derivadas porque hacerlo implicaria recalcular datos fuera del alcance.

### Backups V1 Previos Al Lector

El manifest indica `supported: false` por razones historicas. El lector solo admite el schema exacto y no realiza migraciones; cualquier version futura incompatible se rechaza.

### Dominio De Falla

Safety y source pueden residir en el mismo proyecto Cloud que RTDB. Para desastre total se mantiene la recomendacion de replica inmutable en otra cuenta/proyecto y region.

### Operacion Sin UI

No se agrego interfaz. Las callables deben exponerse mediante una herramienta administrativa separada con doble control operativo antes de uso productivo.

## Riesgos No Aceptados

- Restore sin safety backup sobre datos existentes.
- Restore cross-tenant o cross-organization.
- Ultimo write gana.
- Reactivar fanout/outbox antiguos.
- Migrar schema durante Restore.
- Considerar un Restore parcial como proyeccion publica valida.
