# Entrypoints y autorizacion del calificador

| Entrada | Archivo | Funcion | Evidencia |
| --- | --- | --- | --- |
| Torneo | torneo.html | Carga js/tournamentApp.js, que importa js/app.js. | Archivo y navegador local. |
| Jueces | jueces.html | Entrada de la vista de jueces; la autorizacion converge en la aplicacion. | Inventario de paginas. |
| Render principal | js/app.js:7654 | renderScoring() resuelve jornada, participante, suerte, oportunidad y paneles. | Fuente. |
| Acceso | js/app.js:774 | renderAccessGate() muestra acceso privado sin sesion. | Navegador local. |
| Roles | js/core/roles.js:56 | Supervisor, Operador y Juez tienen capacidad score; Juez tambien timer y sync. | Fuente. |
| Publicacion | js/app.js:11688 | publishOfficialScoreForContext() prepara y publica el score oficial. | Fuente. |
| Siguiente | js/app.js:11999 | nextScore() protege doble accion, marca cero vacio y avanza tras publicar. | Fuente. |

## Configuracion local

tools/development/charropro-development.mjs validate --env-file .env.local.example
valido el perfil local y sus hosts de Emulator. No se inicio Produccion. El documento
CHARROPRO-DEVELOPMENT-INFRASTRUCTURE-FOUNDATION-001/DEVELOPMENT_ENVIRONMENT.md:29
establece que el bootstrap del navegador todavia no consume esos hosts. Por tanto el
navegador local no puede abrir la sesion de juez contra Emulator sin un cambio fuera del
alcance de esta auditoria.

## Estado de evidencia

La pagina local torneo.html mostro la puerta Acceso privado; no se usaron credenciales
ni se intento evadir roles. La auditoria de controles visuales se sustenta en rutas de
renderizado estaticas, no en una sesion de juez ejecutada. Este limite es la causa del
dictamen no aprobatorio.
