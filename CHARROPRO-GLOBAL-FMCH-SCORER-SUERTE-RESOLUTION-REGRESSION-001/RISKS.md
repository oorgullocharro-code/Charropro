# Risks

## Riesgos mitigados

- Vacio provisional retenido en primer load.
- Contaminacion entre torneos/charreadas.
- Etiquetas equivalentes de competencia por equipos.
- `competitionId` interpretado como enum sin validacion.
- Regresion de rendimiento por eliminar cache.

## Riesgos residuales

- La asignacion server-side sigue siendo requisito arquitectonico; una falla real de esa autoridad conserva correctamente el estado sin suertes.
- La validacion fisica de Safari/iPad solo puede cerrarla el usuario despues del deploy.
- El smoke productivo no publicara scores y no prueba el flujo de escritura deportiva.

## Limites

No se cambiaron Rule Profile, Rules, Functions, deporte, historicos ni Firebase Production.
