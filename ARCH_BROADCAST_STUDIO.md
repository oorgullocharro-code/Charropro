# CharroPro Broadcast Studio

## 1. Visión

CharroPro Broadcast Studio será el motor universal de producción en vivo de CharroPro. Su propósito es convertir el contexto deportivo oficial en experiencias visuales y operativas consistentes para transmisiones, pantallas, monitores y plataformas de producción.

Broadcast Studio no es solamente un módulo de gráficos y no depende de OBS. Debe funcionar con cualquier plataforma que acepte una fuente de navegador, así como con salidas especializadas que puedan integrarse posteriormente mediante adaptadores. OBS será una salida compatible, no la arquitectura central.

La plataforma debe poder adaptarse a organizaciones, clientes, torneos, competencias y deportes distintos. Las diferencias visuales y operativas se resolverán mediante contratos de datos, plantillas, temas, layouts, acciones y configuraciones versionadas. Ninguna personalización visual deberá requerir cambios en el Core deportivo ni alterar sus reglas, cálculos o flujos oficiales.

Sus objetivos son:

- ofrecer una fuente única y normalizada de datos para producción;
- permitir diseños completamente personalizados sin duplicar lógica;
- operar múltiples salidas de forma simultánea y controlada;
- separar Preview de Program;
- coordinar operadores, locutores, cámaras, piso y supervisión;
- soportar automatización progresiva sin quitar control humano;
- conservar trazabilidad y compatibilidad con los gráficos actuales;
- crecer hacia nuevos deportes e integraciones sin reescribir el sistema.

## 2. Principios obligatorios

1. No crear un HTML independiente por cada gráfico nuevo.
2. Todo gráfico nace desde una plantilla.
3. Toda plantilla se construye con componentes reutilizables.
4. Todo dato proviene del Broadcast Data Contract.
5. Ninguna plantilla consulta Firebase directamente.
6. Toda acción pasa por el Action Engine.
7. Toda botonera es configuración, no lógica fija.
8. Los datos y el diseño permanecen separados.
9. Los gráficos actuales se conservan como compatibilidad legacy hasta que Broadcast Studio V2 esté validado en operación real.
10. Todo contrato, componente, tema, plantilla, acción, layout, salida y configuración debe estar versionado.
11. Toda operación relevante debe ser auditable.
12. Ninguna personalización de cliente debe romper ni sobrescribir la configuración global.
13. Todo elemento visible debe ser un componente reutilizable.
14. El Core deportivo sigue siendo la fuente de verdad; Broadcast Studio no recalcula resultados oficiales.
15. Una salida nunca debe leer directamente estructuras internas del Core.
16. La ausencia de un dato opcional debe producir un fallback controlado, no un gráfico roto.
17. Las automatizaciones deben poder desactivarse y siempre respetar permisos, capas y estado de Program.
18. El sistema debe degradarse de forma segura ante pérdida de red, incompatibilidad de versión o datos incompletos.

Un marcador no es un componente. Es una plantilla compuesta, por ejemplo, por:

- fondo;
- contenedores;
- logos;
- textos;
- puntajes;
- separadores;
- listas;
- animaciones.

Esta distinción evita crear componentes monolíticos y permite reutilizar las mismas piezas en marcador, ranking, turno, premiación y pantallas especiales.

No habrá un HTML independiente por cada gráfico, pero sí existirán salidas universales de renderizado para Preview, Program, LED y monitores. Estas salidas compartirán el mismo renderer y recibirán composiciones declarativas adaptadas a sus capacidades, resolución y orientación.

El editor visual avanzado será una fase posterior. La primera etapa utilizará configuraciones declarativas, presets validados y controles seguros para reducir riesgo operativo, mantener trazabilidad y evitar que una edición libre produzca composiciones incompatibles durante una transmisión.

## 3. Arquitectura general

```text
CharroPro Core
    -> Broadcast Data Contract
    -> Broadcast State
    -> Action Engine
    -> Template Engine
    -> Renderer
    -> Outputs
```

### CharroPro Core

Es la fuente oficial de torneo, competencia, participantes, turnos, calificaciones, rankings y cronómetros. Conserva la lógica deportiva. Broadcast Studio solo consume sus resultados normalizados y nunca modifica reglas o cálculos.

### Broadcast Data Contract

Traduce el estado del Core a un contrato estable, explícito y versionado. Oculta estructuras internas, elimina dependencias con rutas de almacenamiento y entrega a producción una vista coherente del contexto actual.

### Broadcast State

Mantiene el estado operativo de la producción: Preview, Program, capas, gráficos visibles, colas, tema activo, outputs, mensajes y contexto deportivo. No sustituye al Core; conserva únicamente el estado necesario para producir.

### Action Engine

Es la única puerta de entrada para cambiar el estado de producción. Valida permisos, objetivo, payload, confirmaciones, compatibilidad, resultado y auditoría antes de ejecutar una acción.

### Template Engine

Resuelve una plantilla versionada, sus componentes, bindings, tema, layout, animaciones, variantes y fallbacks. Valida que los datos requeridos estén disponibles antes del render.

### Renderer

Convierte la definición abstracta de la plantilla en una representación visible. Debe ser determinista: el mismo contrato, plantilla, tema, layout y estado producen la misma salida. El renderer no consulta Firebase ni ejecuta lógica deportiva.

### Outputs

Son destinos independientes con resolución, orientación, capas, permisos y estado propios. Una misma acción puede dirigirse a Preview, Program, LED, monitor de locutor u otros outputs autorizados.

### Regla de dependencia

Cada capa conoce solamente el contrato de la capa inmediata que consume. Los outputs no conocen el Core; las plantillas no conocen Firebase; las botoneras no implementan lógica; los componentes no deciden acciones.

## 4. Broadcast Data Contract

El Broadcast Data Contract es la única interfaz de datos disponible para plantillas, automatizaciones, monitores y outputs. Debe ofrecer módulos normalizados para:

- `tournament`
- `organization`
- `competition`
- `charreada`
- `participant`
- `team`
- `charro`
- `horse`
- `suerte`
- `score`
- `scoreDetail`
- `ranking`
- `timer`
- `sponsor`
- `branding`
- `production`
- `system`
- `customFields`

### Tipos de campos

- **Oficiales:** forman parte estable del contrato y tienen nombre, tipo y semántica documentados.
- **Opcionales:** son oficiales, pero pueden ser `null` cuando el contexto no los produce.
- **Personalizados:** se registran mediante `customFields` y no alteran el esquema oficial.
- **Derivados:** proceden de resultados ya calculados por el Core o por un publicador autorizado; Broadcast Studio no los recalcula.

### Metadatos recomendados por módulo

Cada módulo debe poder declarar:

- versión del esquema;
- origen del dato;
- instante de generación;
- visibilidad;
- estado de frescura;
- disponibilidad;
- errores o advertencias de normalización.

### Versionado

El contrato debe tener versión semántica o un identificador equivalente, separado de la versión de la aplicación. Los cambios compatibles agregan campos opcionales. Renombrar, eliminar o cambiar la semántica de un campo exige una versión mayor y una estrategia de migración.

### Compatibilidad hacia atrás

- Las plantillas declaran qué versiones soportan.
- El adaptador del contrato puede completar aliases durante un periodo de transición.
- Los aliases se resuelven antes del Template Engine, nunca dentro de cada plantilla.
- Una plantilla incompatible no debe salir a Program; debe mostrar diagnóstico en Preview y usar fallback autorizado.

### Valores `null` y fallbacks

- `null` significa dato conocido pero no disponible.
- Un campo ausente significa que la versión del contrato no lo define o no fue entregado.
- Cero, cadena vacía y `false` son valores válidos y no deben confundirse con ausencia.
- Cada componente define su fallback visual.
- Los fallbacks nunca inventan resultados, participantes o tiempos oficiales.

### Visibilidad y origen

Cada campo debe clasificarse como público, producción, operativo o restringido. El contrato entregado a cada output se filtra según su permiso. El origen debe identificar el módulo oficial que produjo el dato, no una ruta interna de Firebase.

### Formato esperado

El contrato debe usar identificadores estables, fechas normalizadas, unidades explícitas y arreglos ordenados. Las relaciones deben expresarse por IDs y, cuando sea útil para render inmediato, por una proyección pública segura.

## 5. Custom Fields

Los campos personalizados permiten incorporar datos de clientes, deportes o producciones que todavía no forman parte del contrato oficial.

Cada definición debe contemplar:

```json
{
  "key": "string",
  "label": "string",
  "dataType": "string",
  "value": null,
  "scope": "tournament",
  "visibility": "production",
  "description": "string",
  "source": "string",
  "required": false,
  "defaultValue": null,
  "validation": {}
}
```

Scopes permitidos:

- `global`
- `organization`
- `tournament`
- `competition`
- `charreada`
- `participant`
- `team`
- `horse`
- `score`
- `production`
- `session`

### Gobierno de Custom Fields

- `key` debe ser estable, único dentro de su namespace y usar formato normalizado.
- Los campos deben registrarse en un catálogo antes de usarse en producción.
- Cada organización usa namespace propio para evitar colisiones.
- `dataType` y `validation` son obligatorios para campos editables.
- La visibilidad debe impedir que datos internos lleguen a outputs públicos.
- Los defaults no pueden inventar datos deportivos oficiales.
- Un campo que se vuelva común debe promoverse al contrato oficial mediante migración versionada.
- Las plantillas no pueden recorrer campos arbitrarios sin una lista permitida.
- Deben existir límites de cantidad, tamaño y profundidad.
- Los campos obsoletos se marcan como deprecados; no se recicla su `key` con otra semántica.

Con estas reglas, `customFields` funciona como extensión gobernada y no como depósito de propiedades sin definición.

## 6. Component Library

La biblioteca inicial debe incluir:

- `text`
- `image`
- `logo`
- `video`
- `container`
- `rectangle`
- `line`
- `separator`
- `icon`
- `list`
- `table`
- `grid`
- `timer`
- `score`
- `ranking`
- `sponsor`
- `QR`
- `progress`
- `badge`
- `ticker`
- `iframe`, solo para fuentes confiables, aisladas y autorizadas;
- `custom component`, bajo registro, sandbox, revisión y versionado.

Cada componente debe poder definir:

```json
{
  "componentId": "string",
  "type": "text",
  "dataBinding": {},
  "position": {},
  "size": {},
  "style": {},
  "visibility": {},
  "animation": {},
  "responsiveRules": [],
  "fallback": {},
  "permissions": []
}
```

### Responsabilidades

- `dataBinding` apunta exclusivamente al Broadcast Data Contract o al estado autorizado de producción.
- `position` y `size` son declarativos y compatibles con el Layout Engine.
- `style` usa tokens de tema antes que valores fijos.
- `visibility` expresa condiciones declarativas y no ejecuta código libre.
- `animation` referencia el catálogo central.
- `responsiveRules` define variantes por output y densidad.
- `fallback` describe qué mostrar cuando falta el dato o recurso.
- `permissions` limita campos o acciones sensibles.

### Restricciones para iframe y custom components

`iframe` solo debe cargar orígenes aprobados, con políticas de sandbox y permisos mínimos. Un componente personalizado debe declarar dependencias, versión, permisos, límites de recursos, contrato de entrada y comportamiento de fallo. No puede acceder directamente a Firebase, credenciales, DOM externo ni APIs no autorizadas.

## 7. Template Engine

Una plantilla es una composición declarativa y versionada de componentes que representa una unidad visual completa.

Cada plantilla debe incluir:

```json
{
  "templateId": "string",
  "name": "string",
  "version": "string",
  "category": "scoreboard",
  "supportedScopes": [],
  "supportedCompetitionTypes": [],
  "requiredData": [],
  "optionalData": [],
  "components": [],
  "layoutRules": {},
  "animations": {},
  "themeBinding": {},
  "outputCompatibility": [],
  "previewImage": "string",
  "fallbackBehavior": {},
  "validationRules": []
}
```

Tipos iniciales:

- marcador;
- turno;
- participante;
- equipo;
- calificación;
- detalle de Cala;
- ranking;
- cronómetro;
- patrocinador;
- nuevo líder;
- premiación;
- pantalla completa;
- mensaje libre;
- lower third.

### Ciclo de resolución

1. Validar versión y compatibilidad de output.
2. Resolver contexto, scope y tipo de competencia.
3. Verificar datos requeridos.
4. Aplicar tema y variante.
5. Resolver layout según output y contenido.
6. Instanciar componentes.
7. Enlazar datos y fallbacks.
8. Validar área segura, overflow y permisos.
9. Renderizar en Preview.
10. Autorizar envío a Program.

Una plantilla publicada es inmutable. Toda modificación genera una versión nueva. Los borradores pueden editarse, pero no reemplazan silenciosamente una versión en uso.

## 8. Theme Engine

El Theme Engine separa la identidad visual de la estructura funcional de las plantillas. Debe contemplar:

- `primaryColor`
- `secondaryColor`
- `accentColor`
- `backgroundColor`
- `textColor`
- `typography`
- `logo`
- `watermark`
- `backgrounds`
- `borders`
- `shadows`
- `opacity`
- `sponsorAssets`
- `spacing`
- `radius`
- `iconSet`

Jerarquía de configuración, de menor a mayor precedencia:

1. General
2. Organización
3. Torneo
4. Competencia
5. Salida
6. Sesión

La configuración más específica sobrescribe únicamente las propiedades que declara. Las demás se heredan. Cada resolución debe conservar información de procedencia para auditoría y diagnóstico.

### Reglas

- Los temas usan tokens, no selectores o código arbitrario.
- Los assets deben estar versionados y tener fallback.
- Deben validarse contraste, legibilidad y safe area.
- Las personalizaciones de una sesión no modifican el tema de torneo.
- Un output puede adaptar tipografía, escala o contraste sin cambiar el tema base.
- Los iconos deben provenir de un set autorizado y coherente.

## 9. Layout Engine

El Layout Engine adapta plantillas a contenido, resolución, orientación y densidad sin crear una plantilla distinta por cada combinación.

Debe considerar:

- número de equipos;
- número de participantes;
- tipo y scope de competencia;
- orientación;
- resolución;
- tamaño de salida;
- densidad de información;
- safe area;
- idioma y longitud de nombres.

Casos mínimos:

- 1 participante;
- 2 participantes;
- 3 equipos;
- 4 equipos;
- 5 o más elementos;
- ranking Top 5;
- ranking Top 10;
- pantalla horizontal;
- pantalla vertical;
- LED panorámica.

### Capacidades

- **Presets:** configuraciones probadas para formatos frecuentes.
- **Reglas automáticas:** selección por cantidad, scope, orientación y densidad.
- **Breakpoints:** definidos por dimensiones del output, no por el navegador del operador.
- **Anclajes:** bordes, centro, safe area y componentes relacionados.
- **Alineación:** distribución consistente de grupos y texto.
- **Escala:** uniforme o por componente dentro de límites explícitos.
- **Min/max size:** evita texto ilegible o elementos fuera de pantalla.
- **Overflow:** truncado, ajuste, paginación o carrusel declarado.
- **Compact mode:** reduce espacios y elementos secundarios.
- **Carousel mode:** pagina listas extensas con tiempos y control manual.

El motor debe producir diagnóstico cuando una composición no cabe. No debe reducir texto indefinidamente ni ocultar información crítica sin indicarlo.

## 10. Animation Engine

El catálogo inicial de entradas incluye:

- `fade`
- `slide-left`
- `slide-right`
- `slide-up`
- `slide-down`
- `scale`
- `zoom`
- `wipe`
- `reveal`
- `blur-in`

Debe ofrecer salidas equivalentes y permitir transiciones entre estados.

Cada animación define:

```json
{
  "animationId": "string",
  "duration": 300,
  "delay": 0,
  "easing": "ease-out",
  "direction": "in",
  "repeat": 1,
  "autoHide": false,
  "reducedMotionFallback": "fade"
}
```

### Reglas

- Las plantillas referencian animaciones registradas; no implementan animaciones aisladas.
- Las duraciones y easings deben poder ajustarse por tema o salida dentro de límites.
- Program debe conocer cuándo una entrada o salida terminó.
- Una acción posterior puede esperar la finalización mediante dependencias explícitas.
- Debe existir fallback para movimiento reducido y para dispositivos con recursos limitados.
- Una animación fallida no puede dejar el gráfico en un estado visual indeterminado.

## 11. Action Engine

El catálogo oficial inicial incluye:

- `SHOW_GRAPHIC`
- `HIDE_GRAPHIC`
- `HIDE_ALL`
- `UPDATE_GRAPHIC`
- `SEND_TO_PREVIEW`
- `SEND_TO_PROGRAM`
- `CLEAR_PREVIEW`
- `CLEAR_PROGRAM`
- `SELECT_TEMPLATE`
- `SELECT_VARIANT`
- `SELECT_THEME`
- `SET_POSITION`
- `SET_SCALE`
- `SET_SIZE`
- `SET_OPACITY`
- `START_TIMER`
- `STOP_TIMER`
- `RESET_TIMER`
- `SHOW_SPONSOR`
- `SHOW_SCORE`
- `SHOW_SCORE_DETAIL`
- `SHOW_RANKING`
- `SHOW_MESSAGE`
- `QUEUE_GRAPHIC`
- `PLAY_NEXT`
- `ACKNOWLEDGE_MESSAGE`

Cada acción contempla:

```json
{
  "actionId": "string",
  "actionType": "SHOW_GRAPHIC",
  "target": {},
  "payload": {},
  "actor": {},
  "timestamp": "ISO-8601",
  "output": [],
  "permissions": [],
  "confirmation": {},
  "audit": {},
  "result": null
}
```

### Flujo de ejecución

1. Normalizar acción y generar ID.
2. Validar actor, rol y permisos.
3. Validar target, output y compatibilidad.
4. Resolver confirmación requerida.
5. Comprobar precondiciones y conflictos de capa.
6. Aplicar la transición al Broadcast State.
7. Propagarla a outputs.
8. Recibir confirmaciones o errores.
9. Registrar resultado y auditoría.

Las acciones deben ser idempotentes cuando sea posible. Los reintentos deben conservar correlación para evitar dobles ejecuciones.

## 12. Broadcast State

El estado central de producción debe manejar:

- gráficos visibles;
- capas activas;
- Preview;
- Program;
- plantilla y variante seleccionadas;
- tema activo;
- tamaño;
- posición;
- escala;
- opacidad;
- colas;
- mensajes;
- outputs conectados;
- estado de automatización;
- contexto deportivo actual.

### Tipos de estado

- **Configuración persistente:** plantillas asignadas, temas, layouts, botoneras, outputs y permisos.
- **Estado temporal de sesión:** selección actual, Preview, paneles abiertos, borradores y preferencias del operador.
- **Estado en vivo:** Program, capas visibles, timers de producción, colas activas y confirmaciones de outputs.
- **Estado legacy:** proyección de compatibilidad para gráficos V1, aislada del estado V2.

### Reglas

- El estado tiene una revisión monotónica para resolver concurrencia.
- Toda transición proviene de una acción válida.
- Preview y Program son espacios separados.
- La recuperación de sesión no debe mandar contenido al aire automáticamente.
- El contexto deportivo se referencia desde el contrato y conserva su versión/frescura.
- Los outputs informan heartbeat y revisión aplicada.
- La pérdida de un output no detiene otros outputs, pero genera alerta.

## 13. Layers

Mapa inicial recomendado:

| Rango | Uso |
| --- | --- |
| 10 | Fondos |
| 20 | Marcador |
| 30 | Turno |
| 40 | Calificación |
| 50 | Cronómetro |
| 60 | Alertas |
| 70 | Patrocinadores |
| 80 | Pantalla completa |
| 90 | Emergencia |

Cada layer debe definir ID, rango, prioridad, grupo, exclusividad, bloqueo, outputs permitidos y política de reemplazo.

El sistema debe permitir:

- varias capas visibles;
- bloqueo para evitar reemplazos accidentales;
- prioridad visual y operativa;
- exclusividad entre gráficos incompatibles;
- grupos para acciones conjuntas;
- ocultado conjunto;
- reemplazo temporal con restauración opcional;
- capas reservadas para emergencia.

`HIDE_ALL` debe respetar capas bloqueadas o de emergencia según permisos. Una pantalla completa puede ocultar temporalmente capas inferiores sin destruir su estado.

## 14. Preview / Program

### Preview

Espacio para ensayo, edición, validación y vista previa. Permite preparar cambios sin que aparezcan en la transmisión.

### Program

Salida oficial al aire. Solo recibe acciones autorizadas y validadas.

Flujo recomendado:

1. Seleccionar gráfico.
2. Configurar datos, plantilla, tema y output.
3. Enviar a Preview.
4. Revisar contenido, layout y contexto.
5. Ejecutar Take, Cut o Auto hacia Program.
6. Ocultar, reemplazar o Clear cuando corresponda.

### Operaciones

- **Take:** transfiere la composición de Preview a Program conservando la transición configurada.
- **Cut:** cambio inmediato, sujeto a permisos y advertencias.
- **Auto:** ejecuta la transición y duración definidas.
- **Clear:** limpia el espacio objetivo según capas y bloqueos.

El sistema puede permitir envío directo a Program únicamente para acciones, roles o automatizaciones autorizadas. Debe existir una preferencia operativa para exigir Preview en eventos críticos.

## 15. Outputs

Salidas iniciales:

- Browser Output
- OBS Browser Source
- vMix Web Browser
- Wirecast Web Page
- Streamlabs Browser Source
- LED Display
- Locutor Monitor
- Preview
- Program
- Mobile Monitor
- API futura

Cada output debe poder definir:

```json
{
  "outputId": "string",
  "name": "string",
  "type": "browser",
  "resolution": { "width": 1920, "height": 1080 },
  "orientation": "landscape",
  "aspectRatio": "16:9",
  "safeArea": {},
  "theme": "string",
  "assignedLayers": [],
  "permissions": [],
  "status": "offline",
  "heartbeat": null
}
```

### Adaptadores

Las diferencias de OBS, vMix, Wirecast o LED deben resolverse mediante adaptadores de output. El Template Engine y el Action Engine trabajan con abstracciones comunes. Un adaptador declara capacidades como transparencia, audio, video, interacción, resolución máxima y soporte de animaciones.

### Estado y recuperación

Cada salida informa conectividad, versión, última revisión aplicada, latencia y errores. Al reconectarse debe sincronizarse con el estado autorizado, sin repetir acciones transitorias ni mostrar contenido obsoleto.

## 16. Button Board Schema

Las botoneras son configuraciones declarativas con niveles:

- global;
- organization;
- tournament;
- competition;
- user;
- session.

Cada botón incluye:

```json
{
  "buttonId": "string",
  "label": "string",
  "group": "string",
  "actionType": "SHOW_GRAPHIC",
  "targetGraphic": "string",
  "templateId": "string",
  "variantId": "string",
  "themeId": "string",
  "output": [],
  "permissions": [],
  "confirmBeforeExecute": false,
  "duration": null,
  "autoHide": false,
  "payloadBindings": {},
  "order": 1,
  "enabled": true,
  "shortcut": null,
  "scope": "tournament",
  "version": "string"
}
```

Precedencia:

```text
General
-> Organización
-> Torneo
-> Competencia
-> Usuario
-> Sesión
```

La configuración más específica puede agregar, ocultar, reordenar o sobrescribir botones permitidos sin modificar la definición global. Las personalizaciones deben conservar referencia a su origen y versión. Un cambio por torneo nunca altera las botoneras de otros torneos ni la plantilla general.

Los shortcuts deben detectar conflictos. Los botones deshabilitados conservan su definición para auditoría, pero no ejecutan acciones.

## 17. Production Center

Production Center será la consola operativa unificada y debe organizarse en módulos:

- estado de transmisión;
- control de gráficos;
- cola de gráficos;
- mensajes;
- alertas;
- Run of Show;
- Timeline;
- Preview;
- Program;
- outputs;
- confirmaciones;
- estado de usuarios;
- bitácora.

### Responsabilidades

- Mostrar qué está al aire y en qué output.
- Separar selección, Preview y Program.
- Exponer alertas de datos incompletos, outputs desconectados o versiones incompatibles.
- Permitir operar colas y automatizaciones sin ocultar su origen.
- Mostrar presencia y rol de operadores conectados.
- Dar acceso a la bitácora sin mezclarla con controles de salida.
- Evitar que una pantalla saturada obligue al operador a buscar acciones críticas.

Production Center consume Broadcast State y despacha acciones; no modifica directamente templates, Firebase o el Core.

## 18. Production Messaging

Canal operativo para coordinar:

- locutores;
- producción;
- operador de gráficos;
- cámaras;
- piso;
- cronómetro;
- supervisor;
- juez, cuando corresponda.

Formato recomendado:

```json
{
  "messageId": "string",
  "sender": {},
  "recipients": [],
  "channel": "production",
  "type": "instruction",
  "priority": "normal",
  "text": "string",
  "createdAt": "ISO-8601",
  "expiresAt": null,
  "status": "sent",
  "acknowledgements": [],
  "countdown": null,
  "relatedCompetition": null,
  "relatedCharreada": null,
  "relatedGraphic": null,
  "quickActions": []
}
```

Tipos:

- `information`
- `instruction`
- `urgent`
- `countdown`
- `commercial`
- `interview`
- `camera`
- `sponsor`
- `result`
- `warning`
- `free_text`

Respuestas rápidas:

- Recibido
- En proceso
- Listo
- No disponible

### Reglas operativas

- No es un chat social.
- Los mensajes deben ser breves, dirigidos y relacionados con producción.
- Prioridad urgente exige confirmación y expiración.
- Deben existir canales y permisos por rol.
- Un mensaje puede incluir acciones rápidas autorizadas, pero no ejecutarlas sin confirmación.
- Las confirmaciones, estados y expiraciones son auditables.
- Los mensajes públicos o al aire requieren una acción separada `SHOW_MESSAGE`.

## 19. Run of Show

La escaleta de producción representa el plan operativo del evento. Cada paso puede incluir:

```json
{
  "title": "string",
  "scheduledTime": "ISO-8601",
  "duration": 0,
  "status": "planned",
  "notes": "string",
  "assignedGraphic": null,
  "assignedTemplate": null,
  "sponsor": null,
  "cameraSuggestion": null,
  "productionMessage": null,
  "automation": null,
  "responsibleRole": null,
  "dependencies": []
}
```

Pasos comunes:

- Intro
- Presentación de locutores
- Presentación de equipos
- Cala
- Comercial
- Entrevista
- Ranking parcial
- Premiación
- Cierre

### Reglas

- La escaleta puede planearse por torneo, competencia o charreada.
- Horario programado y tiempo real deben permanecer separados.
- Un paso puede completarse, omitirse, retrasarse o reprogramarse sin borrar historial.
- Las automatizaciones asociadas deben ser visibles y cancelables.
- Las dependencias impiden ejecutar pasos fuera de orden cuando sean obligatorias.
- La escaleta orienta la producción, pero no altera el flujo deportivo.

## 20. Automation Engine

Modelo:

```text
Trigger -> Conditions -> Actions
```

Triggers posibles:

- score published;
- leader changed;
- record broken;
- timer started;
- timer stopped;
- participant changed;
- suerte changed;
- charreada started;
- charreada finished;
- competition finished;
- manual trigger.

Acciones posibles:

- mostrar gráfico;
- preparar Preview;
- enviar mensaje;
- ocultar;
- reproducir patrocinador;
- actualizar ranking;
- agregar a cola;
- notificar locutores.

### Modos

- **Manual:** el trigger crea una sugerencia; un operador decide.
- **Semiautomático:** prepara Preview o cola y solicita confirmación antes de Program.
- **Automático:** ejecuta acciones autorizadas sin intervención, dentro de límites y con fallback.

### Definición mínima

Cada automatización debe declarar ID, versión, scope, trigger, condiciones, acciones, prioridad, cooldown, permisos, outputs, modo, estado, horario, fallback y auditoría.

### Protecciones

- Debounce y deduplicación de triggers.
- Prevención de ciclos entre acciones y eventos.
- Cooldown para evitar repetición excesiva.
- Simulación previa y modo dry-run.
- Botón global de pausa.
- Confirmación obligatoria para acciones críticas.
- Límite de frecuencia y concurrencia.
- Registro completo de condición, decisión y resultado.

## 21. Plugin SDK

La arquitectura futura debe permitir extensiones para:

- deportes adicionales;
- nuevos componentes;
- nuevos outputs;
- integraciones externas;
- IA;
- marcadores LED;
- repetición;
- audio;
- intercom;
- cámaras;
- ticketing.

### Contrato conceptual

Cada plugin deberá declarar:

- identidad, versión y proveedor;
- versión mínima/máxima de plataforma;
- capacidades aportadas;
- permisos solicitados;
- contratos de entrada y salida;
- configuración;
- migraciones;
- límites de recursos;
- estrategia de error y desactivación;
- firma o mecanismo de confianza.

Los plugins se ejecutarán con permisos mínimos y APIs públicas estables. No podrán acceder directamente al estado interno, Firebase, credenciales o DOM de otros módulos. Esta sección define la dirección arquitectónica; no se implementan plugins en esta etapa.

## 22. Persistencia

Debe persistirse, según su naturaleza:

- plantillas;
- temas;
- botoneras;
- acciones;
- mensajes;
- Run of Show;
- auditoría;
- presets;
- layouts;
- outputs;
- sesiones.

### Niveles

#### Configuración general

Catálogos, componentes, plantillas base, temas base, layouts, animaciones y permisos del sistema.

#### Configuración por organización

Branding, assets, temas, plantillas autorizadas, botoneras y outputs propios.

#### Configuración por torneo

Overrides, patrocinadores, Run of Show, asignaciones de outputs, presets y automatizaciones del evento.

#### Estado temporal de sesión

Preview, selección del operador, paneles, borradores y overrides no publicados. Debe tener expiración y recuperación controlada.

#### Estado en vivo

Program, capas visibles, colas, mensajes activos, automatizaciones y heartbeat. Requiere baja latencia, revisión y recuperación.

#### Histórico

Auditoría, acciones ejecutadas, resultados, mensajes relevantes, cambios de configuración y sesiones cerradas.

### Reglas

- Configuración y estado deben almacenarse por separado.
- Toda entidad persistente incluye ID, scope, versión y timestamps.
- Los borradores no reemplazan versiones publicadas.
- El estado temporal tiene TTL.
- La recuperación no reactiva Program sin confirmación.
- Se deben definir exportación, respaldo y migración antes del uso comercial.
- Este documento no define rutas ni reglas de Firebase; eso corresponde a tickets posteriores.

## 23. Versionado

Deben versionarse independientemente:

- data contract;
- templates;
- themes;
- button boards;
- actions;
- components;
- layouts;
- animations;
- outputs;
- plugins.

### Política

- Una versión publicada es inmutable.
- Cambios compatibles agregan capacidades opcionales.
- Cambios incompatibles requieren versión mayor.
- Cada dependencia declara rango de versiones compatible.
- Las composiciones guardan las versiones exactas resueltas.
- Las migraciones son explícitas, reversibles cuando sea posible y auditadas.
- Preview valida migraciones antes de Program.
- Las versiones deprecadas conservan periodo de soporte y fallback.
- Los assets se identifican por versión o hash para evitar caché mezclada.

### Compatibilidad

La plataforma debe ofrecer adaptadores entre versiones consecutivas del contrato y herramientas de validación para plantillas. No debe migrar automáticamente una configuración en vivo sin respaldo y confirmación.

## 24. Seguridad

Roles iniciales:

- Super Admin
- Admin Organización
- Supervisor
- Director de Producción
- Operador de Gráficos
- Locutor
- Cámara
- Piso
- Juez
- Solo lectura

### Matriz conceptual de permisos

| Capacidad | Roles recomendados |
| --- | --- |
| Crear/publicar plantillas | Super Admin, Admin Organización autorizado |
| Modificar temas | Super Admin, Admin Organización, Director de Producción según scope |
| Editar botoneras | Super Admin, Admin Organización, Director de Producción; usuario en overrides permitidos |
| Enviar a Program | Director de Producción, Operador de Gráficos autorizado |
| Ocultar gráficos | Director de Producción, Operador de Gráficos autorizado; emergencia según política |
| Enviar mensajes | Roles de producción dentro de sus canales |
| Modificar Run of Show | Director de Producción y responsables autorizados |
| Administrar outputs | Super Admin, Admin Organización, Director de Producción autorizado |
| Ver auditoría | Super Admin, Admin Organización, Supervisor y roles expresamente autorizados |

### Principios

- Autenticación y autorización se validan en cada acción, no solo en la interfaz.
- Los permisos combinan rol, organización, torneo, competencia, output y sesión.
- Un output público recibe un contrato filtrado.
- Plantillas y custom components no acceden a secretos.
- Las acciones críticas pueden requerir confirmación o doble autorización.
- Deben revocarse sesiones y outputs perdidos.
- Los tokens de output deben ser limitados, rotables y sin permisos de escritura deportiva.
- No se definen Firebase Security Rules en esta fase.

## 25. Auditoría

La bitácora debe registrar:

- quién ejecutó o autorizó la operación;
- qué acción se intentó;
- cuándo ocurrió;
- desde qué dispositivo y sesión;
- a qué output se dirigió;
- qué plantilla, variante, tema y versiones se usaron;
- qué datos o revisión del contrato se renderizaron;
- si fue manual, semiautomática o automática;
- resultado de la acción;
- confirmaciones de Preview, Program y outputs;
- errores y reintentos.

### Reglas

- Los registros son inmutables.
- Cada acción tiene ID y correlación con sus efectos.
- Los datos sensibles se redactan; se guarda referencia o hash cuando sea suficiente.
- La auditoría distingue intento, aceptación, ejecución y confirmación.
- Los errores no se sobrescriben con el resultado de un reintento.
- La retención depende del nivel operativo, contractual y legal.
- Debe poder exportarse por torneo, sesión, usuario, output y rango de tiempo.

## 26. Compatibilidad Legacy

Los gráficos actuales continúan funcionando mientras se construye y valida Broadcast Studio V2.

### Estrategia

- No eliminar ni renombrar los HTML actuales durante el desarrollo de V2.
- V1 y V2 operan en paralelo con rutas y estado claramente separados.
- Un adaptador legacy proyecta solo los datos que V1 necesita.
- No se agregan nuevas dependencias profundas a V1 salvo correcciones críticas.
- Las pruebas comparan V1 y V2 con el mismo contexto deportivo.
- V2 se convierte en principal únicamente después de pruebas técnicas, ensayo de producción y evento real controlado.
- Debe existir fallback operativo a V1 durante el periodo de transición.
- La desactivación de V1 requiere inventario, migración, respaldo, documentación y aprobación comercial.

El fallback no debe compartir estado mutable de Program entre motores. La producción debe saber de forma visible cuál versión controla cada output.

## 27. Roadmap

### 1. BROADCAST-DATA-001

Definir el Broadcast Data Contract v1, normalizador, versionado, visibilidad, frescura y adaptador legacy de lectura.

### 2. BROADCAST-STATE-001

Crear modelo de estado central, revisiones, sesión, Preview, Program, layers y recuperación segura.

### 3. BROADCAST-OUTPUT-001

Definir outputs, heartbeat, capacidades, adaptadores iniciales y sincronización de estado.

### 4. ASSET-MANAGER-001

Crear catálogo, validación, variantes, permisos, derechos de uso y ciclo de vida para imágenes, logos, videos, tipografías y recursos de producción.

### 5. PRODUCTION-VARIABLES-001

Definir variables declarativas, tipos, scopes, precedencia, validación, permisos y resolución consistente por output y sesión.

### 6. ACTION-ENGINE-001

Implementar catálogo, validación, permisos, idempotencia, resultados y auditoría de acciones.

### 7. COMPONENT-LIBRARY-001

Construir componentes base declarativos con binding, fallbacks, permisos y validación visual.

### 8. TEMPLATE-ENGINE-001

Resolver plantillas versionadas, dependencias, datos requeridos, variantes y render en Preview.

### 9. THEME-ENGINE-001

Implementar tokens y herencia General -> Organización -> Torneo -> Competencia -> Salida -> Sesión.

### 10. LAYOUT-ENGINE-001

Incorporar presets, reglas automáticas, breakpoints por output, compact mode y carousel.

### 11. ANIMATION-ENGINE-001

Crear catálogo central, lifecycle, reduced motion y confirmaciones de finalización.

### 12. SCENES-001

Crear escenas versionadas que compongan plantillas, layers, variables, transiciones y asignaciones de output sin introducir HTML específico por gráfico.

### 13. PRODUCTION-CONSOLE-001

Construir consola inicial con estado, Preview, Program, layers, outputs y diagnóstico.

### 14. BUTTON-BOARD-001

Implementar esquema declarativo, herencia, permisos, shortcuts y personalización por scope.

### 15. MACROS-001

Implementar secuencias reutilizables de acciones con permisos, validación previa, pausas controladas, compensación y auditoría.

### 16. PRODUCTION-MESSAGING-001

Crear mensajería operativa dirigida, prioridades, confirmaciones, expiración y auditoría.

### 17. RUN-OF-SHOW-001

Crear escaleta por torneo/competencia con tiempos, dependencias, responsables y estado real.

### 18. AUTOMATION-001

Implementar Trigger -> Conditions -> Actions empezando en modo manual y semiautomático.

### 19. GRAPHICS-V2-001

Migrar un conjunto mínimo de gráficos legacy a V2, ejecutar comparación y piloto controlado con fallback.

### 20. PLUGIN-SDK-001

Definir APIs, manifiesto, sandbox, permisos, compatibilidad y ciclo de vida de plugins.

### Dependencias y puertas de aprobación

- Data Contract y Broadcast State deben estabilizarse antes de Template Engine.
- Asset Manager y Production Variables deben estabilizar sus contratos antes de publicar componentes y plantillas reutilizables.
- Outputs y Action Engine deben validarse antes de habilitar Program.
- Componentes, temas, layouts y animaciones deben pasar pruebas visuales antes de Graphics V2.
- Scenes depende de Template, Theme, Layout y Animation Engine; Macros depende de Action Engine y de una primera versión estable de Scenes.
- Automation inicia solo después de auditoría, permisos y operación manual estable.
- Plugin SDK se diseña sobre APIs ya congeladas, no sobre internals provisionales.

## 28. Conclusión del arquitecto

Broadcast Studio debe construirse como plataforma de producción y no como una colección creciente de páginas HTML. El Broadcast Data Contract permite consumir cualquier dato actual o futuro sin exponer la estructura interna del Core. La biblioteca de componentes y los motores de plantillas, temas, layouts y animaciones permiten crear diseños completamente personalizados sin duplicar lógica ni alterar reglas deportivas.

La herencia por scopes permite modificar temas y botoneras para una organización, torneo, competencia, usuario o sesión sin afectar la configuración general. El Broadcast State, el Action Engine y el modelo Preview/Program hacen posible operar múltiples salidas con control, permisos, recuperación y auditoría. Los adaptadores mantienen independencia de OBS y abren compatibilidad con vMix, Wirecast, Streamlabs, LED, monitores y futuras APIs.

El modelo declarativo y versionado prepara a CharroPro para nuevos deportes, nuevos componentes y plugins sin convertir cada integración en una excepción. La compatibilidad legacy reduce riesgo: V2 puede desarrollarse y probarse en paralelo, compararse con los gráficos actuales y habilitarse gradualmente con fallback real.

La disciplina más importante para los próximos años será conservar las fronteras: el Core calcula, el contrato publica, el estado coordina, las acciones controlan, las plantillas componen y los outputs muestran. Si esas responsabilidades permanecen separadas, CharroPro podrá evolucionar de un sistema de gráficos a una plataforma profesional de producción sin perder estabilidad, trazabilidad ni capacidad de personalización.

## 29. Asset Manager

Asset Manager será el catálogo oficial de recursos visuales y audiovisuales usados por Broadcast Studio. Ninguna plantilla, tema, escena o output debe depender de rutas de archivos improvisadas o recursos externos sin registrar.

Debe administrar, como mínimo:

- logos;
- fotografías;
- fondos;
- videos;
- animaciones prerenderizadas;
- tipografías;
- marcas de agua;
- recursos de patrocinadores;
- audio futuro;
- previews y thumbnails.

### Modelo conceptual

```json
{
  "assetId": "string",
  "name": "string",
  "type": "image",
  "mimeType": "image/png",
  "scope": "organization",
  "ownerId": "string",
  "storageRef": "string",
  "checksum": "string",
  "version": "string",
  "status": "published",
  "visibility": "production",
  "dimensions": null,
  "duration": null,
  "variants": [],
  "rights": {},
  "metadata": {},
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### Ciclo de vida

1. Carga o registro.
2. Validación de tipo, tamaño, integridad y seguridad.
3. Generación de variantes y preview.
4. Revisión de derechos, visibilidad y scope.
5. Aprobación.
6. Publicación versionada.
7. Uso por referencia estable.
8. Deprecación o archivo sin romper composiciones históricas.

### Variantes

Un asset puede producir variantes por resolución, orientación, formato, transparencia, compresión o destino. Las plantillas solicitan una capacidad, no una ruta concreta. El resolver selecciona la variante adecuada y conserva fallback.

### Reglas de gobierno

- Cada asset tiene ID, owner, scope, checksum, versión y estado.
- Reemplazar un archivo publicado crea una versión nueva.
- Los derechos de uso deben incluir propietario, licencia, vigencia, territorio o restricciones cuando corresponda.
- Un asset vencido o revocado no se selecciona para nuevas escenas, pero debe conservarse para auditoría histórica según política.
- Los recursos privados no deben llegar a outputs públicos.
- Las fuentes externas deben descargarse o validarse mediante una política explícita; no se permiten dependencias remotas arbitrarias al aire.
- Deben existir cuotas, límites de tamaño, formatos permitidos y revisión de contenido.
- El sistema debe detectar referencias huérfanas antes de archivar.

### Relación con otros motores

Themes, templates, components, scenes y sponsors guardan `assetId` y versión. Asset Manager entrega metadatos y una referencia autorizada al renderer, pero no decide layout, visibilidad ni acciones.

## 30. Variables de producción

Las variables de producción permiten parametrizar una transmisión sin modificar plantillas o código. Representan decisiones operativas como título de bloque, mensaje libre, patrocinador seleccionado, número de cámara, duración de una cortinilla o etiqueta temporal.

No sustituyen al Broadcast Data Contract. Un resultado, participante, turno o tiempo deportivo oficial sigue llegando desde el contrato. Las variables solo aportan configuración y contexto de producción autorizado.

### Modelo conceptual

```json
{
  "variableId": "string",
  "key": "string",
  "label": "string",
  "dataType": "string",
  "value": null,
  "defaultValue": null,
  "scope": "tournament",
  "visibility": "production",
  "source": "operator",
  "writableBy": [],
  "validation": {},
  "ttl": null,
  "version": "string",
  "updatedAt": "ISO-8601",
  "updatedBy": null
}
```

### Tipos iniciales

- texto;
- número;
- booleano;
- color;
- fecha/hora;
- duración;
- enum;
- referencia a asset;
- referencia controlada a dato del contrato;
- objeto estructurado bajo esquema registrado.

No se permite JavaScript, expresiones arbitrarias ni objetos sin límite de tamaño o profundidad.

### Scopes y precedencia

```text
General
-> Organización
-> Torneo
-> Competencia
-> Charreada
-> Output
-> Usuario
-> Sesión
```

La resolución devuelve valor, versión, scope efectivo y procedencia. Un override de sesión no modifica el valor de torneo. Las variables con TTL regresan a su fallback al expirar.

### Escritura y consistencia

- Toda actualización pasa por Action Engine.
- Se validan tipo, permisos, rango, longitud y valor permitido.
- Las variables usadas en Program se resuelven en un snapshot consistente por revisión.
- Una escena puede bloquear variables críticas durante una transición.
- Los cambios concurrentes deben detectar revisión obsoleta.
- Los valores sensibles se filtran por output.
- Cada actualización relevante se audita.

### Fallback

El orden es: valor del scope más específico, valor heredado, `defaultValue`, fallback del componente. Si ninguno existe, el componente aplica su política de ausencia. Nunca se genera un dato deportivo ficticio.

## 31. Escenas y composiciones

Una escena es una composición operativa de plantillas, layers, variables, temas, transiciones y outputs. Permite preparar un estado visual completo, como apertura, competencia en vivo, pausa comercial, entrevista, premiación o emergencia.

Una escena no es un HTML y no duplica templates. Referencia recursos versionados y describe cómo deben convivir.

### Modelo conceptual

```json
{
  "sceneId": "string",
  "name": "string",
  "version": "string",
  "scope": "tournament",
  "status": "draft",
  "supportedOutputs": [],
  "layers": [],
  "templateInstances": [],
  "variableBindings": {},
  "themeId": "string",
  "layoutPreset": "string",
  "entryTransition": null,
  "exitTransition": null,
  "duration": null,
  "fallbackSceneId": null,
  "permissions": [],
  "validationRules": []
}
```

### Composición

Cada instancia de template debe declarar ID propio, template y versión, layer, variante, bindings, posición, visibilidad, output y política de reemplazo. Dos instancias pueden usar la misma plantilla con datos o posiciones distintas.

### Ciclo de vida

- borrador;
- validada;
- publicada;
- activa en Preview;
- activa en Program;
- deprecada;
- archivada.

Una escena publicada es inmutable. Los cambios crean otra versión. Preview puede probar borradores; Program solo acepta versiones publicadas o excepciones autorizadas y auditadas.

### Escenas universales por output

La misma escena lógica puede tener adaptaciones declarativas para Preview, Program, LED y monitores. El Layout Engine y el adaptador de output resuelven tamaño, orientación, safe area, densidad y capacidades. No se crea un HTML separado para cada destino.

### Operación

- `SEND_TO_PREVIEW` prepara la escena sin alterar Program.
- Take, Cut o Auto promueven la composición validada.
- El cambio de escena debe resolver layers persistentes, exclusivas y bloqueadas.
- Puede existir rollback a la escena anterior si la transición falla.
- Una escena de emergencia puede tener prioridad y permisos especiales.
- La recuperación de sesión nunca reactiva una escena al aire sin confirmación.

### Editor

La primera versión utilizará formularios declarativos, presets, ordenamiento y controles de propiedades validados. El editor visual avanzado con manipulación libre, guías y canvas llegará después de estabilizar componentes, layouts, outputs y validaciones.

## 32. Macros

Una macro es una secuencia reutilizable y controlada de acciones de producción. Sirve para ejecutar procedimientos frecuentes como preparar marcador, enviar a Program, esperar una duración, mostrar patrocinador y restaurar la escena anterior.

No es código arbitrario y no sustituye al Automation Engine. La macro define una secuencia invocada explícitamente o llamada por una automatización autorizada; Automation decide cuándo ejecutarla.

### Modelo conceptual

```json
{
  "macroId": "string",
  "name": "string",
  "version": "string",
  "scope": "tournament",
  "steps": [],
  "parameters": [],
  "permissions": [],
  "confirmBeforeExecute": false,
  "timeout": 0,
  "concurrencyPolicy": "reject",
  "onError": "stop",
  "compensationSteps": [],
  "audit": true,
  "enabled": true
}
```

### Pasos permitidos

- ejecutar una acción registrada;
- esperar una duración limitada;
- esperar confirmación de output;
- evaluar una condición declarativa permitida;
- invocar una macro registrada sin ciclos;
- solicitar confirmación humana;
- ejecutar compensación ante error.

### Protecciones

- No se acepta JavaScript o acceso directo a servicios.
- Deben validarse todas las acciones antes de iniciar cuando sea posible.
- Se limitan profundidad, duración, cantidad de pasos y concurrencia.
- Cada ejecución recibe ID, revisión y estado.
- Los pasos deben ser idempotentes o declarar su estrategia de reintento.
- Las macros detectan ciclos y dependencias faltantes.
- Una pausa o cancelación debe dejar Broadcast State en condición conocida.
- Los permisos efectivos son la intersección entre macro, actor, acción y output.
- El dry-run permite revisar efectos sin cambiar Preview o Program.

### Resultados y auditoría

Cada paso registra inicio, resultado, latencia, error y compensación. El resultado final distingue completada, parcial compensada, fallida, cancelada o expirada. Una macro nunca oculta los IDs de acciones que ejecutó.

## 33. Configuración y aislamiento por cliente

Broadcast Studio debe operar para múltiples clientes sin mezclar configuraciones, assets, outputs, permisos o estado en vivo. La personalización no se implementará mediante copias divergentes del código.

### Identificadores de aislamiento

Toda entidad configurable debe declarar, según corresponda:

- `tenantId`;
- `organizationId`;
- `clientId`;
- `tournamentId`;
- `competitionId`;
- `outputId`;
- `sessionId`.

`tenantId` es la frontera técnica principal. `organizationId` identifica a la organización operadora y `clientId` puede representar una marca, producción o cuenta comercial dentro del modelo autorizado. Ninguna consulta o acción debe depender solo de un nombre visible.

### Jerarquía de configuración

```text
Plataforma global
-> Tenant
-> Organización
-> Cliente
-> Torneo
-> Competencia
-> Output
-> Usuario
-> Sesión
```

Los niveles específicos crean overrides o extensiones; nunca mutan el nivel padre. La resolución debe devolver la procedencia de cada propiedad y permitir inspeccionar la configuración efectiva.

### Reglas de aislamiento

- Cada lectura, escritura, acción y suscripción valida `tenantId` y scope.
- Assets, templates, themes, scenes, macros, botoneras y outputs se almacenan en namespaces aislados.
- Compartir un recurso requiere publicación explícita en un catálogo autorizado; no se logra reutilizando IDs privados.
- Los outputs solo reciben datos y assets del contexto asignado.
- Preview y Program de clientes distintos nunca comparten estado mutable.
- Caché local, sesiones y colas se segmentan por tenant, torneo y output.
- Exportaciones y respaldos incluyen manifest de ownership y no contienen datos de otro cliente.
- Las personalizaciones white-label se resuelven por tema, assets y configuración, no por forks de código.
- Deben existir cuotas y límites por cliente para proteger la plataforma.
- La eliminación lógica de un cliente no destruye auditoría o históricos sujetos a retención.

### Configuración global protegida

Solo Super Admin puede publicar defaults globales. Los administradores de organización o cliente pueden derivar configuraciones dentro de permisos. Un override incompatible debe rechazarse o quedar en borrador; nunca degradar silenciosamente la configuración general.

### Portabilidad y continuidad

Cada cliente debe poder exportar sus configuraciones autorizadas con versiones y referencias de assets. La importación valida IDs, permisos, dependencias y compatibilidad antes de publicar. Debe existir fallback a defaults seguros si una configuración de cliente falta o queda inválida.

### Auditoría

La bitácora registra scope de origen, scope efectivo, actor, cambio, versión previa, versión nueva y outputs afectados. Esto permite demostrar que una personalización de un torneo o cliente no alteró a los demás.
