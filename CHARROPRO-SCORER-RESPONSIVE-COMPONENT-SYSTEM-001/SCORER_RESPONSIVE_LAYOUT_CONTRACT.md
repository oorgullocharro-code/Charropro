# Scorer Responsive Layout Contract

## Contrato general

- Una sola raiz de scorer.
- Scroll vertical en el documento.
- Cero scroll horizontal en el scorer.
- Footer sticky accesible y con `env(safe-area-inset-bottom)`.
- Contenido inferior con espacio suficiente para no quedar cubierto.
- Botones deportivos con objetivo tactil minimo de 56 px.
- Labels largos con wrap; no se trunca informacion critica.
- Mismos componentes y jerarquia en landscape, portrait y desktop.

## Jerarquia

1. Contexto real de torneo, jornada, suerte, equipo/participante, caballo, oportunidad y estado.
2. Estado actual y navegacion de turno.
3. Calculador especializado o base/clasificacion.
4. Adicionales.
5. Infracciones individuales.
6. Infracciones al equipo.
7. Descalificacion y estados especiales.
8. Tiempo, evidencia y nota.
9. Resumen Attempt V2.
10. Footer operativo.

## Geometria

El layout usa grids fluidos con `repeat(auto-fit, minmax(min(100%, var(--scorer-rule-min)), 1fr))`. El ancho minimo se reduce solo en el breakpoint compacto; la preferencia es menos columnas y mas scroll vertical. Ninguna suerte obtiene una hoja CSS propia.

## Footer

El footer conserva, sin funciones nuevas:

- estado de conexion/guardado;
- Ajustar botonera;
- Deshacer, que sigue ejecutando `previousScore()`;
- Marcar 0, que sigue ejecutando `toggleAttemptZero()` y nunca equivale a DQ;
- Guardar y siguiente, que sigue ejecutando `nextScore()`.

La publicacion deshabilita reentradas mediante las guardas existentes. Un error mantiene el intento actual y muestra feedback; no avanza.

## Estados visuales

- Seleccionado: contraste, borde y `aria-pressed` cuando aplica.
- Disabled: visible, atenuado y con razon disponible en el modelo.
- DQ: etiqueta `Descalificacion`, color rojo y selecciones conservadas.
- Zero: color ambar y estado distinto de DQ y no iniciado.
- Puntos buenos: verde.
- Puntos malos e infracciones de equipo: rojo/ambar segun el bloque.
- Focus: anillo visible para teclado.

## Modales y formularios

Los modales existentes conservan scroll vertical y acciones visibles. Los formularios manuales muestran concepto, valor, confirmar y cancelar. El editor de botonera no fue redisenado.

## Prohibiciones verificadas

- No panel lateral obligatorio.
- No tabla ancha como interfaz principal.
- No sticky para secciones grandes.
- No `overflow-x: auto` dentro del scorer.
- No reglas deportivas en CSS.
- No segundo scorer por viewport o suerte.
