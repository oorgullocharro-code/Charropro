# Production Evidence

## Sesion observada

- URL: `https://orgullocharro.com/charropro/torneo.html?tournamentId=torneo_msse2f1n_ogcwk8&view=scoring&charreada=charreada_msse332f_bng8pl`.
- Rol visible: Supervisor, modo revision.
- Suerte visible al abrir: Pial en el Ruedo.
- Estado visible: oportunidad 3/5, calificada.
- Publicaciones nuevas: 0.

La pantalla mostro el modal de preparacion del dispositivo. No se ejecuto
`Limpiar cache local` porque borraria estado local del navegador. El DOM ya
renderizado permitio inspeccionar la botonera efectiva sin operar el scorer.

## Botonera efectiva observada

```text
Base Pial (10)
Remate (+10)
Remate (+12)
Remate (+14)
Floreo (+1)
Floreo (+2)
T. Ahorrado (+1)
Falta menor (-1)
Falta grave (-2)
Tiempo (-1)
```

Tambien estaban presentes las descalificaciones Product Base `Cero en la
Suerte` y `Soltar soga`.

Esta lista coincide con `SUERTES[pial_ruedo].catalog` de Product Base y no con
el catalogo FMCH 0.6.0, que contiene 15 bases, 23 adicionales, 17 infracciones,
3 infracciones al equipo y 21 descalificaciones.

## Version y cache

El unico entrypoint cargado por la pagina fue:

```text
js/tournamentApp.js?v=20260813-scorer-operational-stabilization-checkpoint-001-v1
```

Coincide con `torneo.html` y `js/tournamentApp.js` del commit base. No se
detecto un cache-buster antiguo como causa primaria.

## Captura

Se capturo una imagen temporal en:

`/tmp/charropro-production-product-base-pial-ruedo.png`

No se versiono porque el ticket exige nueve documentos y la captura contiene el
estado visual de una sesion productiva. El modal oculta visualmente parte del
scorer, por lo que la evidencia precisa de botones proviene del DOM renderizado.

## Estado por suerte

No se navego por las diez suertes porque cambiar la seleccion en el scorer
productivo puede alterar estado operativo. Al no existir un perfil FMCH
seleccionable ni un torneo productivo seguro asignado, la validacion FMCH queda:

| Suerte | Resultado contra FMCH 0.6.0 |
| --- | --- |
| Cala | FAIL: perfil efectivo Product Base, confirmado por scores oficiales |
| Piales | FAIL: perfil efectivo del torneo es Product Base |
| Colas | FAIL: perfil efectivo del torneo es Product Base |
| Toro | FAIL: perfil efectivo del torneo es Product Base |
| Terna Cabecero | FAIL: perfil efectivo del torneo es Product Base |
| Terna Pial | FAIL: botonera Product Base reproducida directamente |
| Yegua | FAIL: perfil efectivo del torneo es Product Base |
| Manganas Pie | FAIL: perfil efectivo del torneo es Product Base |
| Manganas Caballo | FAIL: perfil efectivo del torneo es Product Base |
| Paso | FAIL: perfil efectivo del torneo es Product Base |

`FAIL` significa que no coincide con FMCH esperado; no significa que la UI
Product Base este rota.

## Evidencia Local/Emulator reutilizada

El checkpoint aprobado del mismo commit de cliente documento:

- FMCH 0.6.0 resuelto con `RULE_PROFILE` en una charreada local;
- Cabecero con cuatro bases FMCH, sin reglas genericas `lb1/la1/li1`;
- FAIL de Cabecero conserva Cabecero y avanza oportunidad;
- Manganas, Paso y Terna sin overflow;
- una sola raiz, footer accesible y 51 reglas visibles en los cinco viewports;
- Firebase Production Writes: 0.

En esta continuacion Auth, RTDB, Functions y Storage Emulator estaban activos.
El servidor local se levanto en `127.0.0.1:8766`, pero la nueva sesion del
navegador quedo detenida en la preparacion/login local. No se borraron caches ni
se ingresaron credenciales. La evidencia visual vigente se sustenta en el
checkpoint ya aprobado y en las 16 suites dirigidas reejecutadas.

## Conclusion visual

Produccion demuestra la seleccion Product Base. Local/Emulator y las pruebas
demuestran que el mismo cliente puede representar FMCH 0.6.0. La diferencia es
el binding/lifecycle, no el render del scorer.
