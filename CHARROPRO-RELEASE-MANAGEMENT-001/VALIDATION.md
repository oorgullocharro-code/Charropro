# Validacion

## Alcance

- Rama auditada: `main`.
- HEAD inicial: `3e74a396f15cb32c3eff2adf178590b14948fef5`.
- `origin/main` inicial: `78a51f23ae1f2b13e48667041048b9624f57d6ae`.
- Estado inicial: limpio y sin staging.
- Push: no ejecutado.
- Deploy: no ejecutado.
- Firebase productivo: no utilizado.

## Arquitectura validada

Se comprobo:

- politica versionada y validable;
- SemVer con precedencia de prerelease;
- release y build IDs deterministas;
- manifest serializable e inmutable;
- checksum SHA-256 canonico;
- changelog estructurado y estable;
- matriz de compatibilidad para cliente, Functions, Firebase y schemas;
- gates criticos con evidencia tipada;
- fallo cerrado ante gates pendientes, bloqueados, fallidos o evidencia incompleta;
- CAS por `expectedRevision`;
- idempotencia por clave y fingerprint de operacion;
- transiciones de estado allowlist;
- deploy secuencial;
- checklist post-deploy obligatorio;
- rollback sin borrado de datos o historicos;
- auditoria por release, actor, fecha, commit, estado, resultado y evidencia.

## Seguridad validada

- Funciones, simbolos y BigInt rechazados.
- Ciclos y accessors rechazados.
- `__proto__`, `constructor` y `prototype` bloqueados.
- Claves de secretos bloqueadas.
- Limites de profundidad, nodos, arreglos, objetos y strings.
- Numeros no finitos rechazados.
- Valores falsy validos preservados.
- Mutaciones fallidas atomicas.
- Modificar un manifest invalida su checksum.

## Gates externos

La suite demuestra el contrato de los gates con fixtures aislados. No sustituye evidencia de una liberacion real.

Antes de un deploy, el candidato debe adjuntar evidencia real y autorizada de:

- backup pre-deploy verificado;
- restore en target aislado;
- Rules y flujos en Firebase Emulator o proyecto demo;
- revision IAM;
- revision Storage;
- seguridad y auditoria del commit congelado.

`firebase.json` no configura actualmente Emulator. El motor no interpreta esta ausencia como aprobacion.

## Comandos

```text
node --check tools/release/releaseEngine.js
node --check tests/release-management.test.mjs
node tests/release-management.test.mjs
for file in $(find js functions tools tests -type f \( -name '*.js' -o -name '*.mjs' \) -not -path 'functions/node_modules/*' | sort); do node --check "$file"; done
for test_file in tests/*.test.mjs; do node "$test_file"; done
node -e "const fs=require('fs'); for (const file of process.argv.slice(1)) JSON.parse(fs.readFileSync(file,'utf8'));" firebase.json firebase-rules-auditoria.json functions/package.json functions/package-lock.json functions/configuration.defaults.json tools/release/releasePolicy.json
git diff --check
git diff --cached --check
```

## Resultado

Los resultados finales se registran en `TEST_RESULTS.md`. No existe UI ni operacion remota nueva que requiera validacion visual o contra produccion.
