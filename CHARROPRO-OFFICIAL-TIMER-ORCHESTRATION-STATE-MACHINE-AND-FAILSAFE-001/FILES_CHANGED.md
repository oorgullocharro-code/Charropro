# Files Changed

## Dominio y transporte

- `js/core/officialTimerOrchestration.js`: contrato current, seleccion determinista, historial, Piales y handoff Toro/Terna.
- `js/core/timerRules.js`: identidad caballo/intento y eliminacion de precedencia historica.
- `js/core/state.js`: estado current acotado por torneo.
- `js/core/sync.js`: proyeccion current y resolucion Piales canonica.
- `js/core/firebaseSync.js`: publicacion atomica de la proyeccion live tras Timer Authority.

## Consumidores

- `js/app.js`: Scorer, permisos de consecuencia y handoff.
- `js/views/cronometro-control.js`: control fisico e historial.
- `js/views/cronometro-pantalla.js`, `js/views/grafico.js`, `js/views/obs.js`: paridad current.
- `css/styles.css`: boton secundario e historial colapsado.

## Pruebas

- `tests/official-timer-orchestration-state-machine.test.mjs`.
- `tests/official-timer-lifecycle-reuse.test.mjs`.
- `tests/pre-cala-brake-review-timer-context-blocker-003.test.mjs`.

Los archivos de versionado mecanico se registran en el diff final del build.
