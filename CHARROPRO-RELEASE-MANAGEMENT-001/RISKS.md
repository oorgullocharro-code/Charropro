# Riesgos

## Bloqueos actuales para el primer release CSP-M1

### Commits locales no publicados

`origin/main` permanece en `78a51f23ae1f2b13e48667041048b9624f57d6ae`, mientras `main` contiene los P0 locales. Un candidato futuro debe congelar el rango completo y verificar el commit final; no debe desplegar desde referencias parciales.

### Emulator no configurado

`firebase.json` declara Database Rules y Functions, pero no una seccion de Emulator. Las pruebas actuales usan contratos puros y adapters falsos. Antes de produccion debe existir evidencia de Rules y flujos ejecutados contra Emulator o proyecto demo aislado.

### IAM y Storage requieren evidencia externa

El repositorio no puede probar por si solo roles IAM efectivos, retencion del bucket, acceso a objetos, reglas de Storage o recuperabilidad regional. Esos gates permanecen bloqueados hasta una revision autorizada.

### No existe CI central

No hay workflow de CI ni `package.json` raiz. Las suites se ejecutan como archivos Node individuales. El proceso es reproducible, pero depende de que un runner autorizado ejecute todos los comandos y adjunte evidencia. Automatizarlo es una mejora futura; no se agrega una dependencia ni plataforma en este ticket.

### Documentacion historica legacy

`README.md` y `DESPLIEGUE_CHARROPRO.md` conservan instrucciones antiguas, ejemplos de Rules abiertas y rutas de carpetas anteriores. Son evidencia historica, no politica oficial. `RELEASE_PROCESS.md` y `DEPLOY_SEQUENCE.md` pasan a ser la referencia del proceso futuro sin reescribir documentos fuera del alcance.

### Versiones de aplicacion historicas

El baseline de Configuration Management conserva el app marker aprobado por el P0 anterior. Este ticket no lo cambia. Un release real debe declarar version de producto SemVer, versiones de modulo y app marker por separado, sin mezclar cache-busters con identidad del release.

### Rollback de datos

El rollback de software no implica restaurar datos. Restore se usa solo si una validacion demuestra corrupcion y existe autorizacion explicita. Restaurar por reflejo puede perder operaciones validas posteriores al deploy.

## Riesgo residual aceptado

El motor es local y puro. No bloquea por si mismo un comando manual ejecutado fuera del proceso. La proteccion operativa depende de que las credenciales de deploy y las revisiones de repositorio exijan un manifest `approved` y evidencia valida. Esa integracion organizacional queda fuera de este ticket.
