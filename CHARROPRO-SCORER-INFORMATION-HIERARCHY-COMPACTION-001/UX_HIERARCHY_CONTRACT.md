# Contrato de jerarquia UX del calificador

## Usuario principal

El juez es el usuario principal. La interfaz prioriza la operacion `boton -> resultado -> guardar` y evita mostrar informacion tecnica o repetir contexto sin una funcion operativa.

## Zonas comunes

### 1. Contexto

Ruta DOM: `[data-scorer-zone="context"]`

Muestra:

- suerte;
- equipo o participante competitivo;
- charro;
- caballo cuando existe;
- oportunidad y estado;
- torneo y jornada como referencia secundaria.

El cambio de equipo permanece disponible como control inline colapsable.

### 2. Total y tiempo

Ruta DOM: `[data-scorer-zone="score-overview"]`

Muestra:

- total actual;
- estado deportivo;
- base;
- adicionales;
- infracciones individuales;
- timer o timers aplicables.

Consume el view model existente. No recalcula puntos ni tiempo.

### 3. Controles deportivos

Ruta DOM: `[data-scorer-zone="sport-controls"]`

La clasificacion dinamica se presenta antes de los controles cuando afecta el valor. Despues aparecen calculadores especializados, base y adicionales. Los botones deportivos mantienen targets tactiles de al menos 44 px.

### 4. Controles secundarios

Ruta DOM: `[data-scorer-zone="secondary-controls"]`

Incluye:

- infracciones;
- infracciones al equipo;
- descalificaciones;
- evidencia y nota.

Se expanden dentro del scorer. No abren otra pantalla y no pierden contexto.

### 5. Footer

Orden estable:

1. Ajustar botonera como utilidad de bajo peso.
2. Estado de conexion.
3. Deshacer.
4. Marcar 0.
5. Guardar y siguiente como accion primaria.

`Marcar 0` y DQ mantienen controles, estados y semanticas separados.

## Reglas responsive

- Landscape es el viewport operativo principal.
- En 1193 x 833, Cala, Terna, Manganas a Pie y Paso muestran al menos un control principal antes del footer.
- Portrait y movil permiten scroll vertical, no horizontal.
- Desktop usa un ancho util maximo de 1600 px.
- El total permanece al inicio del area de trabajo y es sticky en viewports amplios.
- La composicion completa responde al ancho disponible sin reposicionar arbitrariamente controles deportivos.

## Suertes cubiertas

La misma jerarquia comun cubre Cala, Piales, Colas, Toro, Lazo Cabecero, Pial en el Ruedo, Yegua, Manganas a Pie, Manganas a Caballo y Paso de la Muerte.

No existen diez layouts independientes.
