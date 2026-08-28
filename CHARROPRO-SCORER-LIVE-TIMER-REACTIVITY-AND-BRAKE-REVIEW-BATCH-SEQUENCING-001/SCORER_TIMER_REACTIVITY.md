# Scorer Timer Reactivity

El Scorer consume una sola derivacion de `officialTimers` y `currentTimerContext`.

- START remoto: cambia a RUNNING e interpola sin refresh.
- PAUSE remoto: congela el valor canonico.
- RESUME remoto: continua desde la revision aceptada.
- FINISH remoto: muestra FINISHED y el valor final.
- Timer A -> Timer B: reemplaza identidad y desmonta la presentacion anterior.
- Una revision de `live/current` igual o mayor vence a un registro local stale.
- Una revision regresiva no reemplaza una revision mas nueva.

Prueba DOM real: `20.0 -> 19.0 -> 18.0` sin reconstruccion por tick. La cobertura de 100 ticks confirma cero escrituras Firebase y cero renders globales por tick.
