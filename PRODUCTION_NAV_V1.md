# Production Navigation v1

## Propósito

`PRODUCTION-NAV-001` integra Broadcast Studio en la navegación oficial de CharroPro. Desde `BROADCAST-STUDIO-WORKSPACE-001`, la sección `production` funciona como punto de acceso directo a la aplicación operativa oficial.

Versión de aplicación:

```text
20260713-production-nav-001-broadcast-access1
```

## Alcance

La integración agrega:

- una opción `Producción` en la navegación principal y en el menú del torneo;
- una vista `Broadcast Studio` dentro de CharroPro;
- una tarjeta única para el Workspace oficial;
- accesos rápidos desde `Conexión`;
- validación central de roles y rutas internas.

No agrega persistencia, conexiones, polling, permisos nuevos ni control real de OBS.

## Sección Producción

El identificador estable es:

```text
production
```

Puede abrirse con la navegación de CharroPro o mediante:

```text
index.html?view=production
```

La vista presenta un único destino operativo y evita exponer herramientas técnicas al operador.

## Tarjetas y rutas

| Tarjeta | Ruta interna autorizada | Estado mostrado |
| --- | --- | --- |
| Broadcast Studio | `broadcast-studio.html` | Disponible — Producción en tiempo real |

El Workspace permanece como aplicación independiente. No se carga en `iframe` ni se incorpora dentro de `index.html`.

Cada tarjeta permite:

- abrir en la misma pestaña;
- abrir en una pestaña nueva con `noopener,noreferrer`;
- copiar una URL absoluta generada desde el origen actual.

## Acceso rápido desde Conexión

`Conexión` contiene una tarjeta compacta `Broadcast Studio` con un acceso directo al Workspace. La tarjeta no duplica el catálogo y solo aparece cuando el rol tiene acceso a producción.

## Roles

Se reutiliza la capacidad central `graphics`; no se crean roles ni permisos persistentes.

Permitidos:

- supervisor;
- administrador, normalizado como supervisor;
- operador;
- gráficos.

Bloqueados:

- juez;
- locutor;
- lectura;
- organizador;
- usuarios sin sesión o sin permiso.

La comprobación se aplica al menú, a la vista directa y a las acciones de abrir/copiar.

## Workspace oficial

La navegación ya no presenta contratos, módulos, revisiones, Console o Playground como decisiones operativas. Esas herramientas técnicas permanecen en el repositorio, pero el operador entra directamente al catálogo profesional, Preview, Program y botonera de Broadcast Studio.

## Seguridad

Los destinos salen de una lista cerrada dentro de `js/app.js`. La resolución exige:

- nombre de archivo HTML permitido;
- protocolo `http:` o `https:`;
- mismo origen que CharroPro;
- texto variable escapado;
- apertura externa con `noopener,noreferrer`.

Se rechazan rutas desconocidas, `javascript:`, `file:` y cualquier origen distinto. Las URLs no incluyen `tenantId`, `sessionId`, operador, credenciales ni secretos.

Clipboard API se usa cuando está disponible. Si falla, el campo de solo lectura recibe foco y queda seleccionado para copia manual; no se ejecuta HTML.

## Responsive

Las tarjetas usan rejillas fluidas `minmax(0, 1fr)`. A 980 px pasan a una columna y a 640 px las acciones, cabeceras y filas de módulos también se apilan. No se definen anchos fijos para la vista ni se modifica el layout global.

## Compatibilidad

La integración conserva sin cambios:

- Production Console y Playground como herramientas técnicas heredadas;
- Data Contract, State, Output y Asset Manager;
- gráficos y OBS V1;
- enlaces existentes de Conexión;
- calificador, resultados, torneos, equipos y participantes;
- página pública, Recovery y Event Engine.

## Limitaciones

- Production Console y Playground no forman parte de la vista operativa principal.
- La sección no controla OBS.
- No es Action Engine.
- No agrega permisos reales nuevos.
- La disponibilidad es declarativa y no comprueba archivos mediante red.
