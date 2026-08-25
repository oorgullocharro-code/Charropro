# Current Temporal Rule Matrix

Estado observado antes de editar, en el commit base `6f6913f8233d75159de9c90ff60d560a35deb5e0`.

| Suerte | Implementacion previa | Fuente efectiva previa | Certificacion temporal previa | Discrepancia |
|---|---|---|---|---|
| Cala | Sin `timerContract` | Ninguna | Incompleta | Faltaban revision de freno y salida del partidero |
| Piales | Sin `timerContract` | Ninguna | Incompleta | Faltaba plazo condicional 2/3 min por oportunidad |
| Coleadero | `timerRules.js` usaba 15 s; perfil sin contrato | Helper legacy | Incorrecta | Reglamento exige 20 s y pausa solo por toro atorado en tubos |
| Toro | 5 min; umbrales 3/4 min | `suerteMetadata.toro.timerContract` | Parcial | Faltaban inicio, fin, expiracion, efecto y fuente trazable |
| Terna Cabecero | 7 min compartidos | `suerteMetadata.lazo.timerContract` | Parcial | Faltaban condiciones de inicio/pausa/fin y efecto |
| Terna Pial | 7 min compartidos | `suerteMetadata.pial_ruedo.timerContract` | Parcial | Faltaban condiciones de inicio/pausa/fin y efecto |
| Yegua | 5 min; umbrales 3/4 min | `suerteMetadata.yegua.timerContract` | Parcial | Faltaba la fase de desmontarse de 1 min |
| Manganas Pie | 7 min | `suerteMetadata.manganas_pie.timerContract` | Parcial | Faltaban inicio alterno, pausas, expiracion y efecto |
| Manganas Caballo | 7 min | `suerteMetadata.manganas_caballo.timerContract` | Parcial | Faltaba cambio de faena de 2 min y sus efectos |
| Paso | 3 min + 1 min | `suerteMetadata.paso.timerContracts` | Parcial | Faltaban condiciones y semantica de ambas fases |

## Hardcodes y fallbacks

- `timerRules.js` contenia `colas.limitMs = 15000` como compatibilidad legacy no asociada a perfil.
- `getTimerRuleForSource()` conserva un fallback generico transcurrido cuando no hay regla explicita.
- La aplicacion ya deriva definiciones desde `timerContract(s)` del perfil cuando existen, pero esos contratos no expresaban el contrato reglamentario completo.
- La politica nueva no usa ese fallback: exige perfil y version exactos, suerte certificada y datos condicionales completos.

## Perfil deportivo

`FMCH_2026_LIBRE@0.6.0` produjo antes de la edicion el fingerprint `rptp_0f90f7a3944a82d7`. Esa referencia se usa como invariante y no fue modificada.
