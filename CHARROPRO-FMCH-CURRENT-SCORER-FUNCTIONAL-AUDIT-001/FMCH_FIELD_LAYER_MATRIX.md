# Matriz FMCH por capas

La matriz completa esta en [FMCH_FIELD_LAYER_MATRIX.json](FMCH_FIELD_LAYER_MATRIX.json).
Procesa los 239 FieldID de FIELD_DICTIONARY.json sin modificar el documento anterior.

## Convenciones

- PRESENT_IN_UI: existe ruta de renderizado/control en fuente. La ejecucion visual
  autenticada esta bloqueada; todos los registros incluyen liveUiValidated: false.
- PRESENT_IN_STATE: vive en intento, coleccion, torneo, jornada, equipo o roster.
- PRESENT_IN_CALCULATION: participa directamente en calculo o reduccion de total.
- PRESENT_IN_PERSISTENCE: se conserva en el estado/payload publicado existente.
- PRESENT_IN_OFFICIAL_SCORE: llega al snapshot publicado o a su breakdown.
- PRESENT_IN_AUDIT: forma parte del registro/revision/historial disponible.
- PRESENT_IN_EXPORT: el formato oficial actual puede emitirlo o su seccion.
- DERIVABLE: requiere transformacion desde datos presentes.
- MISSING: no existe la capacidad/modelo observada.
- AMBIGUOUS: existe evidencia parcial pero no equivalencia segura de FieldID.

## Resumen

| Seccion | Campos |
| --- | ---: |
| HEADER | 8 |
| CALA | 25 |
| PIALES | 17 |
| COLEADERO | 51 |
| JINETEO_TORO | 21 |
| TERNA | 32 |
| JINETEO_YEGUA | 21 |
| MANGANAS_PIE | 19 |
| MANGANAS_CABALLO | 19 |
| PASO | 16 |
| CLOSING_TOTALS | 2 |
| SIGNATURES | 4 |
| FOOTER | 4 |
| Total | 239 |

| Evaluacion principal | Cantidad |
| --- | ---: |
| PRESENT | 13 |
| DERIVABLE | 177 |
| MISSING | 7 |
| AMBIGUOUS | 42 |

Los siete MISSING cubren emblema institucional, cuarta fila de Coleadero y elementos de
pie. Los controles laterales, firmas y equivalencias no deportivas quedan AMBIGUOUS,
no se reclasifican como faltantes de score.
