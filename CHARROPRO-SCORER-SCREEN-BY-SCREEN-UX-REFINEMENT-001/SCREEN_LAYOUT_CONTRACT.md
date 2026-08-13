# Screen Layout Contract

## Estructura común

1. Cabecera compacta fija al shell.
2. Fichas compactas de participantes/equipos.
3. Total, base, adicionales, infracciones y timer contextual.
4. Navegación de suertes y selector de contexto en una sola banda.
5. Zona deportiva especializada.
6. Controles comunes de adicionales e infracciones.
7. Infracciones de equipo, DQ y evidencia como controles secundarios.
8. Barra inferior con sincronización, pendientes y avance.

## Contratos por pantalla

| Pantalla | Zona especializada | Contexto visible | Duplicados eliminados |
| --- | --- | --- | --- |
| Cala | Calculador de punta | Sin fila `1/1` | Oportunidad redundante |
| Piales | Metros `[-] valor [+]` | `1/3`, `2/3`, `3/3` en navegación | Tarjetas de intentos y timer grande |
| Colas | Botonera directa | Coleador + selector compacto | Timer, coleadores, intentos y totales grandes |
| Toro | Clasificación + barra temporal | Apretalamiento en cabecera | Cuenta regresiva del cuerpo |
| Terna | Lazador, intento, siguiente, estado | Cinco oportunidades compartidas | Timer y tarjetas históricas grandes |
| Yegua | Patrón de jineteo | Apretalamiento en cabecera | Cuenta regresiva del cuerpo |
| Manganas Pie | Resultado, floreo, tirones, remate | Intento activo | Timer y total duplicados |
| Manganas Caballo | Plantilla de Manganas + familias | Intento activo | Timer y total duplicados |
| Paso | Clasificación + resultado + faena | Salida y desmonte | Contadores duplicados del cuerpo |

## Responsive

- Desktop: ancho útil limitado por el workspace existente.
- iPad landscape: información crítica, timer y footer visibles.
- iPad portrait: scroll vertical permitido y cero scroll horizontal global.
- Mobile: cabecera, equipos y navegación se compactan; controles conservan al menos 44 px.
- La geometría adapta la composición completa; no mueve arbitrariamente controles deportivos.

## Avance

El texto de guardado se deriva del contexto actual. La operación sigue delegada al Flow Engine existente. Terna consulta la resolución canónica de siguiente suerte; no alterna roles mediante una secuencia hardcodeada.
