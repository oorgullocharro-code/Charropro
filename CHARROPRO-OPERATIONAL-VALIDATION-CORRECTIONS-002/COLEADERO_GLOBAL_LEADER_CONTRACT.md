# Coleadero Global Leader Contract

## Fuente canónica

El indicador consume `state.publishedScores`, filtra la charreada y la suerte Colas, descarta registros históricos o superseded y conserva la revisión activa más alta por `attemptKey`.

## Identidad

Se prefiere `participantId` o `competitorId`. Cuando el modelo publicado no los contiene, la identidad de participación se forma con `teamId` y `coleadorIndex`. El nombre visible nunca es la clave de agrupación.

## Total

Se suma directamente `score.total`, el valor oficial ya publicado. No se vuelven a ejecutar reglas deportivas.

## Scope y momento

El scope es toda la charreada. El resumen aparece únicamente al guardar la última oportunidad del último coleador del último participante de Colas, antes del avance a Toro.

## Empates

No existe un desempate canónico para este indicador. Todos los coleadores con el total máximo se devuelven como ganadores y la UI declara el empate explícitamente.
