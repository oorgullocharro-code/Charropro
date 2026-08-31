# Recommended Tickets

## 1. CHARROPRO-OFFICIAL-RANKING-AUTHORITY-AND-PUBLIC-PARITY-001

Prioridad: P1. Commercial blocker: YES.

Objetivo:

- definir autoridad canónica para ranking agregado de torneo/competencia;
- preservar posiciones oficiales publicadas y parciales claramente marcados;
- certificar empates y desempates sin recalculo del Portal;
- proyectar paridad a Portal, Top 10, grafico ranking y modalidades individuales;
- validar Caladero y Coleadero;
- evitar filas duplicadas por charreada cuando la vista solicita ranking global.

## 2. CHARROPRO-PRECOMMERCIAL-PHYSICAL-OPERATIONS-CERTIFICATION-001

Prioridad: P1. Commercial blocker: YES.

Objetivo:

- ejecutar un torneo TEST completo sin escrituras oficiales reales;
- validar Portal poblado en vacio/activo/finalizado/stale/reconnect;
- recorrer las diez suertes con juez en desktop, 1366x768, 1280x720 e iPad;
- observar marcador, ranking, ambos timers, Cala y Coleadero simultaneamente;
- recorrer Supervisor: crear, editar, activar, asignar juez, cambiar charreada y
  reload;
- registrar defectos; no corregirlos dentro de la certificacion.

## 3. CHARROPRO-FUNCTIONS-PRODUCTION-DEPLOY-ALLOWLIST-001

Prioridad: P1. Commercial blocker: YES.

Objetivo:

- convertir las 10 Functions productivas en manifest/allowlist canonico;
- hacer que el comando normal de deploy use exactamente ese conjunto;
- impedir que una exportacion fuente no aprobada se cree accidentalmente;
- agregar diff local/remoto y gate de STOP antes de deploy.

## 4. CHARROPRO-FUNCTIONS-DEPENDENCY-PINNING-001

Prioridad: P2. Commercial blocker: NO.

Objetivo:

- reemplazar `latest` por rangos/versiones revisadas compatibles con lockfile;
- ejecutar Emulator Node22 y canary de las diez Functions;
- no mezclar actualizacion funcional ni cambio de generacion.

## Orden Recomendado

1. Ranking authority/parity.
2. Functions deploy allowlist.
3. Physical operations certification.
4. Dependency pinning.

Si los tres primeros quedan aprobados, continuar con la Master Precommercial
Audit para obtener la cifra certificada de readiness.
