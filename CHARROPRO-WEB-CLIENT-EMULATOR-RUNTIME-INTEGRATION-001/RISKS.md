# Riesgos

1. No bloqueante: el SDK web conserva la infraestructura gstatic ya existente. Un requisito futuro de cero red externa para cargar librerías requerirá empaquetado local separado.
2. No bloqueante: Storage no forma parte del flujo auditado; se validó endpoint local, no una transferencia ficticia.
3. No bloqueante: la app intenta publicar el snapshot público directamente y Rules locales lo rechazan; Public Projection Recovery conserva el intent y la Function entregó el fanout. Corregir ese mensaje o ruta pertenece a un ticket de proyección pública, no a este runtime.
4. Las reglas no fueron modificadas. Las suites de reglas y el comportamiento local de Auth, RTDB, Functions y Storage sí se validaron contra Emulator Suite.
