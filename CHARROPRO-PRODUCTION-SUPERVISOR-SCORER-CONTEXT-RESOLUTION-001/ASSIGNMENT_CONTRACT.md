# Assignment Contract

## Autoridad

| Elemento | Owner | Escritura | Lectura |
| --- | --- | --- | --- |
| Default productivo Libre | Configuration Management | Configuracion versionada | Productive Rule Profile Policy |
| Assignment de torneo | Tournament Rule Profile Assignment Authority | Callable server-side | Tournament state y scorer |
| Lifecycle de perfil | Rule Profile Lifecycle Authority | Callable server-side | Read Authority |
| Catalogo de suertes | Rule Profile Engine | Definicion certificada | Scorer resolution |

## Precedencia

1. La categoria/modalidad resuelve la politica productiva aplicable.
2. La politica determina `profileId` y `version` para la solicitud de asignacion.
3. La callable valida Auth, plataforma, revision, idempotencia y perfil activo.
4. El torneo persiste `ruleProfileAssignment` y campos espejo coherentes.
5. El scorer solo habilita captura cuando la asignacion y el perfil son coherentes.

El default productivo no es fallback silencioso del scorer. `PRODUCT_BASE` no se aplica cuando el torneo declara que requiere politica productiva.
