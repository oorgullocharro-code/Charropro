# Release Manifest Template

## Contrato

El manifest real se genera con `createRelease()` y se valida con `validateReleaseManifest()`. No debe editarse manualmente despues de sellarlo. Los campos `operations`, `audit`, `gates`, planes y checksum evolucionan unicamente mediante funciones controladas.

```json
{
  "releaseEngineVersion": "1.0.0",
  "schemaVersion": "charropro-release/1",
  "policyVersion": "1.0.0",
  "releaseId": "rel_1.0.0_COMMIT-CORTO",
  "releaseVersion": "1.0.0",
  "buildId": "build_1.0.0_FECHA-UTC_COMMIT-CORTO",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "status": "draft",
  "revision": 0,
  "author": {
    "uid": "ID-AUTOR",
    "name": "NOMBRE",
    "role": "release-manager"
  },
  "commit": {
    "hash": "SHA-COMPLETO",
    "shortHash": "SHA-CORTO",
    "treeHash": "TREE-SHA-COMPLETO",
    "parents": ["PARENT-SHA-COMPLETO"],
    "branch": "main",
    "clean": true
  },
  "compatibility": {
    "minimumVersion": "1.0.0",
    "targetVersion": "1.0.0",
    "client": {
      "minimumVersion": "1.0.0",
      "targetVersion": "1.0.0",
      "backwardCompatible": true
    },
    "functions": {
      "minimumVersion": "1.0.0",
      "targetVersion": "1.0.0",
      "backwardCompatible": true
    },
    "firebase": {
      "projectId": "PROJECT-ID",
      "sdkMinimumVersion": "12.13.0",
      "sdkTargetVersion": "12.13.0",
      "rulesHash": "SHA-256",
      "functionsRuntime": "nodejs20",
      "backwardCompatible": true
    },
    "schemas": [
      {
        "schemaId": "charropro-backup",
        "minimumVersion": "charropro-backup/1",
        "targetVersion": "charropro-backup/1",
        "backwardCompatible": true,
        "migrationRequired": false
      }
    ]
  },
  "modules": [
    {
      "moduleId": "core",
      "name": "CharroPro Core",
      "version": "1.0.0",
      "changeType": "minor"
    }
  ],
  "tickets": [
    {
      "ticketId": "TICKET-001",
      "title": "Titulo",
      "risk": "high",
      "breaking": false
    }
  ],
  "changelog": {
    "formatVersion": "1.0.0",
    "summary": "Resumen",
    "changes": [
      {
        "changeId": "cambio-001",
        "type": "added",
        "module": "core",
        "description": "Descripcion",
        "ticketId": "TICKET-001",
        "risk": "high",
        "breaking": false,
        "compatibilityNotes": "Compatible"
      }
    ],
    "breakingChanges": [],
    "riskSummary": {
      "high": 1
    }
  },
  "risks": [],
  "breakingChanges": [],
  "gates": [],
  "deployPlan": [],
  "rollbackPlan": [],
  "postDeploy": [],
  "operations": [],
  "audit": [],
  "integrity": {
    "algorithm": "sha256",
    "checksum": "SHA-256-CANONICO"
  }
}
```

## Estados

```text
draft -> validating -> approved -> deploying -> verifying -> completed
                    -> failed -> validating | rolling_back | cancelled
approved -> cancelled
deploying/verifying -> failed | rolling_back
rolling_back -> rolled_back | failed
```

## Evidencia de gates

La politica declara los campos minimos por gate. Un resultado `passed` sin todos esos campos es invalido. Los gates criticos no admiten `waived`.

## Integridad

El checksum usa SHA-256 sobre la representacion JSON canónica del manifest sin el bloque `integrity`. Alterar un modulo, ticket, gate, plan, evidencia, timestamp o evento invalida el checksum.

## Prohibiciones

- No incluir passwords, tokens, private keys, signed URLs o credenciales.
- No incluir funciones, listeners, objetos Firebase o datos no serializables.
- No reutilizar un `releaseId` para otro commit.
- No marcar `approved` o `completed` editando JSON.
- No usar esta plantilla como evidencia; el manifest debe ser generado y sellado por el motor.
