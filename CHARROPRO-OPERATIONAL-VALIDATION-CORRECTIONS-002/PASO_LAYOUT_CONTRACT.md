# Paso Layout Contract

## Layout anterior

Clasificación, resultado y resumen competían en una cuadrícula superior; los timers ocupaban una franja independiente de ancho completo. La composición desperdiciaba altura y el `grid-area` compartido con Manganas desplazaba el resultado.

## Layout nuevo

- Operación principal: clasificación y resultado en una misma franja.
- Controles temporales: Salida, Desmonte y Aplicar tiempos debajo de la operación.
- Contexto: vuelta, clasificación y total en una columna lateral.
- Reflow: a menos de 760 px el contexto pasa debajo y los resultados se apilan.

## Preservación funcional

Se mantienen `getFmch2026SportTimerRuntimes`, los botones de control existentes y `apply-sport-timing`. No cambian duración, autoridad, cálculo ni reglas de Paso.

## Evidencia responsive

Se aplicaron viewports solicitados de 1600x900, 1366x768, 1280x720 y 1024x768. Las mediciones DOM confirmaron:

- clasificación y resultado sin traslape;
- operación y contexto sin traslape;
- una sola franja horizontal en los tamaños operativos;
- ausencia de overflow horizontal global;
- footer accesible mediante el flujo normal de scroll.

El backend visual reportó un factor de escala de 1.25 en sus dimensiones CSS; las validaciones se realizaron sobre cada override solicitado y sobre geometría relativa.
