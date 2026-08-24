# Baseline Latency

Scope: real local browser, authenticated LOCAL/EMULATOR fixture, desktop Chrome runtime controlled through the in-app browser.

Before optimization:

- Warm scorer button interaction observed externally: first sample 722 ms; subsequent samples 280-284 ms.
- Suerte transitions observed externally: 553-759 ms.
- Instrumented scorer touch: handler 2.5 ms, local state 51.1 ms, DOM 359.2 ms, visible 365.1 ms, persistence 0.8 ms.
- Instrumented suerte switch: resolution 45.5 ms, DOM 312.0 ms, visible 316.8 ms, sync ready 317.6 ms.

The baseline showed local CPU and render work in the critical path even with stable local infrastructure. Firebase network latency was not the primary cause.
