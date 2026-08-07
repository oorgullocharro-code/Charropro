# Coleadero

## Modelo actual

createScoreCollection() crea para Coleadero una matriz de tres coleadores, cada uno con
tres intentos (js/core/state.js:879). renderColeaderoMainPanel() recorre
coleadorCount, muestra coleador activo, tres oportunidades y total individual
(js/app.js:7936). El nombre viene del roster de colas, del participante individual o de
los campos guardados en intentos.

## Cobertura

| Concepto FMCH | Estado |
| --- | --- |
| Participantes 1-3 | PRESENT / DERIVABLE desde roster y matriz de intentos. |
| Suplente | DERIVABLE si se encuentra en roster; no hay propiedad exclusiva de suplente por pasada. |
| Tres pasadas por participante | PRESENT. |
| Buenos, malos, total por pasada | PRESENT por intento (base, adic, infr, total). |
| Total por participante y suerte | PRESENT por reduccion de coleccion. |
| Alineacion | Se resuelve desde roster/participante; cambios no tienen bitacora FMCH dedicada. |
| Participante 4 y sus tres pasadas | MISSING. El modelo y UI crean maximo tres coleadores de equipo. |

## Riesgo

La cuarta fila de la hoja FMCH no debe ser rellenada artificialmente por exportacion.
Primero requiere una decision deportiva y una extension de modelo separada. Esta es una
brecha funcional real, distinta de una diferencia de etiqueta.
