# Reconciliacion de reglas

## Autoridad

- Fuente: `Reglamento-Oficial-Charros-Libre-y-Juvenil-24-28-VF2-2026.pdf`.
- SHA-256: `1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b`.
- Perfil origen: `FMCH_2026_LIBRE 0.6.0`.
- Perfil derivado: `FMCH_2026_LIBRE 0.6.1`.

## Contrato

La identidad de fase canonica es `freno_review`, equivalente al dominio
deportivo `BRAKE_REVIEW`. Las reglas exclusivas de revision quedan fuera de la
resolucion normal de Cala. Las reglas que tambien aplican durante la ejecucion
declaran `phaseIds: [freno_review, cala_execution]`.

La consulta `getRuleProfileRulesByPhase()` devuelve copias desacopladas y omite
aliases deshabilitados. La fase devuelve exactamente 17 reglas deportivas.

## Consecuencias

- Los malos se conservan en `CALA.BAD_POINT_01..08`, `BAD_POINTS_TOTAL` y
  `PARTIAL_POINTS`.
- Las descalificaciones usan estado DQ y `CALA.TOTAL`.
- `CALA.T` conserva exclusivamente su semantica de punta.
- No se agregan celdas ni columnas.

Los dos conceptos `NOT_SCORING` permanecen como metadata documental: cambio por
fuerza mayor autorizado y espera/desfile/llamada posterior de los jueces.
