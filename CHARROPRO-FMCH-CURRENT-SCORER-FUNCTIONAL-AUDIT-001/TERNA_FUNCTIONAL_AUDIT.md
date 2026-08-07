# Terna en el Ruedo

El producto representa Terna mediante dos suertes: lazo y pial_ruedo, cada una con tres
oportunidades. renderTernaMainPanel() instruye evaluar lazo de cabeza, pial de ruedo y
tiempo; sus acciones se capturan en la botonera (js/app.js:8034). El formato oficial
suma ambas en TOTAL TERNA (js/core/officialFormat.js:253).

| Aspecto | Estado |
| --- | --- |
| Lazo / pial | PRESENT como colecciones separadas. |
| Base, adicionales, malos, cero | PRESENT por intento. |
| Tiempo | Campo tiempo y evidencia opcional. |
| Total | Suma de lazo + pial en calculo y hoja actual. |
| Remate y distribucion por fila FMCH | DERIVABLE, no hay una entidad terna unica de tres filas. |
| Participantes | DERIVABLE desde roster; no hay captura independiente por cada columna FMCH. |

La equivalencia de la estructura visual oficial de tres filas requiere transformacion de
las dos colecciones existentes y validacion de jueces; no debe clasificarse como ausencia
total de datos deportivos.
