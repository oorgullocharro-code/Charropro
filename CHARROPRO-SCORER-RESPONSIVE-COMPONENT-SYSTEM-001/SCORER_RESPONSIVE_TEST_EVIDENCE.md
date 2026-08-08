# Scorer Responsive Test Evidence

## Evidencia visual

| Escenario | Archivo | Resultado |
| --- | --- | --- |
| iPad landscape, muchas reglas y footer | `evidence/ipad-landscape-rules.jpg` | PASS |
| iPad portrait, evidencia/nota y footer | `evidence/ipad-portrait-evidence.jpg` | PASS |
| Desktop, DQ/resumen/footer | `evidence/desktop-summary.jpg` | PASS |
| Cala, calculador de punta | `evidence/cala-punta.jpg` | PRESERVADO |

Todas las capturas usan el torneo `DEMO LOCAL / NO OFICIAL`, el entorno LOCAL/EMULATOR y datos sinteticos. No contienen datos reales.

## Mediciones DOM

| Viewport | Horizontal overflow | Vertical scroll | Footer visible | Root count | Rule count | Overflow nodes |
| --- | ---: | --- | --- | ---: | ---: | ---: |
| 1020 x 765 | 0 px | Si | Si | 1 | 26 | 0 |
| 765 x 1020 | 0 px | Si | Si | 1 | 26 | 0 |
| 1440 x 900 | 0 px | Si | Si | 1 | 26 | 0 |

## Validacion funcional real

- Login del juez sintetico: PASS.
- Recorrido de las diez suertes reales: PASS; cada una conserva Evidence, Summary y Footer.
- Cala y su calculador de punta: PASS, sin cambios de formula o handlers.
- Editor de botonera con supervisor sintetico: abre y cierra; PASS.
- Evidencia: se captura sin cambiar el total de 20 puntos; PASS.
- Nota: permanece en el intento durante el flujo; PASS.
- Error de publicacion: mantiene turno, intento y evidencia, muestra `Error al publicar` y no avanza; PASS.
- Publicacion exitosa real: no ejecutable en esta sesion porque la Suite externa activa pertenece a `charropro-e8a68`, mientras el cliente local exige `demo-charropro-local`, y el proceso externo no puede detenerse desde este entorno. La ruta de exito se cubre con las suites de publicacion/concurrencia.
- Editor en rol juez: visible pero disabled por permiso; comportamiento preservado.
- Marcar 0 sobre intento ya calificado: disabled por guarda existente; comportamiento preservado.

## Fixtures

`tests/fixtures/scorer-responsive-viewport.html` carga el scorer real dentro de un viewport fijo y mide layout. Las pruebas dinámicas de clasificacion estan marcadas TEST/DUMMY; no se agregaron al catalogo productivo.

## Pruebas cubiertas

- Attempt V2, DQ, zero, manuales y team infractions.
- Reglas efectivas, label largo y boton disabled.
- Un timer, multiples timers y timer compartido.
- Oportunidad y oportunidad compartida.
- Remate history.
- Specialized calculator slot.
- Footer y semanticas existentes.
- Cache-buster unico.
- Score protection y publicacion oficial mediante suites existentes.

## Resultado tecnico final

- `node --check`: 155 archivos JavaScript/MJS, todos correctos.
- Suite completa: 58/58 suites aprobadas.
- JSON: 21/21 documentos validos.
- `git diff --check`: correcto.
- Pruebas dirigidas de componentes, Attempt V2, Rule Profile Engine, score protection, publicacion atomica, live feed, contexto y Cala: aprobadas.
- Dependencias nuevas: 0.
- Firebase produccion: 0 escrituras.
- Deploy: no.
- Push: no.

## Limitaciones declaradas

Classification, shared timer, multiples timers y remate history son infraestructura de presentacion. No incluyen tablas deportivas reales ni engines nuevos. `FMCH_2026_LIBRE` sigue sin activarse.
