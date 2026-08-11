# CHARROPRO-SCORER-INFORMATION-HIERARCHY-COMPACTION-001

## Resultado

Se compacto la jerarquia comun del calificador sin crear un scorer paralelo y sin cambiar reglas deportivas. La pantalla ahora presenta, en este orden:

1. Contexto compacto de la suerte.
2. Total y timer vigentes.
3. Clasificacion dinamica cuando aplica.
4. Controles deportivos especializados y botonera positiva.
5. Infracciones, infracciones de equipo, DQ y evidencia como expandibles inline.
6. Footer estable con Deshacer, Marcar 0 y Guardar y siguiente.

## Implementacion

- `renderScoringHeader()` muestra una sola zona de contexto con suerte, equipo, participante, caballo cuando existe y oportunidad.
- El selector de equipo queda disponible en un expandible compacto y conserva sus acciones existentes.
- `renderScoringLiveOverview()` usa el view model existente para presentar total, desglose y timers sin recalcular valores.
- La clasificacion dinamica se renderiza antes del panel especializado porque puede modificar `resolvedValue`.
- Base y adicionales permanecen abiertos; infracciones, penalizaciones de equipo y DQ permanecen dentro del scorer mediante `details` nativos.
- Evidencia y nota permanecen disponibles mediante un expandible inline.
- Los timers de Terna, Manganas y Paso usan los actualizadores oficiales existentes; no se creo autoridad temporal nueva.
- El area de trabajo desktop se limita a 1600 px y escala sin scroll horizontal en tablet y movil.

## Invariantes preservados

- Rule Profile `FMCH_2026_LIBRE` `0.6.0`.
- Attempt V2 schema `2`.
- Publicacion oficial, proteccion de score, concurrencia e historial.
- Formulas, valores, catalogos, DQ, oportunidades, clasificaciones y matrices dinamicas.
- Timers deportivos existentes.
- Semantica `ZERO != DQ`.

## Operacion real

Con rol Juez y emuladores locales se valido:

- Base `20`, adicional `+2` e infraccion `-1`: total inmediato `21 pts`.
- Deshacer disponible y estable.
- Marcar 0 produce `Cero no logrado`, no DQ.
- Guardar y siguiente publica el score sintetico y avanza de Charros Demo del Norte a Rancheros de Ensayo.
- `publishedScores` conserva Attempt V2, Rule Profile `0.6.0`, actor y total oficial.

No hubo push, deploy ni escritura en Firebase Production.
