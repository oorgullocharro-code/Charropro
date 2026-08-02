# Bootstrap Local de Firebase

`js/core/firebaseRuntime.js` construye la única configuración efectiva del cliente local. La configuración efectiva usa `demo-charropro-local` y `127.0.0.1`; no reutiliza `firebase.client` del bootstrap de Producción.

`js/core/firebaseSync.js` inicializa una app con nombre local propio y conecta Auth, RTDB y Functions Emulator antes de exponer esos servicios. La conexión es única por runtime. Storage conserva host y bucket locales dentro del plan, pero no se importa ni conecta porque ningún flujo auditado del calificador usa Storage.

La carga de SDK Firebase desde gstatic ya existía antes de este ticket. No se agregó una carga CDN nueva; las conexiones de datos Firebase locales apuntan únicamente al loopback.
