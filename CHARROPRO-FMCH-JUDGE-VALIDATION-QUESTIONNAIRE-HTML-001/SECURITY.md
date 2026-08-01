# Seguridad y privacidad

- No hay llamadas de red, Firebase, API, CDN, WebSocket ni autenticación productiva.
- Las respuestas se muestran con APIs DOM y `textContent`; no se insertan como HTML ejecutable.
- La importación valida tipo, formato, versión, tamaño, FieldID conocidos y estados permitidos.
- La normalización elimina claves peligrosas, limita profundidad, arreglos y longitud de texto.
- No se almacenan secretos, configuraciones Firebase, credenciales ni datos productivos.
- Los adjuntos binarios quedan fuera de V1. La evidencia se registra solo como referencia textual.
- Los datos permanecen en el navegador local hasta que una persona los exporta o borra.
