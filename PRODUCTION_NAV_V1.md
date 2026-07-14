# Production Navigation v1

## Propósito

`PRODUCTION-NAV-001` integra Broadcast Studio en la navegación oficial de CharroPro sin incrustar ni modificar sus herramientas. La sección `production` funciona como punto de acceso y diagnóstico de solo lectura.

Versión de aplicación:

```text
20260713-production-nav-001-broadcast-access1
```

## Alcance

La integración agrega:

- una opción `Producción` en la navegación principal y en el menú del torneo;
- una vista `Broadcast Studio` dentro de CharroPro;
- tarjetas para Consola de Producción y Broadcast Playground;
- un catálogo declarativo del estado de los módulos Broadcast;
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

La vista no abre automáticamente ninguna herramienta. Muestra el estado conocido de la versión instalada y permite elegir el destino.

## Tarjetas y rutas

| Tarjeta | Ruta interna autorizada | Estado mostrado |
| --- | --- | --- |
| Consola de Producción | `production-console.html` | Disponible — V1 operativa con fixtures |
| Playground de Broadcast | `broadcast-playground.html` | Disponible — Entorno de pruebas |

Las páginas permanecen independientes. No se cargan en `iframe` ni se incorporan dentro de `index.html`.

Cada tarjeta permite:

- abrir en la misma pestaña;
- abrir en una pestaña nueva con `noopener,noreferrer`;
- copiar una URL absoluta generada desde el origen actual.

## Acceso rápido desde Conexión

`Conexión` contiene una tarjeta compacta `Broadcast Studio` con accesos a Consola y Playground. La tarjeta no duplica el catálogo ni la vista completa y solo aparece cuando el rol tiene acceso a producción.

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

## Estado de módulos

La vista presenta un catálogo declarativo local:

- Arquitectura maestra;
- Data Contract 1.0.0;
- Broadcast State 1.0.0;
- Output Engine 1.0.0;
- Asset Manager 1.0.0;
- Playground V1;
- Production Console V1.

No se consulta Firebase, archivos Markdown ni endpoints de salud. El catálogo expresa disponibilidad conocida por versión y no inventa conectividad.

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

La integración es aditiva. Conserva sin cambios:

- Production Console y Playground;
- Data Contract, State, Output y Asset Manager;
- gráficos y OBS V1;
- enlaces existentes de Conexión;
- calificador, resultados, torneos, equipos y participantes;
- página pública, Recovery y Event Engine.

## Limitaciones

- Production Console sigue siendo una página independiente con fixtures.
- Playground sigue siendo una página independiente de pruebas.
- La sección no controla OBS.
- No existe persistencia definitiva de Program.
- No es Action Engine.
- No agrega permisos reales nuevos.
- La disponibilidad es declarativa y no comprueba archivos mediante red.
