# CHARROPRO-CONFIGURATION-MANAGEMENT-001

## Resultado

Se implementó Configuration Management Engine v1.0.0 como infraestructura única para configuración operativa versionada de CharroPro. El comportamiento deportivo y los contratos existentes permanecen intactos.

## Arquitectura

```text
configuration.defaults.json (baseline publicado y verificado)
  -> Configuration Engine (contrato, checksum, jerarquía, CAS)
  -> Configuration Service (autorización, resolución y auditoría)
  -> Firebase adapter (Admin SDK)
  -> charropro/configurationManagement
```

El baseline está en `functions/configuration.defaults.json`. Es la fuente canónica de:

- versión y ambiente del sistema;
- bootstrap web de Firebase;
- región y rutas RTDB compartidas;
- opciones de despliegue de Functions usadas por el entrypoint;
- timeouts y política de retry del entrypoint de Functions;
- namespaces preparados para aplicación, Broadcast, Portal, organización y federación.

El navegador carga el mismo archivo mediante `js/core/configurationBootstrap.js`, valida su SHA-256 y entrega a `firebaseSync.js` el SDK, proyecto, región y rutas. Functions valida el mismo documento antes de crear runtimes o registrar handlers.

## Jerarquía

La resolución aplica exactamente:

1. system
2. organization
3. tournament
4. user
5. session

Cada nivel reemplaza únicamente las claves declaradas. No hay fallback entre organizaciones ni tenants. Dentro de un mismo nivel se selecciona determinísticamente la mayor versión publicada.

## Contrato

Cada versión conserva:

- `configurationId`;
- `scope` y `scopeKey`;
- `version` y `parentVersion`;
- `createdAt` y `updatedAt`;
- `author`;
- `status`;
- `values`;
- `checksum` y `fingerprint` SHA-256;
- `previousChecksum`;
- metadata de migración opcional.

Las versiones publicadas no se sobrescriben. Una modificación crea la siguiente versión y conserva la anterior.
La cadena exige versión consecutiva, `parentVersion`, `previousChecksum`, `createdAt` estable y timestamps no regresivos.

## Escritura

`publishCharroProConfiguration` usa una transacción RTDB sobre la identidad configuración/alcance. Exige:

- usuario autenticado y activo;
- rol supervisor o administrador de plataforma;
- organización y tenant compatibles;
- acceso al torneo cuando aplica;
- `expectedVersion`;
- `idempotencyKey` válido.

Una revisión obsoleta se rechaza atómicamente. Repetir la misma solicitud devuelve el resultado previo; reutilizar la clave con otro contenido produce conflicto.
Los timestamps de publicación y auditoría proceden del runtime servidor; un cliente no puede imponer su reloj.

## Lectura

`getCharroProConfiguration` resuelve la jerarquía autorizada. Las lecturas críticas requieren supervisor o administrador de plataforma y generan evento de auditoría. Las rutas cliente de `configurationManagement` permanecen cerradas; el acceso es exclusivamente mediante Functions/Admin SDK.

## Seguridad

El motor:

- no muta entradas;
- rechaza funciones, símbolos, BigInt, ciclos, accessors y números no finitos;
- bloquea `__proto__`, `constructor` y `prototype`;
- limita profundidad, nodos, arreglos, claves y strings;
- rechaza claves de secretos como password, privateKey, tokens, credentials y signedUrl;
- conserva `0`, `false`, `""` y `null`.

La `apiKey` del baseline es la configuración pública del SDK web de Firebase que ya existía en `firebaseSync.js`; no es una credencial administrativa ni concede acceso por sí misma. No se agregaron llaves privadas, tokens ni secretos.

## Configuración que permanece en código

Antes de implementar se clasificaron excepciones técnicas:

- versiones de contrato, allowlists, límites de seguridad y catálogos deportivos son invariantes de código, no configuración operativa mutable;
- rutas de Official Score/Public Projection forman parte de contratos ya estabilizados y esos módulos estaban prohibidos por el ticket;
- expresiones de Firebase Rules no pueden importar el manifiesto runtime; sus identificadores fijos continúan como política de despliegue compilada;
- roots internos de Backup/Restore permanecen en sus motores porque ambos módulos estaban prohibidos;
- intervalos del cronómetro y reglas deportivas permanecen en código por la misma restricción;
- defaults visuales de Broadcast y Portal siguen sin aplicación dinámica porque el ticket excluye modificar esos módulos y excluye branding dinámico.

Los namespaces para Broadcast, Portal, organización y federación ya existen en el contrato. Su consumo dinámico deberá realizarse en tickets específicos, sin crear otra fuente de verdad.

## Persistencia

La estructura preparada es:

```text
charropro/configurationManagement/
  records/{scopeKey}/{configurationId}/
    headVersion
    versions/{version}
    requests/{idempotencyKey}
    audit/{auditId}
  audit/{organizationId}/{auditId}
```

No se escribió en Firebase, no se desplegaron Rules y no se ejecutaron migraciones.
