# Broadcast Program Projection V1

## Proposito

Program Projection V1 corrige la perdida de composicion entre Preview Engine, Program Engine y Output Routing. Su version es `1.0.0` y la version de aplicacion asociada es `20260715-program-projection-001b-theme-preparation-export-v1`.

El modulo no renderiza Program Main. Transporta una descripcion declarativa, serializable y segura para que una salida oficial futura pueda representarla sin consultar Preview, Firebase o estructuras internas.

## Arquitectura

El flujo oficial es:

```text
Template + Theme Integration
  -> Preview Engine
  -> Preview Snapshot declarativo
  -> Program Engine
  -> Program Snapshot declarativo
  -> Output Routing
  -> Browser Output Infrastructure
  -> futuro Program Main Output
```

Preview prepara la composicion. Program toma una copia oficial al ejecutar Take, Cut o Auto. Output Routing solo reenvia la proyeccion sanitizada. Ninguna etapa reconstruye datos deportivos ni consulta una etapa anterior despues del Take.

## Frontera Preview y Program

Preview obtiene la declaracion desde la preparacion ya resuelta por Theme Template Integration. La declaracion queda separada del DOM y contiene solo datos reproducibles.

Theme Template Integration expone la preparacion vigente como `result.preparation` en render y update, y como `renders[].preparation` en su snapshot. El valor es una copia sanitizada y desacoplada del registro interno. Una actualizacion de Theme reconstruye la preparacion desde la base y no reutiliza estilos, assets ni metadata de la revision anterior.

Program copia la revision disponible en el Preview Snapshot. Despues de Take, Cut o Auto, cambios posteriores en Preview no alteran Program. Program cambia unicamente mediante otra operacion oficial.

## Coherencia Theme y preparation

Preview prioriza la preparacion devuelta por la operacion real de Theme Template Integration. Solo conserva la preparacion anterior cuando la operacion no cambia Theme, Template, bindings, contexto, visibilidad o snapshot fuente.

Antes de aceptar una actualizacion valida:

- `themeId` de resultado y preparacion deben coincidir;
- `templateId` debe permanecer coherente;
- `themeVersion` debe coincidir cuando ambas partes la declaran;
- la operacion debe devolver expresamente la preparacion reconstruida; `preparedAt` y `updatedAt` pueden ser instantes consecutivos y no se comparan como si fueran una misma revision;
- los componentes con metadata de Theme deben declarar el mismo `appliedThemeId`.

Si falta la nueva preparacion o pertenece a otro Theme, Preview rechaza atomicamente con `preview-theme-preparation-mismatch` y conserva su ultimo estado valido. Los adaptadores simulados siguen sirviendo para pruebas unitarias, pero la regresion principal usa Theme Template Integration y Template Renderer reales hasta Output Routing.

## Contrato

Un Program activo incluye:

```json
{
  "projectionVersion": "1.0.0",
  "programId": "program_main",
  "previewId": "preview_main",
  "templateId": "template_scoreboard",
  "themeId": "theme_default",
  "composition": {},
  "components": [],
  "layers": [],
  "sourceRevision": 12,
  "programRevision": 4,
  "generatedAt": "ISO-8601"
}
```

`sourceRevision` identifica el Preview Snapshot tomado. `programRevision` coincide con la revision oficial de Program. `generatedAt` registra la operacion oficial que produjo esa version.

## Composition

`composition` contiene:

- `compositionVersion` y `compositionId`;
- identidad `templateId` y `themeId`;
- `rootComponentId`;
- `components`, `layers` y `order`;
- `geometry` con ancho, alto y orientacion;
- `safeArea`;
- `transparentBackground` y fondo resuelto;
- datos globales sanitizados;
- metadata declarativa segura.

No contiene DOM, nodos, documentos, renderer, listeners, callbacks, timers, sockets, referencias Firebase ni objetos runtime.

## Components

Cada componente conserva:

- identidad de instancia y tipo;
- padre y capa cuando existen;
- orden y visibilidad;
- geometria, escala, rotacion y opacidad;
- estilos y propiedades ya resueltos;
- contenido y datos sanitizados;
- referencias autorizadas por `assetId`, version y variante;
- metadata segura.

El orden se determina primero por la declaracion de la preparacion y despues por `zIndex` e identidad. No existe un limite deportivo de tres equipos; el limite tecnico V1 es de 300 componentes.

## Layers y geometria

Las capas agrupan componentes por `layerId`, conservan orden, `zIndex`, visibilidad e IDs de componentes. Si la preparacion no declara capas explicitas, se derivan de forma determinista sin inventar componentes.

La geometria general proviene de la resolucion preparada para el output. La geometria de cada componente conserva posicion, dimensiones, anchor, escala, rotacion, `zIndex`, safe area y reglas responsive declarativas.

## Take, Cut y Auto

Take, Cut y Auto transportan el mismo contrato. La operacion solo cambia `transitionMode` y la revision oficial; no elimina componentes, capas, Template o Theme y no implementa animaciones nuevas.

## Program vacio

La politica unica es:

```json
{
  "state": "controlled-empty",
  "composition": null,
  "components": [],
  "layers": []
}
```

Un Program vacio no es una composicion invalida ni un error. Output Routing conserva el estado `controlled-empty`.

## Program activo

Cuando Preview contiene una composicion valida, Program activo conserva `composition`, `components`, `layers`, Template, Theme, resolucion, visibilidad, revisiones y timestamps. Program Snapshot es una copia desacoplada y serializable.

## Inmutabilidad

No se comparten referencias mutables entre:

- preparacion y Preview;
- Preview y Program;
- Program y Program Snapshot;
- Program Snapshot y Output Routing;
- componentes anidados, metadata y referencias de assets.

Modificar cualquier snapshot o resultado de routing no altera el estado interno. Un cambio posterior en Preview tampoco altera Program.

## Seguridad

La clonacion controlada:

- rechaza funciones, simbolos, BigInt, ciclos, getters y setters;
- bloquea `__proto__`, `constructor` y `prototype`;
- elimina referencias runtime y secretos;
- rechaza HTML ejecutable y protocolos `javascript:`, `file:`, `data:text/html` y `vbscript:`;
- rechaza CSS textual con `expression`, `@import` o URLs ejecutables;
- limita profundidad, claves, arreglos, longitud de texto y componentes;
- conserva `0`, `false`, cadena vacia y `null`.

Las referencias de assets solo transportan identidad declarativa. No transportan URLs firmadas.

## Visibilidad

La proyeccion nunca eleva visibilidad. Un snapshot solicitado como publico aplica la sanitizacion publica aunque la fuente sea mas restringida: elimina tenant, organizacion, cliente, sesion, actores y notas operativas. Produccion conserva contexto autorizado y Output Routing vuelve a aplicar su propia politica.

## Multi-tenant

El contexto puede conservar `tenantId`, `organizationId`, `clientId`, `tournamentId`, `competitionId` y `sessionId` en niveles autorizados. Program rechaza una operacion cuando Preview y el contexto solicitado tienen identidades incompatibles. No existe fallback cruzado entre tenants, torneos, competencias o sesiones.

## Program Snapshot

Program Snapshot incluye identidad de Program, Template y Theme, composicion, componentes, capas, salida, visibilidad, revisiones y diagnosticos. No incluye DOM, runtime, renderer, listeners, actores ni secretos. La copia devuelta puede modificarse sin afectar Program.

## Output Routing

La ruta `program-main` valida Program Snapshot y reenvia:

- `projectionVersion`;
- `programId` y revisiones;
- `templateId` y `themeId`;
- `composition`, `components` y `layers`;
- output, visibilidad y diagnosticos seguros.

Output Routing no consulta Preview y no muta Program Snapshot.

## Limitaciones

- No renderiza Program Main.
- No crea Browser Source ni URL productiva.
- No conecta OBS, vMix o Wirecast.
- No usa Firebase, sockets, polling ni persistencia.
- No modifica Browser Output.
- No implementa Animation Engine.
- No controla Preview ni Program fuera de las operaciones existentes.
- Las integraciones legacy sin composicion siguen siendo validas, pero solo las nuevas proyecciones incluyen el contrato declarativo completo.
- Theme Template Integration mantiene su version `1.0.0`: `preparation` es un campo aditivo compatible y los consumidores anteriores pueden ignorarlo.
