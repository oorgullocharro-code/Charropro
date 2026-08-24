# HTML / XLSX Visual Parity

Ambos renderers consumen el mismo snapshot y la misma autoridad de geometría. La comparación usa `formato-fmch-semantico-paso-primera-vuelta`.

| Section | Result | Evidence |
|---|---|---|
| Header | MATCH | título, logos y merges equivalentes |
| Event data | MATCH | evento, hora, fecha y lugar |
| Team data | MATCH | equipo y capitán |
| Cala | MATCH | base/adicionales, códigos y valores individuales |
| Piales | MATCH | tres tiros, malos y total |
| Coleadero | MATCH | 3x3 más cuarta fila administrativa |
| Toro | MATCH | campos individuales y tiempo |
| Terna | MATCH | tres participantes; Cabecero izquierda, Pial derecha |
| Yegua | MATCH | campos individuales y tiempo |
| Manganas a Pie | MATCH | tres tiros y controles |
| Manganas a Caballo | MATCH | tres tiros y controles |
| Paso | MATCH | vueltas, reparos, tiempo y total |
| Bad-point control | MATCH | control informativo sin segundo descuento |
| Team infractions | MATCH | infracción en la suerte correspondiente |
| Accumulated controls | MATCH | anterior + suerte = nuevo acumulado |
| Final score | MATCH | 237 en la fixture principal |
| Signatures | MATCH | Juez/Juez/Juez/Capitán manuales |
| Institutional footer | MATCH | CONADE y textos certificados |

`MATCH: 18`, `PARTIAL: 0`, `FAIL: 0`.

No se exige identidad píxel por píxel. Se verifican estructura, posiciones funcionales, valores, FieldIDs, relaciones, tamaño físico y legibilidad equivalentes.
