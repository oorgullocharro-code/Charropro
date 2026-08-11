# Evidencia de Pruebas

## Automatizacion

| Validacion | Resultado |
| --- | --- |
| Suite completa | `62/62 PASS` |
| Node check | `162/162 PASS` |
| JSON | `21/21 PASS` |
| Test nuevo de Terna | PASS |
| Rule Profile Engine | PASS |
| Attempt V2 | PASS |
| Responsive Component System | PASS |
| Official Score Concurrency | PASS |
| Cala | PASS |
| Piales/Coleadero | PASS |
| Toro/Yegua | PASS |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |
| Secretos y debugger | PASS |
| Log de exito del test nuevo | REVISADO / SOLO TEST |

La cobertura dirigida incluye:

- perfil `FMCH_2026_LIBRE 0.5.0` y preservacion de `0.4.0`;
- catalogos de Cabecero y Pial;
- cinco oportunidades compartidas y bloqueo de la sexta;
- secuencia, reserva, commit, correccion e idempotencia;
- fallo de publicacion sin consumo;
- historial y remate repetido;
- cero separado de DQ;
- timer de siete minutos, pausa, reanudacion y tiempo de pared;
- coexistencia entre Terna y apretalamiento;
- adicional por tiempo;
- Attempt V2 y congelamiento oficial;
- compatibilidad legacy y score protection.

Tres aserciones de regresion que buscaban literalmente la antigua llamada `publishOfficialScoreForContext(context)` se actualizaron para validar el nuevo `publicationContext` con opciones. No se relajo el orden obligatorio: publicar primero y continuar el flujo despues.

## Validacion funcional local

Entorno: `LOCAL / EMULATOR`, proyecto sintetico `demo-charropro-local`. Auth, RTDB, Functions y Storage permanecieron en emuladores locales; no se usaron datos reales ni conexiones de Produccion.

Se verifico un ciclo completo con cinco oportunidades compartidas. En la validacion limpia final:

- Lazo Cabecero publico base 5 y correccion de tiempo 6, total oficial 11;
- Pial en el Ruedo publico base 8 y correccion de tiempo 6, total oficial 14;
- tres oportunidades adicionales quedaron oficialmente en cero;
- el total visible inmediato fue 25;
- las cinco oportunidades quedaron `CONSUMED` y congeladas;
- la sexta oportunidad fue rechazada;
- el avance ocurrio solo despues de 5/5;
- cambiar de Cabecero a Pial conservo timer, oportunidades e historial.

La pausa `Limpieza de ruedo` mantuvo el tiempo deportivo detenido mientras avanzo el tiempo de pared. La sesion Terna y un timer de apretalamiento conservaron contextos independientes.

## Responsive

Se verificaron iPad landscape, iPad portrait y desktop. En los tres casos el ancho del documento coincidio con el viewport, sin elementos fuera de limites ni scroll horizontal. Timer, oportunidades y footer permanecieron visibles o accesibles.

Evidencia minima:

1. `evidence/cabecero-ipad-landscape.jpg`
2. `evidence/pial-ipad-landscape.jpg`
3. `evidence/terna-ipad-portrait.jpg`
4. `evidence/terna-paused-visible.jpg`

## Operacion remota

- Firebase Production writes: `0`.
- Deploy: `NO`.
- Push: `NO`.
