# Proceso oficial de Release

## Principios

1. Un release se construye desde un commit y tree hash congelados.
2. El manifest es la fuente oficial de identidad, compatibilidad, gates y evidencia.
3. Ningun gate critico se aprueba por inferencia, documentacion previa o ausencia de errores.
4. El mismo artefacto validado es el que se despliega.
5. Cliente, Functions, Rules y configuracion conservan artefactos/versiones anteriores.
6. Todo cambio de estado usa revision esperada e idempotency key.
7. Ninguna version publicada se reescribe.
8. Ningun rollback elimina datos o historicos.

## Fase 1: planeacion

1. Definir alcance y tickets.
2. Clasificar cada cambio como `major`, `minor` o `patch`.
3. Registrar modulos y versiones independientes.
4. Declarar riesgos y breaking changes.
5. Construir matriz de compatibilidad.
6. Elegir ventana, responsables y autoridad de rollback.

## Fase 2: congelamiento

1. Confirmar rama autorizada.
2. Confirmar working tree y staging limpios.
3. Registrar commit, padres y tree hash.
4. Crear build inmutable desde ese commit.
5. Generar manifest `draft`.
6. Cambiar a `validating` mediante operacion CAS.

No se permite agregar commits al candidato congelado. Cualquier cambio crea otro build y otro ciclo de evidencia.

## Fase 3: validacion

Cada gate adjunta evidencia con identidad, resultado, fecha y responsable:

- suite completa y node checks;
- backup pre-deploy durable y checksum;
- restore validado en target aislado;
- baseline/configuracion validada;
- Emulator o proyecto demo no productivo;
- Firebase Rules y su hash exacto;
- IAM;
- Storage;
- todos los JSON;
- seguridad y secretos;
- auditoria tecnica.

El motor rechaza evidencia incompleta, revisiones obsoletas, reuso conflictivo de idempotency key y waiver de gates criticos.

## Fase 4: aprobacion

Solo se permite `validating -> approved` cuando todos los gates criticos estan en `passed` y su evidencia es valida. La aprobacion debe registrar actor autorizado y checksum final del manifest.

`approved` no significa desplegado. Significa que existe un candidato exacto autorizado para iniciar la secuencia.

## Fase 5: despliegue

Ejecutar `DEPLOY_SEQUENCE.md` paso por paso. Cada paso registra artefacto, revision, operador, timestamps y resultado. No iniciar un paso si el anterior no esta aprobado.

## Fase 6: verificacion

Despues del cliente, cambiar a `verifying` y ejecutar todo `POST_DEPLOY_CHECKLIST.md`. No cerrar por una sola prueba de humo.

## Fase 7: cierre

Un release pasa a `completed` solo cuando:

- todos los deploy steps estan `passed`;
- todos los post-deploy checks estan `passed`;
- no existen alertas criticas abiertas;
- el manifest conserva integridad;
- la evidencia esta archivada.

## Fallo y rollback

- Fallo previo a deploy: marcar `failed` o `cancelled`; no hay rollback remoto.
- Fallo durante deploy: detener pasos, marcar `failed` y decidir correccion o `rolling_back`.
- Fallo post-deploy: congelar rollout, evaluar impacto y ejecutar rollback controlado.
- Corrupcion de datos: no restaurar automaticamente. Activar Restore solo con evidencia y autorizacion.

## Responsabilidades

- Release Manager: mantiene manifest y secuencia.
- Technical Approver: valida arquitectura, pruebas y compatibilidad.
- Security Reviewer: valida IAM, Storage, Rules y secretos.
- Backup/Restore Operator: demuestra recuperabilidad.
- Deploy Operator: ejecuta exclusivamente artefactos autorizados.
- Auditor: confirma evidencia y cierre.

Una persona puede cubrir mas de un rol en entornos pequenos, pero cada accion debe conservar actor y evidencia.
