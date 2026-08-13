# Timer UI and Transition Audit

## Autoridad preservada

La UI consume el Timer Engine y Timer Authority existentes. Cada pantalla presenta la cuenta oficial en la cabecera y mantiene en el cuerpo solo los comandos autorizados de control, takeover y handoff. No existe un segundo estado temporal.

## Toro a Terna

**Estado: BLOCKED para automatización atómica.**

El contrato vigente permite múltiples contextos temporales simultáneos y no expone una acción atómica `Toro fuera · iniciar Terna` gobernada por perfil. Implementarla aquí habría modificado política deportiva/temporal. La UI elimina la duplicación visual, pero no inventa la transición. Debe resolverse en un ticket de política temporal usando Timer Authority, idempotencia y auditoría.

## Yegua a Manganas

**Estado: PASS.**

Finalizar Yegua no inicia Manganas. El timer de Manganas permanece `READY` hasta el comando manual autorizado.

## Paso de la Muerte

**Auditoría: PASS. Política de no solape: BLOCKED.**

- Existen los contextos oficiales de Salida 3:00 y Desmonte 1:00.
- Desmonte requiere inicio manual.
- La UI no dispara uno al operar el otro.
- El motor actual no impide que ambos lleguen a correr simultáneamente; por tanto, `PASO TIMER OVERLAP: YES` como capacidad actual.
- No se añadió una restricción porque el ticket ordena documentar la diferencia antes de cambiar contrato temporal.

## Duplicación

Las diez pantallas muestran cero `timer-display`, `official-timer-display` o `terna-timer-display` duplicados dentro de `.scoring-main`. Paso conserva dos tiles en cabecera porque son contextos oficiales distintos.
