# Guardas contra Producción

En LOCAL se rechaza inmediatamente cualquier projectId distinto de `demo-charropro-local`, URL `firebaseio.com`, bucket `firebasestorage.app`, host no loopback, configuración de database inválida o marcador de `charropro-e8a68` dentro de la configuración efectiva.

El mensaje de bloqueo usa el texto operativo: “CharroPro Local fue bloqueado porque detectó configuración de Producción.” No hay modo degradado ni fallback remoto.

Las pruebas `firebase-runtime-local.test.mjs` cubren projectId y databaseURL productivos, hosts inválidos y selección ambiental no autorizada.
