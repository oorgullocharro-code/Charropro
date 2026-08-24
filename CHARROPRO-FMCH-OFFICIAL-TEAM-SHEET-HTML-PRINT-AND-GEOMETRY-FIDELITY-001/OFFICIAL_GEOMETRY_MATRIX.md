# Official Geometry Matrix

## Papel y fuente

| Propiedad | Autoridad |
|---|---|
| Papel destino | Oficio mexicano vertical |
| Dimensiones | 215.9 x 340.44 mm; 8.5 x 13.403333 in |
| PDF fuente | 612 x 965.04 pt, 1 página |
| Márgenes | 0.18 in laterales; 0.20 in superior/inferior |
| Documento web | 1180 CSS px |
| Límite preventivo | 5000 CSS px |
| Columnas | 32 |
| Filas | 64 |
| Texto | wrap, máximo preferente 2 líneas, mínimo 5.5 pt / 7 px |

La altura relativa se obtuvo de la única página oficial certificada. El PDF fuente tiene una altura ligeramente menor que un Oficio nominal de 13.5 in; el destino conserva su proporción documental sin tratar unidades XLSX como píxeles CSS.

## Columnas

| Range | Role | Official Relative Width | HTML Target | XLSX Target | Text Policy | Notes |
|---|---|---:|---:|---:|---|---|
| 1 | side-control | 6.5 | proporcional dentro de 1180 px | 6.5 | centro, wrap | suma/control lateral |
| 2-9 | participant | 4.0 cada una | proporcional dentro de 1180 px | 4.0 | wrap, 2 líneas preferentes | nombres y conceptos |
| 10-32 | score | 3.25 cada una | proporcional dentro de 1180 px | 3.25 | centro, wrap | valores y controles |

## Filas por rol

| Section | Row/Range | Role | Official Relative Height | HTML Target | XLSX Target | Text Policy | Notes |
|---|---|---|---:|---:|---:|---|---|
| Institucional | 1-2 | institution-title | 20 | 25 px | 20 pt | 2 líneas, centrado | título y emblema |
| Evento | 3-5 | header-metadata | 10 | 15 px | 10 pt | wrap | evento, equipo, capitán, hora, fecha, lugar |
| Cala | 6 | cala-section-title | 16 | 22 px | 16 pt | centrado | título especializado |
| Secciones | 11,16,30,42,47,52 | section-title | 16 | 22 px | 16 pt | centrado | títulos equivalentes |
| Encabezados | 7,12,17,31,43,48,53 | scoring-header | 14 | 20 px | 14 pt | 2 líneas | geometría uniforme |
| Valores | 8,13,44,49,54 | scoring-value | 14 | 20 px | 14 pt | centrado | `0` se conserva |
| Coleadero | 18-20 | participant-row | 12 | 18 px | 12 pt | wrap | tres participantes deportivos |
| Coleadero | 21 | administrative-row | 12 | 18 px | 12 pt | documental | cuarta fila sin Attempt |
| Controles | 9,14 | control-row | 12 | 18 px | 12 pt | centrado | control documental |
| Coleadero | 22 | coleadero-control-row | 12 | 18 px | 12 pt | centrado | control administrativo |
| Infracciones | 23,27,35,39,45,50,55 | team-infraction | 14 | 20 px | 14 pt | centrado | afecta score una sola vez |
| Acumulados | 15,24,28,36,40,46,51,56 | accumulated-control | 12 | 18 px | 12 pt | centrado | anterior + suerte = nuevo |
| Jineteos | 25,37 | jineteo-header | 32 | 42 px | 32 pt | 2 líneas | conceptos individuales |
| Jineteos | 26,38 | jineteo-value | 16 | 22 px | 16 pt | centrado | Toro y Yegua |
| Terna | 32-34 | terna-participant | 15 | 22 px | 15 pt | 2 líneas | tres filas iguales |
| Cierre | 57 | bad-points-total | 14 | 20 px | 14 pt | centrado | control total |
| Cierre | 58 | final-score | 16 | 22 px | 16 pt | énfasis | puntuación final |
| Firmas | 60 | signature-label | 14 | 20 px | 14 pt | centrado | Juez/Juez/Juez/Capitán |
| Firmas | 61 | signature-line | 16 | 24 px | 16 pt | vacío manual | no se autocompleta |
| Footer | 62 | footer-text | 13 | 18 px | 13 pt | wrap | activo institucional |
| Footer | 63-64 | footer-quote | 13 | 18 px | 13 pt | wrap | texto literal certificado |
| Separadores | 10,29,41,59 | spacer | 3 | 4 px | 3 pt | n/a | separación controlada |

## Resultado geométrico

- Filas con el mismo rol tienen la misma altura en ambos renderers.
- Ningún texto modifica la altura individual de su fila.
- La transformación de pantalla conserva 1180 px y usa scroll horizontal en viewports menores.
- `@page` y el workbook usan la misma autoridad física Oficio.
