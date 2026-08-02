# Validación Visual del Calificador

Validación realizada con el cliente existente en `127.0.0.1:8765`, usuario `juez.local@example.test`, torneo ficticio y badge visible `LOCAL / EMULATOR`.

Se abrieron y verificaron los controles de Cala de Caballo, Piales en el Lienzo, Coleadero, Jineteo de Toro, Lazo a la Cabeza, Pial en el Ruedo, Jineteo de Yegua, Manganas a Pie, Manganas a Caballo y Paso de la Muerte. Cada vista mostró su encabezado específico y la acción `Guardar y siguiente`.

Se aplicó la base de Cala y se guardó una calificación de 20 puntos. La interfaz confirmó el guardado; después de recargar, Panel y Resultados mostraron 20 para Charros Demo del Norte. La persistencia oficial quedó corroborada en RTDB mediante score, published score, ledger, auditoría y fanout.

No se corrigieron la cuarta fila de Coleadero, el ID `ttm` duplicado ni las equivalencias FMCH de Cala.
