# Terna Role Transition Contract

## Derivación del rol

- Cabecero FAIL -> Cabecero.
- Cabecero SUCCESS -> Pial.
- Pial FAIL -> Pial.
- Pial SUCCESS -> Terna completada inmediatamente cuando Cabecero ya cuenta.

El rol se deriva de `headCounted` y `pialCounted`. No existe un estado paralelo ni alternancia por índice.

La fase se marca como lograda a partir de la selección base canónica de Attempt V2 (`scoring.baseSelection.selectedRuleId`) y su estado deportivo. No depende de que el total numérico sea mayor que cero. `NOT_ACHIEVED`, `ZERO` y `DQ` nunca completan la fase.

## Terminación deportiva

Las cinco oportunidades forman un máximo compartido, no una cuota obligatoria. Después de publicar cada oportunidad, la sesión se normaliza antes de reservar la siguiente:

- `headCounted && pialCounted` -> `COMPLETED`.
- `currentOpportunity` -> `null`.
- Las oportunidades restantes -> `CLOSED_UNUSED`.
- La historia consumida, sus referencias de score y el `sharedTimerId` permanecen intactos.

El scorer ejecuta entonces la transición canónica de Terna completada del Flow Engine. El CTA previo a una publicación que completará ambas fases muestra `Guardar -> Finalizar Terna`; no anuncia un contexto adicional inexistente.

## Validación

Una oportunidad nueva cuyo tipo no coincide con el rol derivado se rechaza con `terna-role-state-mismatch`. Las correcciones históricas conservan su ruta idempotente existente.

## Contratos preservados

- Pool único de cinco oportunidades compartidas.
- Mismo `sharedTimerId` para Cabecero y Pial.
- Semántica `CLOSED_UNUSED` aplicada solo a las oportunidades restantes.
- Attempt V2 y publicación oficial sin cambios.
- El timer no se reinicia al cambiar de rol.
