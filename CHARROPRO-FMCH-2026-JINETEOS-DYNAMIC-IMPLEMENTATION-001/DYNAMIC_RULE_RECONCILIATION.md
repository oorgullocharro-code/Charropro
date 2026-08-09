# Reconciliación de Reglas Dinámicas

## Identidad y valor

Cada selección conserva dos conceptos independientes:

- `selectedRuleId`: identidad deportiva estable de la acción seleccionada;
- `resolvedValue`: valor resuelto para la clasificación vigente.

Al cambiar clasificación se conserva la identidad, se vuelve a resolver el valor y se recalcula el resumen. No se duplica la regla y no se modifican nota ni evidencia.

## Clasificaciones

| ID | Etiqueta | Base |
| --- | --- | ---: |
| `EXCELENTE` | Excelente | 20 |
| `BUENA` | Buena | 16 |
| `REGULAR` | Regular | 12 |
| `MEDIA_REGULAR` | Media Regular | 8 |
| `MINIMA` | Mínima | 6 |

## Toro

La matriz de Toro se carga desde el perfil `FMCH_2026_LIBRE 0.4.0`. Incluye los 12 adicionales dinámicos, tiempo ahorrado, 14 infracciones, una infracción al equipo y 16 causas de DQ.

Las pruebas confirman, entre otras filas:

- Tentemozo: `4/4/3/1/0`;
- Cara atrás: `3/2/1/1/0`;
- Jugar piernas: `3/2/1/0/0`;
- Quitar verijero: `2/2/1/0/0`;
- Levantarse sin ayuda: `3/2/1/1/0`;
- Descomponerse: `-1/-2/-3/-4/-5`, conservado en la categoría infracción.

## Yegua

La matriz implementada usa los valores explícitamente confirmados por el ticket de ejecución:

| Regla | Excelente | Buena | Regular | Media Regular | Mínima |
| --- | ---: | ---: | ---: | ---: | ---: |
| A la Lola | 3 | 2 | 1 | 0 | 0 |
| Una mano | 3 | 2 | 1 | 0 | 0 |
| A la greña | 3 | 2 | 1 | 0 | 0 |
| Cara atrás | 3 | 2 | 1 | 0 | 0 |
| Tentemozo | 4 | 4 | 3 | 1 | 0 |
| Pretal gaza dos manos | 4 | 4 | 3 | 1 | 0 |
| Jugar piernas | 3 | 2 | 1 | 1 | 0 |
| Quitar verijero | 2 | 2 | 1 | 1 | 0 |
| Quitar pretal gaza/tentemozo | 2 | 2 | 1 | 1 | 0 |
| Oreja/cruzar pierna | 1 | 1 | 1 | 0 | 0 |
| Levantarse sin ayuda | 3 | 2 | 1 | 0 | 0 |
| Levantarse con ayuda | 2 | 1 | 0 | 0 | 0 |
| Descomponerse | -1 | -2 | -3 | -4 | -5 |

### Precedencia documental

La especificación previa `FMCH_2026_DYNAMIC_SCORING_TABLES.md` conserva para Media Regular los valores `Cara atrás +1`, `Jugar piernas 0`, `Quitar verijero 0` y `Levantarse sin ayuda +1`. El ticket actual declara explícitamente como confirmados `0`, `+1`, `+1` y `0`, respectivamente. Se aplicó la instrucción deportiva más reciente del ticket y se dejó esta diferencia trazada; no se alteró la documentación histórica de la especificación.

## Cero, No repara y DQ

- Una selección dinámica con valor cero permanece en Attempt V2.
- `Marcar 0` conserva su semántica existente y no equivale a Mínima.
- `No repara` solo aplica a Yegua, selecciona Mínima, elimina adicionales y no activa DQ.
- DQ anula los puntos buenos según el contrato existente, pero conserva infracciones, equipo, evidencia, nota y selecciones.

## Tiempo

La resolución temporal común produce ajustes declarativos:

- hasta tres minutos: `+1` por minuto completo ahorrado, máximo tres, excepto Mínima/No repara;
- más de tres minutos: primera infracción de un punto;
- más de cuatro minutos: segunda infracción de un punto;
- más de cinco minutos: DQ por tiempo excedido.

Los ajustes quedan en Attempt V2 y se congelan al publicar. La UI no constituye un motor temporal independiente.
