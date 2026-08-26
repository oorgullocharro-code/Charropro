# Brake Review UI

La superficie del scorer prioriza tres preguntas: quien se revisa, cuanto tiempo lleva y que determino el juez.

Muestra torneo, charreada, equipo, presentador, caballo cuando existe, estado y cronometro oficial. Las acciones principales son `AUTORIZADO`, `PUNTOS MALOS / INFRACCION` y `DESCALIFICACION`.

Los selectores se alimentan de las reglas canonicas con `phaseId = freno_review` del perfil `0.6.1`; no contienen una lista deportiva duplicada. Las reglas temporales objetivas se excluyen de la seleccion manual.

El control remoto conserva equipo, competidor y caballo, y etiqueta el contexto como `Revision de freno`, no `Cala`.

La maquetacion es mobile-first y mantiene acciones grandes, cronometro dominante y estados de protocolo compactos. La comprobacion fisica final queda pendiente para telefono, iPad y desktop con un torneo Emulator `0.6.1`.
