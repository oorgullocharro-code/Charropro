# Local Reset and Seed Audit

## Comandos auditados

`tools/development/charropro-development.mjs` expone:

- `emulators:start`;
- `local:seed`;
- `local:reset --confirm`.

Los comandos fijan el proyecto `demo-charropro-local` y los hosts Emulator 127.0.0.1 para Auth, RTDB, Functions y Storage. El seed bloquea expresamente el marcador `charropro-e8a68`.

## Comportamiento de reset

`local:reset --confirm`:

1. elimina el namespace local `charropro` del Emulator;
2. elimina usuarios sinteticos conocidos;
3. recrea usuarios `@example.test`;
4. escribe el fixture sintetico;
5. no consulta ni escribe Firebase Production.

El reset no transforma Denver ni cambia su perfil: al borrar el namespace local, Denver deja de existir. El Denver auditado fue creado posteriormente mediante la UI.

## Comportamiento de seed

`createLocalRuntimeSeedFixture()` crea:

- torneo `demo-local-fmch-2026`;
- charreada `demo-local-fmch-jornada-1`;
- tres equipos sinteticos;
- usuarios sinteticos;
- `FMCH_2026_LIBRE 0.6.0` embebido como copia local `active`;
- metadata `fixtureOnly: true`, `activationReady: false`, `environment: local-emulator`.

No carga un catalogo legacy. La resolucion se hace desde el mismo perfil y los mismos catalogos canónicos del producto.

## Cambio realizado

El seed ahora reutiliza `buildLocalFmch2026RuleProfileAssignment()` en lugar de repetir manualmente la construccion de la copia local. Esto reduce drift entre:

- torneos sinteticos del seed;
- torneos creados por UI en Emulator;
- recuperacion local al crear una charreada nueva.

La identidad, version, valores deportivos y bloqueos del perfil no cambiaron.
