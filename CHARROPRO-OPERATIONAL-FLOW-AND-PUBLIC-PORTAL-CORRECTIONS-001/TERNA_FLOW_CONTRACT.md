# Contrato de flujo de Terna

## Transicion despues de publicar

La transicion ocurre solo despues de una publicacion oficial confirmada. La sesion normalizada determina la siguiente suerte:

- Sin historial: Cabecero.
- Ultima oportunidad `HEAD`: Pial en el Ruedo.
- Ultima oportunidad `PIAL`: Cabecero.
- Sesion completa o cerrada: siguiente contexto resuelto por Flow Engine.

La transicion conserva torneo, competencia, charreada, equipo, `ternaSessionId`, `sharedOpportunityId`, `sharedSequenceNumber`, `sharedTimerId`, participante, historial y Attempt V2.

## Fallos y pendientes

- Fallo de publicacion: no cambia suerte, sesion ni oportunidad.
- Pending Review: no consume oportunidad y conserva Exact Return.
- Una reserva de publicacion activa bloquea el cierre anticipado.

## Cierre anticipado

`Finalizar Terna` requiere al menos una oportunidad oficial consumida, ninguna publicacion activa y ningun Pending Review de la sesion.

El cierre:

1. Finaliza Timer Authority mediante la operacion oficial `FINISH` cuando corresponde.
2. Registra `closure.type = EARLY_FINISH` con actor, fecha y fuente.
3. Marca oportunidades restantes como `CLOSED_UNUSED`.
4. Conserva el historial publicado.
5. Avanza con `advanceAfterCompletedTernaSession()`.

`CLOSED_UNUSED` no es score, cero, DQ ni intento fallado. No crea `publishedScores` ni una sexta oportunidad.
