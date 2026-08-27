# Multidevice Reconciliation

Cada dispositivo reconstruye el timer actual desde live/current y el registro autoritativo. Memoria local solo puede servir como ultima vista, nunca como selector.

Un `currentTimerContext` nuevo reemplaza inmediatamente al anterior aunque el historico este RUNNING, PAUSED o FINISHED. Revisiones duplicadas son idempotentes; revisiones regresivas no reemplazan el mismo timer. Dos clientes de Emulator resolvieron el mismo contexto y un hard refresh lo reconstruyo sin seleccion local.
