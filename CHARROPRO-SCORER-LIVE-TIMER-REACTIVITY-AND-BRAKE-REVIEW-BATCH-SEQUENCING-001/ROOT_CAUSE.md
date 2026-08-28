# Root Cause

## Timer del Scorer

El listener actualizaba registros de timer, pero conservaba una seleccion local anterior y no reconciliaba de forma unica `officialTimers` con la revision mas nueva de `live/current`. El estado canonico era visible despues de recargar, pero el consumidor montado no recibia la transicion discreta correcta.

La correccion introduce una reconciliacion compartida que selecciona el snapshot mas reciente, actualiza `currentTimerContext` y solo reconstruye la superficie ante cambio de timer, revision o estado. El ticker existente conserva la interpolacion DOM entre eventos.

## Brake Review

El avance individual reutilizaba el orden normal de Cala, por lo que una revision terminada podia saltar a Cala del mismo equipo. La fase carecia de una derivacion global del conjunto de presentaciones.

La correccion deriva una cola determinista desde los equipos de la charreada, conserva cada registro individual y bloquea Cala hasta completar todas las revisiones y el protocolo oficial.
