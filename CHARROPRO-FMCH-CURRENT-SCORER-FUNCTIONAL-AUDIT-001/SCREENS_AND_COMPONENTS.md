# Pantallas y componentes del calificador

| Area | Funcion / archivo | Datos y acciones |
| --- | --- | --- |
| Cabecera | renderScoringHeader, renderScoringContextBar | Jornada, turno, equipo/participante, suerte y contexto. |
| Oportunidades | renderScoringOpportunityBar, renderAttemptSummaryButton | Seleccion y resumen de intento; muestra total y desglose. |
| Cala | renderCalaMainPanel, renderCalaPuntaSection, renderCalaAdicGroup | Metros, marcas/piquetes, punta automatica y grupos de adicionales. |
| Piales / manganas | renderAttemptMainPanel | Tres oportunidades, total activo y botonera comun. |
| Coleadero | renderColeaderoMainPanel | Selector de coleador, tres pasadas y total por coleador. |
| Toro / yegua | renderJineteoMainPanel | Base, adicionales y deducciones mediante botonera. |
| Terna | renderTernaMainPanel | Lazo, pial y tiempo mediante dos suertes relacionadas. |
| Paso | renderPasoMainPanel | Base, adicionales, tiempo e infracciones mediante botonera. |
| Acciones | renderScoringActionAccordions | Base, adicionales, infracciones, infracciones de equipo y descalificaciones. |
| Tiempo / evidencia | js/app.js:9082-9211 | Tiempo, nota y lista de evidencia de tiempo. |
| Pie | renderScoringBottomBar | Guardar/publicar y navegacion de calificacion. |

## Estados y validaciones observados

- guardUnlockedCharreada() protege cambios de una jornada cerrada.
- toggleAttemptZero() solo permite cero cuando el intento no tiene valor deportivo.
- toggleRule() trata base como seleccion exclusiva y adicionales/infracciones como
  acumulables.
- nextScore() bloquea doble publicacion con officialPublishInProgress y solo avanza
  tras recibir exito de la publicacion oficial.
- La vista visual autentificada no fue ejecutada por el bloqueo de runtime local descrito
  en SCORER_ENTRYPOINTS.md.
