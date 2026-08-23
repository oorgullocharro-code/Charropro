# Terna Validation

El tipo de remate proviene exclusivamente de:

`Attempt V2.sportState.remate.remateId/remateLabel`.

El fallback anterior a `classificationLabel` fue eliminado. La salida distingue en el fixture `Floreado` y `Corvero derecho`; no resuelve identidad por cantidad de puntos.

Para un intento logrado sin `remateId`, el snapshot bloquea con `official-format-terna-remate-source-missing:{attemptKey}`. Un intento no logrado puede conservar la casilla vacía sin inventar un remate.

El tiempo compartido se representa desde la última evidencia oficial congelada de la sección.
