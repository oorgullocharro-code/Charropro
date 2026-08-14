# Responsive Checkpoint

## Viewports de control

La validacion del checkpoint cubre:

- 1600 x 900;
- 1366 x 768;
- 1280 x 720;
- 1024 x 768;
- movil representativo 390 x 844.

## Contrato

- sin scroll horizontal de pagina;
- footer y CTA Guardar accesibles;
- cabecera compacta y contexto operativo visible;
- workspace utilizable sin perseguir porcentajes rigidos;
- Manganas conserva dashboard horizontal y reflow movil;
- Paso conserva controles, timers y contexto sin superposicion;
- Terna conserva fase, oportunidades, timer compartido y CTA.

La meta aproximada sigue siendo header cercano a 22%, workspace al menos 70% en el viewport operativo y footer cercano a 7%, subordinada a la usabilidad real.

## Evidencia final

| Viewport | Raices | Overflow horizontal | Footer | Reglas visibles | Resultado |
| --- | ---: | ---: | --- | ---: | --- |
| 1600 x 900 | 1 | 0 | visible | 51 | PASS |
| 1366 x 768 | 1 | 0 | visible | 51 | PASS |
| 1280 x 720 | 1 | 0 | visible | 51 | PASS |
| 1024 x 768 | 1 | 0 | visible | 51 | PASS |
| 390 x 844 | 1 | 0 | visible | 51 | PASS |

Manganas, Paso y Terna se inspeccionaron tambien en el cliente real. Los tres conservaron una sola superficie operativa, footer accesible y overflow horizontal igual a cero.
