# Piales

SUERTES define Piales con tres oportunidades (js/data/suertes.js:20).
renderAttemptMainPanel() presenta una tarjeta por tiro y el total de la oportunidad
activa (js/app.js:7905). Base, adicionales, infracciones y descalificaciones se
seleccionan mediante la botonera comun; cada regla deja su identificador en applied y su
valor acumulado en el intento.

| Requisito | Evidencia | Estado |
| --- | --- | --- |
| Tres tiros | attempts: 3 y tres botones de oportunidad. | PRESENT |
| Buenos / malos | base + adic, infr, applied. | PRESENT |
| Total por tiro | calculateAttemptTotal(). | PRESENT |
| Oportunidad no ejecutada / cero | attempted, notAchieved, toggleAttemptZero(). | PRESENT |
| Total de suerte | calculateCollectionTotal(). | PRESENT |
| Publicacion | snapshot con attempt, total, breakdown, revision e historial. | PRESENT |

Los controles finales de la hoja FMCH se consideran DERIVABLE o AMBIGUOUS cuando no
tienen identidad propia en el modelo; la matriz conserva esa distincion.
