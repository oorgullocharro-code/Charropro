# Rule Profile Compatibility Matrix

| Superficie | Baseline sin profile | Profile de prueba | Resultado |
| --- | --- | --- | --- |
| Diez suertes | Mismo catalogo/orden/puntos | Solo cambia RuleID declarado | PASS |
| Calificador | `context.suerte.catalog` | Catalogo efectivo | PASS |
| Botonera | IDs legacy | `id` preservado, `ruleKey` adicional | PASS |
| Editor visual | Base general/convocatoria | Marca herencia de perfil | PASS |
| Convocatoria | Reemplazo por grupo | Precedencia superior | PASS |
| Adicional manual | Por intento | Fuera del profile | PRESERVADO |
| Infraccion manual | Por intento | Fuera del profile | PRESERVADO |
| Team penalties | Canal separado | Categoria `team_infr` preparada | PRESERVADO |
| DQ | `desc` explicita | Categoria `desc` explicita | COMPATIBLE |
| Punta Cala | Calculador existente | `specialized_calculator` | COMPATIBLE |
| Timer | Componente existente | Solo metadata futura | COMPATIBLE |
| Opportunities | Intentos existentes | Solo metadata futura | COMPATIBLE |
| Scoring formulas | Sin cambio | Sin cambio | PASS |
| Draft local | Sin cambio | Sin cambio | PASS |
| Score oficial | Puntos/desglose | Agrega contexto rulebook | PASS |
| Historico | Valor persistido | No recalcula | PASS |
| Official concurrency | Authority existente | Payload aditivo | PASS |
| Public recovery | Outbox existente | Sin cambio de flujo | PASS |
| Portal Publico | Proyeccion existente | Sin cambio visual/calculo | PASS |
| Broadcast | Consume estado existente | Sin cambio de engine | PASS |
| FieldID | 239 intactos | Metadata compatible | PRESERVADOS |
| `ttm` | Colision legacy | Warning, sin rename | GAP DOCUMENTADO |
| Perfil desconocido | No aplicaba | Bloqueo o fallback explicito | PASS |
| Torneos historicos | Sin campos profile | Baseline vigente | PASS |

## Aislamiento

- El profile se selecciona en el torneo exacto.
- `tournament.ruleOverrides` solo afecta ese torneo.
- No existe profile global mutable ni fallback entre organizaciones.
- No se agrego una ruta Firebase compartida.

## No regresion contractual

No se modificaron formulas deportivas, ranking, estadisticas, timer, flujo Guardar y siguiente, autoridad oficial, Recovery, snapshot publico, Browser Output, OBS o graficos V1.
