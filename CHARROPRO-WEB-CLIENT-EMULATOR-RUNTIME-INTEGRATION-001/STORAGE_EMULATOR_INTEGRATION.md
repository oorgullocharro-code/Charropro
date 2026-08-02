# Storage Emulator

El runtime local declara `127.0.0.1:9199` y bucket `demo-charropro-local.appspot.com`. El calificador auditado no usa Storage actualmente; por eso el cliente no incorpora una importación CDN adicional solo para una conexión sin uso.

Cuando un flujo local use Storage, deberá importar el SDK existente de forma controlada y llamar `connectStorageEmulator` antes de cualquier operación. Storage Emulator inició en `127.0.0.1:9199` y su smoke respondió `403` sin credenciales, respuesta esperada. El flujo auditado de calificación no sube ni descarga archivos, por lo que no se ejecutó una transferencia ficticia.
