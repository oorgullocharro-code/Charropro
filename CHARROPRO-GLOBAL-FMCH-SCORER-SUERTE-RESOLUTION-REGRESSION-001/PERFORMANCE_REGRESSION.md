# Performance Regression

## Baseline productivo anterior

- Touch visible: 15.8 ms
- Transicion de suerte: 16.0 ms
- P95 de 30 ciclos: 17.8 ms

## Correctivo

No se elimino el cache. Se amplio su firma y se excluyeron vacios provisionales.

El arnes determinista de 120 iteraciones obtuvo:

- feedback inmediato P95: 0 ms;
- critical path de transicion P95: 0.010 ms;
- coalescing after-paint: PASS;
- proteccion de toque duplicado: PASS.

Estos tiempos son metricas sinteticas Node y no sustituyen una medicion fisica. La carga automatizada en navegador confirmo una raiz y diez pestañas tras carga y recarga; la automatizacion no produjo muestras del dataset interno, por lo que no se reporta su overhead como latencia del producto.

Validacion fisica iPad: pendiente posterior al deploy.
