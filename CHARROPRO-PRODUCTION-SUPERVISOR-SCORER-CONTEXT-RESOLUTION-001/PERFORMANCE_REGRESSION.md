# Performance Regression

El correctivo no agrega polling, timers recurrentes ni listeners duplicados. La resolucion es sincrona y pura sobre el contexto ya hidratado.

La creacion usa un guard por pestaña para evitar doble solicitud. Las actualizaciones pending/error reutilizan el render existente. La invalidacion amplia la firma del cache sin aumentar el volumen del catalogo.

Cobertura: pruebas de assignment a 0, 100, 500 y 1500 ms; regresiones de interaccion, save latency, viewport, hard refresh y cambio de contexto.
