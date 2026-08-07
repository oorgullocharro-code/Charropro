# Cala de Caballo

## Evidencia funcional

renderCalaMainPanel() llama a renderCalaPuntaSection() (js/app.js:7890 y 8928). El
estado de intento contiene puntaMetros, puntaPiquetes, puntaPts, base, adic, infr,
tiempo, applied, personalizados, penalizaciones y nota (js/core/state.js:31).
writePuntaField() normaliza metros/marcas y ejecuta applyPuntaCalculation()
(js/app.js:11071).

La catalogacion de Cala contiene adicionales agrupados LD, LI, ML y CR
(js/data/calaRules.js:60). Las reglas individuales se agregan a attempt.applied, y los
acumulados se mantienen en base, adic e infr. calculateAttemptTotal() suma base,
adicionales y punta, y resta malos (js/core/scoring.js:9).

## Campos solicitados

| Concepto | Estado observado |
| --- | --- |
| Metros de punta | Campo puntaMetros; presente en UI estatica, estado y calculo. |
| Tiempos / marcas / piquetes | puntaPiquetes, tiempo y evidencia de tiempo; requieren validacion semantica exacta FMCH. |
| Conversion | applyPuntaCalculation() calcula puntaPts. |
| P, T, LD, LI | Existen por punta/tiempo y grupos LD/LI. |
| MD, MI | El producto agrupa ambos en ML; transformable, no una clave separada persistida. |
| PC | Producto usa CR (Cambio de rectangulo). Equivalencia con PC: AMBIGUOUS. |
| Adicionales / malos individuales | Regla identificada en applied, suma en adic o infr; el desglose publicado contiene items. |
| Totales | Intento, malos y total final son calculables y exportables. |
| Correccion antes de cantar | El borrador es editable hasta nextScore(). |
| Despues de cantar | Se crea score publicado y la revision previa del mismo intento queda superseded en historial local. |

## Conclusiones

No es correcto clasificar punta, metros, marcas, adicionales o malos de Cala como
ausentes solo porque no son columnas planas. La correspondencia de PC, y la separacion
oficial de MD/MI frente al grupo ML, necesitan validacion deportiva y transformacion de
exportacion.
