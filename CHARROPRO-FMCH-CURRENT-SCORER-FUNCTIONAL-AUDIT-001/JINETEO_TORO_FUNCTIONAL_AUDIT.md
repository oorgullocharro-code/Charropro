# Jineteo de Toro

Toro tiene un intento y usa la botonera de base, adicionales, infracciones y
descalificaciones. renderJineteoMainPanel() declara el modo y la botonera comun
conserva el desglose (js/app.js:8020, 8076). Base, adicionales, infracciones, tiempo,
total y penalizacion de equipo se conservan en el intento y score publicado.

## Hallazgo critico de trazabilidad

En js/data/suertes.js el identificador ttm se usa para Tentemozo (+1) en adicionales y
para Tiempo excedido (-1) en infracciones. toggleRule() usa una lista plana
attempt.applied para los dos grupos. Aunque los acumulados se modifican segun el tipo de
boton, el mismo id puede hacer que la marca de activacion y la evidencia por concepto
confluyan. El FieldID exacto de ambos controles no puede considerarse inequivoco hasta
separar identidad o comprobar el comportamiento en UI autenticada.

Este hallazgo no modifica formulas ni declara invalida la puntuacion catalogada; exige
correccion de identidad antes de certificar trazabilidad FMCH completa.
