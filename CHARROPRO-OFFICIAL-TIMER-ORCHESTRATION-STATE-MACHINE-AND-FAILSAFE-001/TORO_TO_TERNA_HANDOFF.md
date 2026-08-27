# Toro To Terna Handoff

Al finalizar `fmch_2026_toro_apretalamiento`:

1. Toro queda FINISHED como evidencia.
2. Se deriva la definicion certificada `fmch_2026_terna_shared_window`.
3. Timer Authority crea/reclama Terna en READY.
4. `currentTimerContext` cambia a Terna.
5. Terna no inicia automaticamente.

El Scorer puede continuar calificando Toro mientras Terna esta READY o RUNNING. La vista de Toro conserva el tiempo finalizado de apretalamiento y muestra el timer operativo de Terna por separado.
