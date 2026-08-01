# CHARROPRO-RELEASE-MANAGEMENT-001

## Resultado

Se implemento Release Management Engine v1.0.0 como infraestructura pura y desacoplada para gobernar releases futuros de CharroPro. Este ticket no publica un release, no hace push y no despliega infraestructura.

## Arquitectura

```text
releasePolicy.json
  -> Release Engine
  -> Release Manifest inmutable
  -> Gates con evidencia
  -> Deploy Plan ordenado
  -> Post Deploy Validation
  -> Complete o Rollback auditable
```

El motor vive en `tools/release/releaseEngine.js` y la politica canónica en `tools/release/releasePolicy.json`. El modulo no importa Firebase, no abre red, no ejecuta comandos y no escribe archivos. Recibe definiciones y evidencia, valida, genera snapshots inmutables y rechaza transiciones no autorizadas.

## Versionado

La estrategia oficial es Semantic Versioning:

- `MAJOR`: incompatibilidad en contratos publicos, datos o integraciones;
- `MINOR`: capacidad nueva compatible;
- `PATCH`: correccion compatible, seguridad o mantenimiento;
- prerelease: candidatos como `1.2.0-rc.1`;
- build metadata: identidad adicional no usada para precedencia.

Los contratos, schemas y modulos conservan sus propias versiones. El release las registra en la matriz de compatibilidad y no las reemplaza con la version del producto.

## Identidad e integridad

Un release contiene:

- `releaseId` determinista por version y commit;
- `releaseVersion` SemVer;
- `buildId` por version, fecha UTC y commit;
- commit y tree hash completos;
- autor, estado, revision y timestamps;
- modulos, tickets y changelog;
- compatibilidad de cliente, Functions, Firebase y schemas;
- gates, deploy plan, rollback plan y post-deploy checks;
- historial de operaciones y auditoria;
- checksum SHA-256 canonico.

Modificar cualquier campo invalida la integridad. Cada operacion valida `expectedRevision` e `idempotencyKey`, incrementa una sola revision y conserva `createdAt`.

## Gates

Los gates obligatorios son:

1. Fuente congelada.
2. Suite completa.
3. Backup valido.
4. Restore validado.
5. Configuration validada.
6. Firebase Emulator.
7. Firebase Rules.
8. IAM.
9. Storage.
10. JSON.
11. Seguridad.
12. Auditoria.

Todos son criticos. Ninguno puede omitirse o marcarse aprobado sin la evidencia minima definida por la politica. El gate de Emulator rechaza evidencia proveniente de produccion.

## Deploy y rollback

El orden oficial es congelar candidato, crear y verificar backup, desplegar Rules compatibles, desplegar Functions, activar configuracion versionada, publicar cliente, validar y monitorear.

El rollback detiene el rollout, reactiva el cliente anterior, publica una nueva revision de configuracion con valores anteriores, restaura Functions y Rules compatibles, alinea documentacion y valida integridad. No borra datos, versiones, auditoria o historicos.

## Seguridad

El motor:

- no muta entradas;
- rechaza funciones, simbolos, BigInt, ciclos, accessors y numeros no finitos;
- bloquea `__proto__`, `constructor` y `prototype`;
- limita profundidad, nodos, arreglos, objetos y strings;
- rechaza claves de secretos en manifiestos y evidencia;
- conserva `0`, `false`, `""` y `null`;
- usa allowlists para campos normalizados;
- no contiene operaciones de push o deploy.

## Estado real del primer release CSP-M1

La infraestructura queda preparada, pero no existe todavia un candidato autorizado para produccion. `origin/main` no incluye los cinco P0 locales y faltan evidencias remotas autorizadas de Emulator, IAM, Storage, backup pre-deploy y restore aislado. La politica mantendra ese candidato bloqueado hasta que todas existan.

## Compatibilidad

No se modificaron Public Projection Recovery, Official Score Concurrency, Backup Foundation, Restore Engine, Configuration Management, Portal Publico, Broadcast Studio, Firebase Sync, Rules ni comportamiento deportivo.
