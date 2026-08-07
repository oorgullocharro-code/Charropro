# Flujo actual de score oficial y calificacion cantada

## Flujo implementado

1. El juez selecciona jornada, participante/equipo, suerte y oportunidad.
2. La UI modifica el borrador de intento en estado local.
3. Base, adicionales, malos, tiempo, punta, cero y penalizaciones se agregan al mismo
   intento o coleccion de intentos.
4. Guardar y siguiente ejecuta nextScore().
5. Si el intento esta vacio, markAttemptZeroIfBlank() deja constancia de cero no logrado.
6. buildPublishedScoreSnapshot() clona el intento, el total y su breakdown.
7. publishOfficialScoreForContext() valida jornada activa y publica mediante el flujo
   atomico existente.
8. Una correccion posterior del mismo attemptKey conserva el registro anterior como
   superseded/historical y mantiene el nuevo como vigente.
9. Solo con exito se libera el borrador y se avanza el puntero.

## Comparacion con operacion cantada

| Etapa deportiva | Equivalente actual | Diferencia documentada |
| --- | --- | --- |
| Captura | Borrador local editable. | No se observaron pantallas autenticadas en esta auditoria. |
| Confirmacion entre jueces | Validacion de jornada y publicacion oficial. | No hay estado explicito multi-juez de confirmacion en el flujo revisado. |
| Calificacion cantada | Publicacion oficial confirmada y avance. | La semantica de anuncio oral no es entidad persistida separada. |
| Refutacion/correccion | Nueva revision con registro previo superseded. | Flujo/rol de refutacion requiere prueba autenticada y validacion operativa. |

No se propuso ni implemento un estado nuevo. Esta es una descripcion del comportamiento
actual comprobado por fuente y ejecucion local de historial.
