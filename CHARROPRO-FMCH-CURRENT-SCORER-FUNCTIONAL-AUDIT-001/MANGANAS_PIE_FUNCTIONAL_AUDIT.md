# Manganas a Pie

manganas_pie declara tres oportunidades. renderAttemptMainPanel() muestra cada una y el
total activo; la botonera comun permite seleccionar base, floreos/tiempo ahorrado,
malos, descalificacion, infraccion de equipo y cero.

El motor suma los tres intentos con calculateCollectionTotal(). Para cada tiro se
publica una copia de attempt, total y breakdown; por ello el score oficial puede
reconstruir buenos, malos y resultado, aunque los renglones exactos de la hoja FMCH
requieran transformacion.
