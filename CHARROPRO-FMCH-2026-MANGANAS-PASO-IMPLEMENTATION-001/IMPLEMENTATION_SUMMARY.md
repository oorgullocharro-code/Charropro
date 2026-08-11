# CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001

## Resumen

Se implementaron Manganas a Pie, Manganas a Caballo y Paso de la Muerte sobre la arquitectura aprobada de Rule Profile, Attempt V2, Timer Engine, publicación oficial y componentes responsivos. No se creó un motor deportivo ni una autoridad temporal paralela.

## Resultado técnico

- Manganas a Pie: tres oportunidades, remate identificado, floreo total rápido, detalle opcional inline, tirones, adicionales, infracciones, infracciones al equipo, DQ y timer de siete minutos.
- Manganas a Caballo: tres oportunidades, catálogo de remates, historial, floreo total rápido, detalle opcional inline, tirones, adicionales, infracciones, infracciones al equipo, DQ y timer independiente de siete minutos.
- Paso de la Muerte: primera y segunda vuelta, distancia Libre, reglas dinámicas por clasificación, resultado explícito, DQ y timers independientes de tres y un minuto.
- Attempt V2 conserva remate, floreo, tirones, vuelta, resultado, clasificación, reglas resueltas y tiempos oficiales.
- El perfil `FMCH_2026_LIBRE` avanza de `0.5.0` a `0.6.0`, permanece `draft` y no está listo para activación productiva.

## Compatibilidad

- Los históricos no se recalculan.
- El adapter legacy sigue aceptando intentos anteriores sin los campos 2026.
- El total de floreo se mantiene exportable aunque no exista detalle individual.
- La publicación oficial conserva el flujo draft -> official -> audit -> avance posterior al éxito.
- No se modificaron deportivamente Cala, Piales, Coleadero, Toro, Yegua ni Terna.

## Alcance operativo

La validación visual se realizó en el cliente real LOCAL / EMULATOR con datos sintéticos. Se comprobó que los controles deportivos aparecen antes del contenido auxiliar, que el detalle de floreo permanece dentro de la misma pantalla y que no existe scroll horizontal en desktop, iPad landscape ni iPad portrait.

## Restricciones respetadas

- Firebase Production Writes: 0.
- Deploy: no.
- Push: no.
- Activación productiva del perfil: no.
- Recalculo histórico: no.
- Nuevo Timer Engine: no.
- Pending Score Review: no implementado.
