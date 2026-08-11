# Implementacion Completa de Terna FMCH 2026

## Alcance

Se implemento Terna como un dominio compartido formado por dos calificaciones oficiales independientes: Lazo Cabecero y Pial en el Ruedo. Ambas pantallas reutilizan el scorer, el Rule Profile Engine, Attempt V2, la publicacion oficial y el Timer Engine existentes.

No se creo un motor de calificacion, almacenamiento ni temporizacion paralelo. Tampoco se modificaron Manganas, Paso, el flujo de pendientes, Firebase Rules, Broadcast Studio, Portal Publico ni reglas deportivas de otras suertes.

## Sesion compartida

La sesion `ternaSession` se identifica por torneo, competencia, charreada y equipo. Conserva:

- cinco oportunidades compartidas y secuenciales;
- el lazador activo y su tipo `HEAD` o `PIAL`;
- historial comun y remates previos;
- un solo `sharedTimerId` de siete minutos;
- conteo independiente de cabeza y pial validos;
- estado y publicacion del adicional por tiempo no utilizado;
- revision y timestamps.

Una oportunidad se reserva antes de publicar, pero solo cambia a `CONSUMED` despues de una publicacion oficial exitosa. Un fallo deja el intento editable, no avanza secuencia y no consume oportunidad. La sexta oportunidad se rechaza.

## Calificacion

Cabecero y Pial conservan scores, participantes, reglas y congelamientos oficiales independientes. El cambio de pantalla no reinicia oportunidades, timer ni historial.

Se integraron catalogos FMCH 2026 para base, adicionales, infracciones, infracciones al equipo, DQ y reglas manuales. `Marcar 0` y DQ permanecen estados distintos. Evidencia y nota siguen el contrato del scorer existente.

## Timer

El Timer Engine comun ahora soporta contextos oficiales identificados por `timerId`, revision CAS y comandos `START`, `PAUSE`, `RESUME` y `FINISH`. El tiempo deportivo excluye pausas; el tiempo de pared y el motivo de pausa permanecen auditables.

Terna puede coexistir con el timer de apretalamiento de Toro porque cada contexto es independiente. El contrato queda preparado para un controlador remoto futuro, pero este ticket no implementa smartwatch ni control remoto.

## Perfil y compatibilidad

`FMCH_2026_LIBRE` avanza de `0.4.0` a `0.5.0`. La version `0.4.0` se conserva intacta y consultable. La nueva version permanece `draft`, con `activationReady: false`; no se activo en Produccion.

Los historicos no se recalculan. Los IDs legacy se conservan deshabilitados dentro del perfil y los FieldID existentes no se migran ni reinterpretan.

## Resultado

La implementacion tecnica y la reconciliacion deportiva del alcance de Terna quedan listas para validacion final. La activacion productiva del perfil permanece fuera del ticket.
