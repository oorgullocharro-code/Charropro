# Current Timer Context

`OfficialCurrentTimerContext 1.0.0` es una proyeccion serializable derivada de Timer Authority y el contexto deportivo vigente.

Incluye identidad de torneo, competencia, charreada, perfil, politica temporal, fase, suerte, equipo, participante, caballo, intento, oportunidad, coleador, timer y definicion. Incluye tambien duracion, modo, estado, anclas temporales, elapsed/remaining y revisiones de timer, fuente y contexto.

No contiene DOM, listeners, callbacks, runtime ni referencias mutables. `officialTimers` sigue siendo la fuente autoritativa; `currentTimerContext` identifica cual registro gobierna la operacion actual.
