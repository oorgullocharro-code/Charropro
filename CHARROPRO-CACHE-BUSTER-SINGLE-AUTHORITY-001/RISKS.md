# Risks

## Riesgos mitigados

- Doble instancia de singletons por queries diferentes.
- Mezcla de modulos de julio y agosto en una ejecucion.
- HTML olvidados con cache-buster historico.
- Divergencia entre `appVersion` y constantes de Broadcast/Console.
- Checksum de configuracion desactualizado.

## Riesgos residuales

- `clientBootstrap.js` y `configurationBootstrap.js` son recursos estables; el servidor debe seguir entregando el JSON y HTML conforme a su politica actual. El bootstrap es generico y consulta la configuracion con `no-store`.
- La actualizacion futura del build requiere ejecutar el generador antes de empaquetar. Las pruebas permanentes bloquean omisiones.
- El paquete queda preparado, pero no desplegado a Hostinger en este ticket.
