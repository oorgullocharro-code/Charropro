# CHARROPRO-OFFICIAL-FIELD-TIMER-RESPONSIVE-DISPLAY-RECOVERY-001

## Dictamen tecnico

APROBADO PARA PUBLICACION. La validacion fisica permanece pendiente.

## Causa raiz

`cronometro-pantalla.html` reutilizaba el formatter compartido `MM:SS.d`, por lo que mostraba minutos innecesarios como `-00:14.4`. Ademas, el reloj usaba un tamano basado en viewport con un minimo grande y la linea de contexto imponia un ancho minimo al grid en mobile.

## Correctivo

- Formatter exclusivo de la salida oficial de campo: segundos bajo un minuto y `MM:SS.d` a partir de un minuto.
- Tipografia container-aware con variantes para segundos y minutos.
- Contexto con ancho flexible para no forzar scroll horizontal.
- Timer Authority, scoring, politica temporal y salida OBS permanecen intactos.

## Build

`20260831-official-field-timer-responsive-display-recovery-001-v1`

## Estado

`TECHNICALLY_APPROVED_PENDING_DEPLOY_AND_PHYSICAL_FIELD_TIMER_DISPLAY_VALIDATION`
