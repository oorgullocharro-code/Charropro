# Inventario de rankings

| Ranking | Estado previo | Fuente | Propietario previo | Consumidores | Resultado |
| --- | --- | --- | --- | --- | --- |
| Equipos por charreada | Implementado | score local/oficial | `scoring.js` | Supervisor/output | Comparador compartido; output usa solo Official Score |
| Equipos agregado del torneo | Implementado privado | acumulacion por charreada | `scoring.js` | Supervisor/output | Proyeccion oficial agregada por competencia |
| Caladero individual | Implementado | Official Score de Cala | proyeccion/resultados | Portal/output | Certificado por fixture dirigido |
| Coleadero individual | Implementado | Official Score de Colas | proyeccion/resultados | Portal/output | Certificado por fixture dirigido |
| Public ranking agregado | Parcial | filas publicas por charreada | cliente Portal | Portal Publico | Recuperado desde `rankings.items` |
| Legacy generalRanking | Legacy | `results.items` | adaptador legacy | consumidores compatibles | Ahora deriva de ranking oficial agregado |

No existe Top N fijo en la autoridad. Los consumidores actuales muestran todos
los registros y pueden limitar visualmente sin alterar el orden oficial.

## Clasificacion arquitectonica

- `Official Score`: CANONICAL.
- `publicProjection.results`: PROJECTION documental por charreada.
- `officialRanking.js`: CANONICAL RANKING PROJECTION.
- ordenamiento previo del Portal: DUPLICATE/CLIENT_DERIVED, conservado solo como
  fallback de compatibilidad para snapshots antiguos.
- standings previos de output basados en estado mutable: reemplazados por la
  proyeccion de Official Score.
