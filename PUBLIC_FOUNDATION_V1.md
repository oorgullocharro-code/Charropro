# CharroPro Public Foundation V1

## Propósito

PUBLIC-FOUNDATION-001 establece una frontera pública segura y versionada para el Portal Público. El navegador público consume una sola ruta:

`charropro/publicTournaments/{tournamentId}`

El Portal no consulta el torneo privado, `scores`, `audit`, drafts ni `live/current`.

## Arquitectura

```text
Core deportivo
  -> publishedScores + live/current autorizado
  -> Public Projection Builder
  -> sanitización por allowlist
  -> validación schemaVersion 2
  -> conciliación monotónica
  -> transacción publicTournaments/{tournamentId}
  -> cliente público V2
  -> adaptador V1 encapsulado
  -> Portal actual
```

Los módulos son:

- `js/public/publicProjection.js`: normalización pública pura.
- `js/public/publicProjectionSchema.js`: sanitización, allowlists, validación y firma estable.
- `js/public/publicProjectionLegacyAdapter.js`: compatibilidad encapsulada con la vista anterior.
- `js/public/publicPortalClient.js`: revisiones, conexión, stale, offline y reconexión.

## Fuentes oficiales

- `turn.team` de `live/{tournamentId}/current` es la única fuente oficial del turno público.
- `publishedScores` válidos y no sustituidos son la única fuente de resultados públicos.
- `live/current` aporta contexto deportivo vigente al productor autorizado, pero no es una API pública general.
- El programa y las competencias proceden de las charreadas guardadas del torneo.
- El Portal Público no calcula posiciones oficiales.

Nunca se usa `meta.scoringTeamIdx`, el último score o el índice local para inferir turno. Nunca se usa `scores` privado como fallback.

## Contrato schemaVersion 2

La raíz contiene:

| Campo | Tipo | Propósito |
| --- | --- | --- |
| `schemaVersion` | number | Versión de esquema, siempre `2` |
| `projectionRevision` | number | Revisión monotónica global |
| `generatedAt` | ISO-8601 | Momento de escritura |
| `generatedAtMs` | number | Momento de escritura en milisegundos |
| `sourceUpdatedAt` | ISO-8601 | Última actualización oficial observada |
| `status` | string | `ready`, `live`, `finished` o `unavailable` |
| `metadata` | object | Identidad pública del torneo |
| `overview` | object | Contexto activo y resumen |
| `program` | object | Programa normalizado |
| `live` | object | Turno, timer seguro y resultado vigente |
| `competitions` | object | Competencias realmente detectadas |
| `results` | object | Resultados publicados por scope |
| `rankings` | object | Placeholder `unavailable` |
| `statistics` | object | Placeholder `unavailable` |
| `search` | object | Placeholder `unavailable` |

Cada sección tiene `revision` y `status`. `rankings`, `statistics` y `search` permanecen en revisión `0`, estado `unavailable` e items vacíos. No se inventan posiciones, estadísticas ni búsqueda.

## Resultados y scopes

Cada resultado conserva:

- competencia e instancia;
- categoría;
- fase;
- charreada;
- scope `team` o `individual`;
- identidad disponible de equipo o participante;
- scores publicados por suerte;
- subtotal de intentos publicados;
- total oficial solo cuando la fuente lo declara;
- posición oficial solo cuando la fuente la declara.

Si no existe posición oficial:

```json
{
  "officialPosition": null,
  "positionStatus": "unavailable"
}
```

No existe un motor público de ranking ni desempates. El orden de presentación es estable y no se etiqueta como posición.

Para datos legacy sin `competitionId`, la proyección genera un ID determinista a partir de tipo, categoría y nombre, con prefijo `legacy_`. No modifica IDs deportivos históricos y marca `legacy: true`.

## Normalización de suertes

La proyección reutiliza el catálogo de competencias existente. El valor público de una suerte procede primero del intento o breakdown publicado y después del total superior. Esto impide interpretar un total general legacy, por ejemplo `280`, como puntos de Cala cuando el breakdown oficial de ese intento es `35`.

El score almacenado no se modifica.

## Sanitización y validación

La sanitización usa listas permitidas por sección y por fila. Además:

- elimina funciones, símbolos, BigInt, getters y setters;
- controla ciclos, profundidad, arrays, claves y longitud de strings;
- bloquea `__proto__`, `constructor` y `prototype`;
- reemplaza números no finitos;
- conserva `0`, `false`, cadena vacía y `null`;
- elimina caracteres de control y delimitadores HTML;
- no copia objetos Firebase ni el torneo privado completo.

El escape HTML del render sigue siendo una segunda capa independiente.

`validatePublicProjection()` rechaza schema no soportado, revisiones inválidas, secciones faltantes, campos no permitidos y estructuras incompatibles.

## Revisiones e idempotencia

El productor construye un candidato puro y usa `runTransaction()` sobre la ruta pública. La conciliación:

1. calcula firma estable por sección;
2. excluye revisión y timestamps volátiles;
3. conserva revisión si el contenido no cambió;
4. incrementa solo las secciones modificadas;
5. incrementa `projectionRevision` una vez por cambio real;
6. aborta publicaciones idénticas;
7. rechaza fuentes con tiempo oficial regresivo;
8. evita que una revisión igual con contenido distinto se escriba desde RTDB.

Las llamadas concurrentes se vuelven a conciliar dentro de la transacción.

## Seguridad RTDB

- `publicTournaments/{tournamentId}` es legible públicamente.
- El navegador público no puede escribir.
- Solo usuarios activos con rol `supervisor`, `operador` o `juez`, y acceso al torneo, pueden ejecutar la publicación cliente actual.
- Las reglas exigen schema `2`, revisión creciente y secciones obligatorias.
- Campos de raíz y sección no permitidos son rechazados.
- `live/{tournamentId}` deja de ser públicamente legible.
- `supervisor`, `operador`, `juez`, `locutor` y `graficos` conservan lectura operativa autenticada y limitada al torneo.

Los consumidores legacy de live intentan primero el canal operativo autorizado y, ante denegación pública, reciben una adaptación segura desde `publicTournaments`. No reciben notas, sesiones Broadcast, roles ni configuración operativa.

## Consumidor público

El cliente:

- mantiene un listener de la proyección;
- mantiene un listener de `.info/connected`;
- acepta schema V1 mediante adaptador;
- prefiere schema V2;
- rechaza revisiones menores;
- ignora revisiones duplicadas;
- conserva la última vista válida ante errores;
- actualiza solo el indicador de conexión cuando no cambian datos;
- elimina listeners y temporizador al destruir la página.

Estados:

- `connecting`: aún no existe revisión válida;
- `online`: conexión y revisión válida;
- `stale`: la fuente supera 120 segundos sin actualización;
- `offline`: Firebase reporta desconexión;
- `reconnecting`: vuelve la conexión y se espera revisión;
- `error`: snapshot inválido o error persistente.

## Compatibilidad legacy

Schema V1 sigue siendo legible. La compatibilidad está concentrada en un adaptador y no puede:

- usar scores privados;
- sustituir `turn.team`;
- inventar posiciones;
- fusionar entidades por nombre;
- exponer datos operativos.

Los gráficos V1 e interfaces internas autenticadas mantienen su contrato operativo mediante el fallback seguro de live.

## Pruebas

La cobertura específica incluye:

- construcción, sanitización y validación V2;
- turno oficial;
- score privado excluido;
- correcciones y sustituciones;
- competencia, categoría, fase y charreada;
- equipos e individuales;
- anomalía Cala 280;
- revisiones, firmas, idempotencia y regresión;
- V1, offline, stale, reconexión y deduplicación;
- reglas RTDB mediante inspección estructural y matriz de adapter falso;
- secuencia integral aislada sin Firebase de producción.

La máquina local no incluye Java, por lo que las reglas se validan con el mecanismo estático ya utilizado por el repositorio y un adapter falso. Deben validarse adicionalmente con Firebase Emulator Suite antes de desplegar reglas.

## Limitaciones

- No existe ranking oficial público hasta que el Core publique posiciones.
- No hay Top, búsqueda ni estadísticas.
- No se rediseña el Portal.
- No se despliegan reglas desde este ticket.
- No se escribe en Firebase de producción durante las pruebas automatizadas.
- El productor sigue ejecutándose en clientes internos autorizados; una futura función de backend puede asumir esa responsabilidad sin cambiar el contrato.
