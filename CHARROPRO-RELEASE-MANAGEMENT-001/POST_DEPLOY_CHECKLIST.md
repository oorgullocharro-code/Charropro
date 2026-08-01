# Checklist post-deploy

Cada item requiere `passed`, evidencia, timestamp y actor. `blocked`, `failed` o `pending` impiden completar el release.

## Integridad del release

- [ ] Commit publicado coincide con el manifest.
- [ ] Tree hash y artefactos coinciden.
- [ ] Checksum del manifest es valido.
- [ ] Version visible coincide con el release.
- [ ] No existen archivos o modulos fuera del alcance.

## Salud del sistema

- [ ] Cliente carga sin errores fatales.
- [ ] Functions objetivo estan saludables.
- [ ] RTDB responde dentro del umbral aprobado.
- [ ] No hay incremento anormal de errores o latencia.
- [ ] Auditoria recibe eventos esperados.

## Portal Publico

- [ ] Torneo publico abre por URL oficial.
- [ ] En Vivo, Programa, Competencias, Resultados y Sabana cargan.
- [ ] Live Feed converge con la fuente oficial.
- [ ] No aparecen rutas privadas ni datos operativos.

## Broadcast Studio

- [ ] Workspace carga contexto oficial.
- [ ] Preview y Program permanecen separados.
- [ ] Program Main y Announcer reciben proyecciones autorizadas.
- [ ] No hay mezcla de tenant, torneo, competencia o sesion.

## Firebase y Rules

- [ ] Lecturas autorizadas funcionan.
- [ ] Escrituras no autorizadas se rechazan.
- [ ] Namespaces server-only siguen cerrados.
- [ ] No se modificaron rutas deportivas fuera del manifest.
- [ ] IAM y Storage coinciden con la evidencia aprobada.

## Official Score Concurrency

- [ ] Publicacion autorizada funciona.
- [ ] Retry con misma idempotency key no duplica score.
- [ ] Revision obsoleta se rechaza.
- [ ] Ledger, historial y auditoria conservan integridad.

## Public Projection Recovery

- [ ] Commit oficial crea outbox.
- [ ] Worker publica la proyeccion.
- [ ] Retry no duplica.
- [ ] Dead-letter y recovery permanecen operativos.
- [ ] Portal converge despues de recovery.

## Backup y Restore

- [ ] Backup posterior al deploy completa y verifica checksum.
- [ ] Catalogo y auditoria registran el backup.
- [ ] Restore preflight puede validar el archivo.
- [ ] No se ejecuta Restore productivo sin incidente y autorizacion.

## Configuration Management

- [ ] Baseline carga y valida checksum.
- [ ] Version efectiva es la declarada.
- [ ] Jerarquia no mezcla organizaciones.
- [ ] CAS e idempotencia funcionan.

## Cierre

- [ ] No hay hallazgos criticos abiertos.
- [ ] Evidencia archivada.
- [ ] Rollback window cerrada por responsable.
- [ ] Release marcado `completed` mediante revision esperada.
