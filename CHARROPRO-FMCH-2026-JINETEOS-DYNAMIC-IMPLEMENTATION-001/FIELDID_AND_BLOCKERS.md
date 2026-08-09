# FieldID y Bloqueos

## Alcance revisado

No se reabrió la auditoría de 239 FieldID. Se reutilizó la matriz aprobada y se revisaron únicamente las secciones afectadas.

| Sección | Total | Directo | Derivable | Ambiguo | Faltante |
| --- | ---: | ---: | ---: | ---: | ---: |
| `JINETEO_TORO` | 21 | 0 | 17 | 4 | 0 |
| `JINETEO_YEGUA` | 21 | 0 | 17 | 4 | 0 |

Los 42 FieldID se preservan. Clasificación, selecciones dinámicas, valores resueltos y timing son estado interno proyectable por transformación; este ticket no crea celdas oficiales nuevas.

## Controles ambiguos preservados

En cada sección permanecen sin significado impreso certificado:

- `SIDE_CONTROL`;
- `POST_INFRACTION_CONTROL_01`;
- `POST_INFRACTION_CONTROL_02`;
- `POST_INFRACTION_CONTROL_03`.

La ambigüedad pertenece al exportador/formato y no bloquea la calificación dinámica.

## Colisión legacy `ttm`

El catálogo legacy de Toro reutiliza `ttm` para Tentemozo y tiempo excedido. El perfil nuevo usa identidades separadas:

- `toro_adic_tentemozo`;
- `toro_infr_apretalamiento_minuto_4`;
- `toro_infr_apretalamiento_minuto_5`;
- `toro_desc_apretalamiento_mas_5_min`.

No se migran históricos. Cuando un dato legacy no conserve el grupo original, la identidad no debe inferirse solo desde `ttm`.

## Bloqueos fuera de alcance

- equivalencias impresas de Cala;
- cuarta fila de Coleadero;
- controles impresos ambiguos del formato;
- activación productiva del perfil `FMCH_2026_LIBRE`.

Ninguno se forzó ni se resolvió lateralmente en este ticket.
