# Matriz temporal FMCH 2026 Libre 0.6.0

| Suerte | Contrato machine-readable | Regla/Modo | Duracion | Estado |
| --- | --- | --- | ---: | --- |
| Cala | No | Manual compatible | - | `TEMPORAL_RULE_MISSING` |
| Piales | No | Manual por oportunidad | - | `TEMPORAL_RULE_MISSING` |
| Coleadero | No | Compatibilidad heredada | - | `TEMPORAL_RULE_MISSING` |
| Jineteo de Toro | Si | `toro_apretalamiento` / countdown | 5 min | CERTIFIED |
| Lazo Cabecero | Si | `terna` / shared countdown | 7 min | CERTIFIED |
| Pial en el Ruedo | Si | `terna` / shared countdown | 7 min | CERTIFIED |
| Jineteo de Yegua | Si | `yegua_apretalamiento` / countdown | 5 min | CERTIFIED |
| Manganas a Pie | Si | `timer_manganas_pie` / independent countdown | 7 min | CERTIFIED |
| Manganas a Caballo | Si | `timer_manganas_caballo` / independent countdown | 7 min | CERTIFIED |
| Paso de la Muerte | Si | `timer_paso_3min` + `timer_paso_1min` | 3 min + 1 min | CERTIFIED |

Fuente: `FMCH_2026_LIBRE 0.6.0`, `suerteMetadata.timerContract(s)`. El perfil no contiene contratos machine-readable completos para Cala, Piales y Coleadero. Sus referencias documentales no se convirtieron en defaults oficiales dentro de este ticket.

El inicio permanece humano. Las condiciones deportivas de inicio/fin no se automatizan a partir de labels ni eventos inferidos.
