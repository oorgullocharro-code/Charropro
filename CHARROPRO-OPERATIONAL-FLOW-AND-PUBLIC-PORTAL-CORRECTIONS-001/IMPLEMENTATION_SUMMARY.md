# CHARROPRO-OPERATIONAL-FLOW-AND-PUBLIC-PORTAL-CORRECTIONS-001

## Resultado

Se corrigieron los dos bloques autorizados sin modificar reglas deportivas, Rule Profile, Attempt V2, calculos oficiales ni la arquitectura de publicacion.

## Terna

- La siguiente suerte se deriva de la sesion canonica de Terna despues de una publicacion oficial exitosa.
- Cabecero cambia automaticamente a Pial cuando corresponde.
- Una publicacion fallida o un Pending Review no consume ni avanza la oportunidad.
- `Finalizar Terna` cierra explicitamente las oportunidades restantes como `CLOSED_UNUSED`.
- El cierre no crea score, cero ni DQ y avanza mediante el Flow Engine existente.
- Timer Authority existente ejecuta `FINISH` cuando el calificador tiene control autorizado.

## Portal Publico

- La proyeccion publica construye un unico `accumulatedTotal` desde scores oficiales publicados.
- `totalStatus` distingue `partial` de `final`.
- `provisionalPosition` ordena parciales dentro del mismo alcance sin agregar regla deportiva de desempate.
- Inicio, Rankings, Resultados, Sabana y En Vivo consumen los mismos campos normalizados.
- Los IDs oficiales `lazo` y `pial_ruedo` se proyectan por separado como `LC` y `PR`.
- El frontend no interpreta reglas, infracciones, DQ ni Attempt V2.

## Version

`20260813-operational-flow-public-portal-corrections-001-v1`

FMCH_2026_LIBRE permanece en `0.6.0`.
