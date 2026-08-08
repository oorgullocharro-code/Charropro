# Impacto FMCH 2026 sobre FieldID

## 1. Baseline reutilizado

La fuente exhaustiva sigue siendo:

- `CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001/FMCH_FIELD_LAYER_MATRIX.json`;
- `CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001/UI_TO_DATA_TRACEABILITY.json`;
- `CHARROPRO-FMCH-OFFICIAL-DOCUMENT-SPECIFICATION-001/FIELD_DICTIONARY.json`.

No se duplica ni altera el diccionario. Se analizaron `239/239` FieldID.

| Evaluacion | Cantidad |
| --- | ---: |
| Presente directo | 13 |
| Derivable | 177 |
| Ambiguo | 42 |
| Faltante | 7 |
| Total | 239 |

Capas observadas: UI 182, estado 195, calculo 184, persistencia 184, score oficial 184, auditoria 184, exportacion 232 y derivable 215. Estas capas se superponen; no son una particion.

## 2. Distribucion por seccion

| Seccion | Total | Directo | Derivable | Ambiguo | Faltante |
| --- | ---: | ---: | ---: | ---: | ---: |
| HEADER | 8 | 0 | 7 | 0 | 1 |
| CALA | 25 | 7 | 16 | 2 | 0 |
| PIALES | 17 | 0 | 13 | 4 | 0 |
| COLEADERO | 51 | 0 | 42 | 7 | 2 |
| JINETEO_TORO | 21 | 0 | 17 | 4 | 0 |
| TERNA | 32 | 6 | 21 | 5 | 0 |
| JINETEO_YEGUA | 21 | 0 | 17 | 4 | 0 |
| MANGANAS_PIE | 19 | 0 | 15 | 4 | 0 |
| MANGANAS_CABALLO | 19 | 0 | 15 | 4 | 0 |
| PASO | 16 | 0 | 12 | 4 | 0 |
| CLOSING_TOTALS | 2 | 0 | 2 | 0 | 0 |
| SIGNATURES | 4 | 0 | 0 | 4 | 0 |
| FOOTER | 4 | 0 | 0 | 0 | 4 |

## 3. Matriz regla -> scorer -> FieldID

| Regla FMCH 2026 | Campo scorer futuro/actual | FieldID actual | Mapeable | Requiere cambio | Nuevo campo interno | Pendiente fuente |
| --- | --- | --- | --- | --- | --- | --- |
| Cala base/punta | `base`, `puntaMetros`, `puntaPiquetes`, `puntaPts` | `FMCH.TEAM_SHEET.CALA.*` | Si | Catalogo debe ampliarse | No para exportar | No |
| Cala lados/medios/cambio | `applied`, `breakdown.adicGroups` | `CALA.*`, incluidos `PC` y control lateral | Parcial | Si, reconciliar equivalencias | Posible alias estable | Si |
| Piales 3 intentos | `attempts[0..2]` | `PIALES.OPPORTUNITY_*` | Si | Bases/adicionales 2026 | `remateId`, distancia numerica | No |
| Piales controles laterales | Totales/controles impresos | `PIALES.SIDE_CONTROL`, `POST_INFRACTION_CONTROL_*` | Ambiguo | Solo exportador | No | Si, significado del formato |
| Colas 3 x 3 | Coleador/ronda/caida/distancia | `COLEADERO.PARTICIPANT_01..03.*` | Si | Catalogo/acciones | Sustitucion/reposicion | No |
| Colas cuarta fila | Sin campo deportivo actual | `COLEADERO.PARTICIPANT_04.NAME`, `BOTTOM_CONTROL_04` | No | Si | Por decidir | Si |
| Toro dinamico | `classification`, `dynamicSelections` | `JINETEO_TORO.*` | Si por transformacion | Si, matriz e ID `ttm` | Clasificacion + selecciones | No |
| Terna cinco compartidas | `sharedOpportunityNumber`, entries | `TERNA.*` | Si por composicion | Si, dominio compartido | Shared state | No |
| Lazo/Pial bases y floreo | Bases, movements, remate | `TERNA.*` | Si | Catalogos 2026 | Movement selections/histories | No |
| Yegua dinamica | `classification`, `dynamicSelections` | `JINETEO_YEGUA.*` | Si | Si, matriz | Clasificacion + selecciones | No |
| Manganas Pie | 3 attempts, remate, tirones, tiempo | `MANGANAS_PIE.*` | Si | Si, catalogo/historial | `remateHistory`, pulls | No |
| Manganas Caballo | 3 attempts, base/remate/floreo | `MANGANAS_CABALLO.*` | Si | Si | `remateHistory`, base identity | Art. 217 Contra mascara duplicada |
| Paso | vuelta, cuarto, clasificacion, acciones | `PASO.*` | Si | Si, matriz/timers | Dynamic state | No |
| Team infractions | `teamPenalties[]` | Secciones/total del equipo | Si por suma | Extender a todas suertes | Regla, cantidad, total | No |
| DQ con malos | `desc`, breakdown y penalizaciones | Puntos malos/total por seccion | Si | Normalizacion transversal | DQ scope/cause | No |
| Totales | Agregados oficiales | `CLOSING_TOTALS.*` | Si | No deportivo | No | Formula impresa no publicada |
| Firmas | Asignacion nominal/futura firma | `SIGNATURES.*` | Parcial | Si, fuera del score | Artefacto de firma | Si |

## 4. FieldID ambiguos exactos

### Cala (2)

- `FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL`.
- `FMCH.TEAM_SHEET.CALA.PC`.

La UI usa `ML` y `CR`; el formato separa equivalencias `MD/MI/PC` de forma no certificada. Bloquea el cierre del ticket de Cala/exportador, no la regla de puntos ya confirmada.

### Controles impresos (36)

- Piales: `SIDE_CONTROL` y `POST_INFRACTION_CONTROL_01..03`.
- Coleadero: `SIDE_SUM_CONTROL`, `BOTTOM_CONTROL_01`, `SUM_CONTROL`, `POST_INFRACTION_CONTROL_01..03`.
- Toro, Yegua, Manganas Pie, Manganas Caballo y Paso: `SIDE_CONTROL` y `POST_INFRACTION_CONTROL_01..03` por seccion.
- Terna: `SIDE_CONTROL` y `AUXILIARY_CONTROL_01..04`.

Estos campos existen en el formato pero su etiqueta/formula exacta no puede deducirse de la geometria.

### Firmas (4)

- `FMCH.TEAM_SHEET.SIGNATURES.JUDGE_01`.
- `FMCH.TEAM_SHEET.SIGNATURES.JUDGE_02`.
- `FMCH.TEAM_SHEET.SIGNATURES.JUDGE_03`.
- `FMCH.TEAM_SHEET.SIGNATURES.CAPTAIN`.

Existe asignacion nominal de jueces/capitan; no existe captura de firma ni condicion de validez certificada.

## 5. FieldID faltantes exactos

1. `FMCH.TEAM_SHEET.HEADER.FEDERATION_LOGO`.
2. `FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME`.
3. `FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04`.
4. `FMCH.TEAM_SHEET.FOOTER.CONADE_LOGO`.
5. `FMCH.TEAM_SHEET.FOOTER.CONADE_NAME`.
6. `FMCH.TEAM_SHEET.FOOTER.SPORTS_SECRETARIAT_PERIOD`.
7. `FMCH.TEAM_SHEET.FOOTER.INSTITUTIONAL_QUOTE`.

Solo dos estan relacionados con una seccion deportiva y ambos dependen de aclarar la cuarta fila de Coleadero. Los cinco institucionales no afectan score.

## 6. Campos internos nuevos que no son FieldID

El scorer 2026 necesitara estado operativo que no debe confundirse con nuevas celdas del formato:

- `classification` y selecciones dinamicas para Toro/Yegua/Paso;
- historial de remates para Piales, Pial Ruedo y Manganas;
- cinco oportunidades y timer compartidos de Terna;
- sustitucion/reposicion/orden de Coleadero;
- tirones y revision de Manganas;
- eventos de timers y evidencia;
- alcance/cause de DQ;
- identidad separada de infracciones al equipo.

Estos campos se proyectan a FieldID existentes mediante transformacion. Solo se creara un FieldID nuevo si el formato oficial requiere una celda persistente que no exista; este ticket no autoriza hacerlo.

## 7. Colision `ttm`

Ubicacion: `js/data/suertes.js`, catalogo de `toro`.

- Adicional: `ttm` = Tentemozo `+1` en el catalogo legacy.
- Infraccion: `ttm` = Tiempo excedido `-1`.

Ambos entran en `attempt.applied`, por lo que una sola identidad puede activar conceptos opuestos y contaminar desglose/auditoria/exportacion. Resolucion conceptual:

- IDs deportivos distintos e inmutables;
- migracion explicita de datos legacy con evidencia del grupo original;
- nunca inferir el significado solo por `ttm` si el grupo no esta disponible;
- conservar score historico y marcar ambiguedad si no existe contexto suficiente.

No se cambia el ID en este ticket.

## 8. Impacto por estado de regla

| Tipo de cambio 2026 | FieldID | Producto futuro |
| --- | --- | --- |
| Catalogo ampliado | Reutiliza celdas de base/adicional/malos | Nuevas RuleID, sin cambiar FieldID |
| Dinamico | Reutiliza desglose y totales | Persistir clasificacion/selecciones |
| Shared domain | Reutiliza TERNA | Crear estado compartido, exportar dos faenas |
| Historial de remate | No es celda final | Persistir trazabilidad y proyectar remate cuando aplique |
| Timer | Controles/tiempo existentes o derivables | Eventos oficiales idempotentes |
| Team penalties | Total equipo | Separar canal individual/equipo |
| DQ | Totales y malos | Alcance de DQ y preservacion de malos |

## 9. Dictamen FieldID

- Analizados: `239/239`.
- Alterados en este ticket: `0`.
- Faltantes reales: `7`.
- Ambiguos: `42`.
- Reglas deportivas 2026 que exigen estado nuevo: si, pero no necesariamente FieldID nuevos.
- Bloqueos de implementacion: equivalencias Cala, cuarta fila Coleadero y doble identidad textual de Contra mascara en Manganas Caballo.
- Los dinamicos de Toro/Yegua/Paso, Terna shared, histories y timers son mapeables con transformacion y no justifican inventar celdas.
