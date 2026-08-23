# Remaining Blockers

## Sporting blockers

`0`.

Cala, Coleadero 3x3, Suma Control, Terna, cierre, firmas y contra mascara no
requieren una nueva regla deportiva ni cambios en `FMCH_2026_LIBRE 0.6.0`.

## Documental blockers

`0`.

Las cuatro revisiones se cerraron con autoridad documental: control lateral de
Cala sin efecto deportivo; cuarta fila y cuarto control inferior de Coleadero
administrativos; y cuatro firmas manuales en orden `JUEZ / JUEZ / JUEZ /
CAPITÁN`. Los cinco FieldID institucionales quedaron resueltos exclusivamente
para la version 2024-2028 mediante `FMCH_TEAM_SHEET_2024_2028`; el conteo
vigente de `UNSUPPORTED_REAL_BLOCKER` es `0`.

Los dos assets visuales conservan URL y SHA del PDF, SHA del raster fuente,
geometria de crop y SHA del derivado. Los tres textos se reproducen literalmente.
No existe default global ni inferencia posterior a 2028.

## Exporter architecture blockers vigentes

`0` para el alcance certificado.

El golden XLSX es determinista, conserva el orden aprobado, embebe ambos PNG y
se valido mediante apertura y conversion real a PDF de una pagina. La salida no
crea una segunda autoridad: sigue siendo una proyeccion del snapshot oficial.

## Regla para el siguiente ticket

El exportador debe transformar la verdad oficial, no volver a calcularla. Los
controles documentales pueden verificar subtotales, pero nunca convertirse en
una segunda autoridad de puntuacion.
