# Cache Analysis

## Politica final

El cache conserva resultados resueltos y no vacios. Un resultado vacio no se considera estable porque puede significar asignacion productiva pendiente.

La firma incluye ahora:

- identidad y tipo de charreada;
- lista explicita de suertes;
- identidad y tipo de torneo;
- perfil/version/fingerprint efectivos;
- autoridad, estado, revision y fingerprint de asignacion;
- version, ID, perfil, version y estado enabled de la politica;
- revisiones de overrides.

## Invalidacion

Cambiar asignacion, revision o politica invalida sin abandonar el cache. Cambiar torneo o charreada continua separado por identidad. Un tipo no soportado conserva el guard pero no contamina una futura resolucion valida.

## Local cache

No se borra `localStorage`. La solucion acepta el objeto actualizado desde la fuente vigente y evita convertir una lectura provisional en autoridad persistente.
