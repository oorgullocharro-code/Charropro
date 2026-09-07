# Decisión de deploy

El cambio está certificado localmente y listo para un deploy controlado de cliente y Functions. No requiere Rules ni migración.

Antes de desplegar se requiere autorización explícita. Después del deploy, cualquier reconstrucción o republicación del torneo TEST requiere una autorización separada; este ticket no repara datos productivos automáticamente.

El paquete cliente inmutable se genera después del commit para incluir el SHA real en su nombre. Functions debe usar el preflight y allowlist existentes. El smoke debe comprobar build, checksum, Portal Público, sábana, Formato Federación y ranking sin crear fixtures en Producción.
