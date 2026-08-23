# Risks

| Riesgo | Estado | Mitigación |
| --- | --- | --- |
| Cala P/T no congelados por separado | MITIGADO | Evidencia producida por el cálculo autoritativo y congelada en Attempt V2 |
| Históricos sin evidencia semántica nueva | CONTROLADO | Bloqueo explícito, sin reinterpretación |
| Más de ocho malos de Cala | CONTROLADO | Error de overflow, sin truncamiento silencioso |
| Remate inferido por puntos | MITIGADO | Solo `sportState.remate` |
| Paso inferido por total | MITIGADO | Solo `sportState.vuelta` |
| Tiempo reconstruido | MITIGADO | Solo `officialElapsedMs` |
| Doble descuento por control lateral | MITIGADO | `affectsScore:false` y prueba de invariancia |
| Matriz anterior desactualizada | DOCUMENTADO | La nueva matriz 239/239 registra autoridad y estado actual |

No existe riesgo de escritura productiva: este ticket realizó `0` Firebase Production Writes.
