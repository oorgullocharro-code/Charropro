# Scoring Attempt V2 State Semantics

## Estados deportivos

| Status | Significado |
| --- | --- |
| NOT_STARTED | No existe actividad deportiva del intento. |
| ATTEMPTED | Se intento, sin afirmar logro o cero reglamentario. |
| VALID | Existe resultado valido/logrado. |
| NOT_ACHIEVED | Intento realizado sin lograr la suerte; mapeo compatible de Marcar 0. |
| ZERO | Cero explicito cuando un flujo futuro lo distinga de no logrado. |
| DQ | Descalificacion activa; el neto del intento es cero. |
| LOST_OPPORTUNITY | Oportunidad consumida o perdida sin equivaler a DQ. |
| REPLACEMENT | Intento asociado a sustitucion. |
| REPOSITION | Intento asociado a reposicion. |
| PENDING | Estado deportivo pendiente de resolucion. |

`DRAFT` no se mezcla con el resultado deportivo. Pertenece a `publication.state`. Por eso un intento puede ser `sportState.status: VALID` y `publication.state: DRAFT`.

## Marcar 0

El boton actual no cambia. `attempted: true` + `notAchieved: true` se adapta a `NOT_ACHIEVED`, nunca a DQ. El contrato reserva `ZERO` para una distincion reglamentaria o UI futura.

## DQ

Activar DQ:

- conserva base y adicionales;
- conserva infracciones individuales y de equipo;
- conserva evidencia, nota, timing, metadata y contexto;
- conserva `goodPoints` reconstruibles;
- fuerza `netAttemptPoints` a cero;
- mantiene `teamBadPoints` separado.

Retirar DQ en draft restaura el estado anterior y recalcula desde las selecciones conservadas. El motivo y la regla de DQ pueden permanecer como metadata de auditoria del draft. Este contrato no decide si una DQ especifica puede retirarse desde UI.

## Clasificacion dinamica

`classificationId` identifica la clasificacion. Cada seleccion conserva su identidad y `selectedRuleId`; `resolvedValue` puede cambiar conforme a una matriz declarativa. Cambiar EXCELENTE por BUENA no borra la seleccion.

Un snapshot oficial persiste el valor resuelto. Cambiar despues el Rule Profile no modifica ni recalcula el historico.

## Draft y official

### Draft

- mutable por operaciones puras que devuelven copia;
- revision incrementable;
- DQ reversible a nivel de modelo;
- clasificacion recalculable;
- no se escribe globalmente en V2 durante este ticket.

### Official

- `state: OFFICIAL`;
- `frozen: true`;
- `publishedAt` obligatorio;
- snapshot desacoplado y profundamente congelado al construirse;
- valores, labels, sources, perfil y fingerprint autosuficientes;
- revision oficial canonica conservada por el ledger existente.

## Oportunidades compartidas

`sharedOpportunityId` y `sharedSequenceNumber` enlazan contexto sin fusionar scores. `sharedTimerId` referencia un cronometro comun sin copiar ni operar Timer Engine.

## Invariantes

- Un scope individual nunca inventa `teamId`.
- Un scope team requiere `teamId`.
- DQ activo implica status DQ.
- Manual implica motivo.
- Valores y totales deben ser finitos.
- Evidencia y nota no modifican puntos.
- Team bad points no forman parte del neto individual.
- Normalizacion, DQ, reclasificacion y publicacion no mutan el origen.
