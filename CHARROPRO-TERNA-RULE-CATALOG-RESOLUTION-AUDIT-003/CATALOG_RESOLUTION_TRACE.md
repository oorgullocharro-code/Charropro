# Catalog Resolution Trace

## Catalogo observado antes

Todos los elementos observados provienen de `SUERTES` en `js/data/suertes.js`, suerte `lazo`, y llegan a la UI a traves de `PRODUCT_BASE`.

| Elemento visible | Rule ID | Grupo | Origen | Clasificacion |
| --- | --- | --- | --- | --- |
| Base Lazo (10) | `lb1` | base | `js/data/suertes.js` | Product Base generico |
| Remate (+12) | `la1` | adic | `js/data/suertes.js` | Product Base generico |
| Remate (+14) | `la2` | adic | `js/data/suertes.js` | Product Base generico |
| Remate (+16) | `la3` | adic | `js/data/suertes.js` | Product Base generico |
| Floreo (+1) | `la4` | adic | `js/data/suertes.js` | Product Base generico |
| Floreo (+2) | `la5` | adic | `js/data/suertes.js` | Product Base generico |
| T. Ahorrado (+1) | `la6` | adic | `js/data/suertes.js` | Product Base generico |
| Falta menor (-1) | `li1` | infr | `js/data/suertes.js` | Product Base generico |
| Falta grave (-2) | `li2` | infr | `js/data/suertes.js` | Product Base generico |
| Tiempo (-1) | `li3` | infr | `js/data/suertes.js` | Product Base generico |

La definicion del repositorio dice `T. Ahorrado`; la observacion inicial lo transcribio como `T. Ahorcado`. No se modifico ninguna de las dos cadenas porque el problema no era textual.

## Comparacion contra FMCH 2026 Libre 0.6.0

| Campo | Perfil esperado | Resuelto antes | Origen esperado |
| --- | --- | --- | --- |
| Base | 4 reglas: 5, 5, 8, 10 | 1 regla: 10 | `FMCH_2026_LAZO_BASE_RULES` |
| Adicionales | 20 reglas | 6 reglas genericas | `FMCH_2026_LAZO_ADIC_RULES` |
| Infracciones | 19 reglas | 3 reglas genericas | `FMCH_2026_LAZO_INFR_RULES` |
| Descalificaciones | 15 reglas | 2 reglas genericas | `FMCH_2026_LAZO_DESC_RULES` |
| Infracciones de equipo | 0 | 0 | `FMCH_2026_LAZO_TEAM_PENALTY_RULES` |
| Intentos | maximo compartido 5 de Terna | 3 del Product Base | metadata del perfil |
| Cronometro | compartido de Terna, 7 min | sin metadata FMCH | metadata del perfil |

## Bases FMCH verificadas

| Rule ID | Etiqueta | Puntos |
| --- | --- | --- |
| `lazo_base_sencillo` | Sencillo | 5 |
| `lazo_base_toro_echado` | Sencillo o floreado con toro echado | 5 |
| `lazo_base_efecto` | De efecto | 8 |
| `lazo_base_floreado` | Floreado | 10 |

Los adicionales, infracciones y descalificaciones no fueron reconstruidos ni hardcodeados. Se consumen directamente desde `js/data/fmch2026TernaRules.js` mediante las reglas del perfil en `js/data/ruleProfiles.js`.

## Evidencia posterior

En `Denver - Charreada 3`, el scorer mostro:

- las cuatro bases FMCH;
- 20 adicionales, incluidos Arracadas, Espejos, resortes, giros, remate atras y condiciones de primera oportunidad;
- 19 infracciones FMCH;
- 15 descalificaciones FMCH;
- 5 oportunidades compartidas;
- cronometro de Terna en 07:00.0;
- `Lazo Cabecero` como fase inicial y `Pial en el Ruedo` como fase posterior.

No aparecieron `lb1`, `la1`-`la6`, `li1`-`li3` ni `ld1`-`ld2` en la nueva charreada.
