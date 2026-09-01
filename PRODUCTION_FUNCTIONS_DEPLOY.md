# Deploy Seguro de Functions Productivas

La fuente canónica es [productionFunctionsAllowlist.json](tools/release/productionFunctionsAllowlist.json). Una exportación presente en `functions/index.js` no queda autorizada automáticamente para Producción.

## Preflight y simulación

Desde `functions/`:

```bash
npm run deploy:preflight
npm run deploy:dry-run
```

El preflight consulta el inventario de Producción en modo lectura y falla si los exports, la allowlist, la región, la generación, el runtime o el estado difieren del contrato. El dry-run no conecta con Firebase ni despliega; enumera los diez targets autorizados que usaría.

## Deploy autorizado

Tras gates aprobados y autorización explícita:

```bash
npm run deploy
```

El wrapper vuelve a consultar el inventario, valida el contrato y ejecuta exclusivamente los targets enumerados por la allowlist. Nunca usar en Producción `firebase deploy`, `firebase deploy --only functions` ni una lista manual de targets.

## Agregar o retirar una Function

Una Function nueva exige un cambio revisado en Git de `tools/release/productionFunctionsAllowlist.json`, las pruebas del guardrail y la documentación de producción. El preflight bloquea cualquier export que no esté clasificada expresamente como autorizada o excluida.

Para retirar una Function, primero se requiere un ticket de lifecycle que autorice su baja en Producción; después se actualizan el inventario remoto y la allowlist en una transición auditada. No retirar una entrada del manifiesto para provocar una eliminación implícita.

## Interpretación de bloqueos

- `repository-export-contract-drift`: se agregó, eliminó o reclasificó una export sin decisión explícita.
- `production-function-inventory-drift`: Producción difiere de las diez Functions, Gen2, `us-central1`, `nodejs22`, o `ACTIVE` esperados.
- `unauthorized-target-requested`: se solicitó un target fuera de la allowlist.
- `authorized-target-set-incomplete`: la solicitud no contiene exactamente las diez Functions autorizadas.

Todos los bloqueos son fail-closed: no se ejecuta Firebase CLI de deploy.
