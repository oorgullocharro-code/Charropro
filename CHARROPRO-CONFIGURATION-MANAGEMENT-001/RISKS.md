# Riesgos

## Riesgos mitigados

### Configuración Firebase duplicada

El bootstrap web, región, rutas compartidas y opciones del entrypoint de Functions salen del mismo baseline validado.

### Escrituras concurrentes

Se usa CAS con `expectedVersion` dentro de transacción RTDB. Una sola revisión puede avanzar y los conflictos quedan controlados.

### Reintentos

`idempotencyKey` vincula solicitud y fingerprint. Un retry idéntico devuelve la versión previa; otra carga con la misma clave se rechaza.

### Mezcla de organizaciones

La resolución exige coincidencia de tenant/organización y nunca cruza scopes. El backend no inventa identidad faltante.

### Corrupción y prototype pollution

Checksum, clonación segura, límites estructurales y bloqueo de claves peligrosas evitan aceptar registros alterados o no serializables.

### Acceso directo

Las Rules del namespace son `read: false` y `write: false`. Admin SDK es el único adaptador persistente.

## Riesgos residuales

### Integración gradual de consumidores excluidos

Broadcast, Portal, Backup, Restore, Official Score y Public Projection contienen constantes internas que este ticket prohibió modificar. No son fuentes activas del Configuration Service. Los namespaces correspondientes están preparados, pero su adopción debe realizarse por tickets propietarios y con pruebas de compatibilidad.

### Disponibilidad del baseline estático

El arranque web ahora falla cerrado si `functions/configuration.defaults.json` no está disponible o no coincide su checksum. El proceso de publicación debe incluir ese archivo junto con los assets estáticos.

### API key web visible

La API key de Firebase web permanece públicamente descargable, como exige el SDK cliente. La seguridad depende de Auth, Rules y App Check, no del secreto de esa clave. No debe sustituirse por una credencial administrativa.

### Configuración dinámica y respaldo global

Las versiones tienen historial y auditoría propios. Backup/Restore no fue modificado por restricción del ticket; un futuro ticket deberá definir exportación y restauración explícita del namespace sin alterar backups existentes.

### Rules no desplegadas

El archivo local cierra el namespace, pero no se desplegó. No deben habilitarse las callables en producción antes de publicar las Rules correspondientes.

### Invalidación de caché pendiente de la publicación

El ticket no recibió una nueva versión de aplicación ni autorización de deploy. La publicación futura debe actualizar los cache-busters de los entrypoints que cargan `version.js` y `firebaseSync.js`; hacerlo aquí habría modificado módulos excluidos y no aporta nada al commit local sin deploy.

## Riesgos no introducidos

- No cambió el reglamento.
- No cambió scoring, ranking ni estadísticas.
- No cambió Portal ni Broadcast.
- No cambió Output Routing.
- No se agregaron dependencias.
- No hubo escritura remota, migración o deploy.
