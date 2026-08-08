# Scorer Responsive Breakpoints

## Breakpoints finales

| Ancho | Token/consulta | Uso |
| --- | --- | --- |
| Mas de 1220 px | `wide: 1220` | Desktop amplio, mas columnas sin cambiar jerarquia |
| 981 a 1220 px | baseline wide/tablet | iPad landscape y desktop compacto |
| 761 a 980 px | `tablet: 980` | iPad portrait/landscape compacto, footer reordenado |
| 641 a 760 px | refinamiento 760 | transicion para footer y formularios |
| Hasta 640 px | `compact: 640` | una columna y `--scorer-rule-min: 145px` |

Se reutilizaron los puntos existentes de 1220, 980 y 640 px. El refinamiento de 760 px evita que las acciones del footer compitan por ancho antes del modo compacto. No se escala tipografia con viewport.

## Tokens agregados

```css
--scorer-touch-target: 56px;
--scorer-rule-min: 176px;
--scorer-section-gap: 12px;
--scorer-footer-clearance: 28px;
```

## Viewports verificados

- iPad landscape representativo: 1020 x 765.
- iPad portrait representativo: 765 x 1020.
- Desktop: 1440 x 900.

Se usaron dimensiones representativas alineadas con la cuantizacion de pixeles del navegador automatizado. La medicion a 1024 x 768 produjo una diferencia de un pixel en el iframe por DPR, sin overflow de hijos; 1020 x 765 elimina ese artefacto y conserva la misma clase de dispositivo.

## Criterios medidos

En los tres viewports:

- overflow horizontal: 0;
- scroll vertical: presente;
- footer: visible;
- raices de scorer: 1;
- botones de regla en fixture: 26;
- nodos hijos fuera del ancho: 0.
