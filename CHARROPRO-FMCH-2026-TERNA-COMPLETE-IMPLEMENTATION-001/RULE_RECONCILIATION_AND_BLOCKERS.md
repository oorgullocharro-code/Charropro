# Reconciliacion de Reglas y Bloqueos

## Fuente

La implementacion usa `CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001` como fuente aprobada. El catalogo tecnico se identifica como `fmch_2026_terna_0.5.0`.

## Lazo Cabecero

Se reconciliaron:

- 4 reglas de base;
- 20 adicionales;
- 19 infracciones individuales;
- 15 causas de descalificacion;
- adicional automatico por tiempo oficial no utilizado;
- reglas repetibles y grupos mutuamente excluyentes.

No hay infracciones de equipo nuevas para Cabecero en el catalogo confirmado. Los identificadores legacy `lb1`, `la1-la6`, `li1-li3` y `ld1-ld2` se conservan deshabilitados para lectura historica.

## Pial en el Ruedo

Se reconciliaron:

- 15 reglas de base;
- 23 adicionales;
- 17 infracciones individuales;
- 3 infracciones al equipo;
- 21 causas de descalificacion;
- deteccion de remate repetido por lazador;
- adicional automatico por tiempo oficial no utilizado.

Los identificadores legacy `prb1`, `pra1-pra6`, `pri1-pri3` y `prd1-prd2` se conservan deshabilitados para historicos.

## Decisiones de compatibilidad

- El catalogo base del producto no se reescribe; la resolucion ocurre mediante Rule Profile.
- `FMCH_2026_LIBRE 0.4.0` se conserva y `0.5.0` agrega Terna.
- Los scores historicos no reciben migracion ni recalculo.
- Los FieldID existentes permanecen preservados.
- Attempt V2 congela el valor oficial y el identificador de oportunidad.

## Certificacion

No se encontro una regla puntual de Terna sin soporte en la especificacion aprobada. Por ello, la implementacion deportiva del alcance puede recibir `PASS` tecnico y deportivo.

La activacion del perfil en Produccion sigue bloqueada por proceso: `status: draft` y `activationReady: false`. Esto no es una deficiencia de Terna ni autoriza despliegue.

## Riesgos residuales

- La validacion final de una federacion sobre el perfil completo sigue siendo externa al software.
- El exportador oficial final no forma parte de este ticket.
- El flujo de score pendiente se implementara despues.
- El shell general del scorer en 390 px conserva una limitacion previa de altura util; Terna fue validada en los tres viewports exigidos: iPad landscape, iPad portrait y desktop.
- Smartwatch, control remoto, multi-juez y revision de video quedan diferidos.

## Bloqueos

Para el alcance implementado: ninguno.

Para activacion productiva del perfil: autorizacion y certificacion externa pendientes.
