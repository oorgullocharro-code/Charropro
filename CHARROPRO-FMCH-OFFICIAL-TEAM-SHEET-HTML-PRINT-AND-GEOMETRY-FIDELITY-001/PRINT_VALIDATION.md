# Print Validation

## Autoridad

- Papel: Oficio vertical, `215.9 x 340.44 mm`.
- PDF fuente: `612 x 965.04 pt`.
- CSS: `@page` con las dimensiones físicas y margen de 4.6 mm.
- XLSX: papel custom Oficio, orientación portrait, fit a 1 x 1.

## Resultados

| Artifact | Pages | Page size | Result |
|---|---:|---|---|
| PDF desde XLSX, primera vuelta | 1 | 612 x 965.055 pt | PASS |
| PDF desde XLSX, segunda vuelta | 1 | 612 x 965.055 pt | PASS |
| PDF desde impresión HTML | 1 | 612 x 965.04 pt | PASS |

Chrome fue validado con el documento integral: toolbar y fondo externo no forman parte de la impresión, no existen cortes, no aparece una segunda página y se conservan logos, firmas, footer y valores.

## Screen

- Documento: 1180 px.
- Ancho máximo permitido: 5000 px.
- Overflow de celdas: 0.
- Desktop: hoja completa centrada.
- Viewport menor: geometría fija con scroll horizontal.
- Scroll vertical: hoja completa accesible.

## Hashes de evidencia

- XLSX primera vuelta: `9fbfffa663cbd84e6663b3d05d0f32b404741d04c2a3dea613fe2eb488cc3ac9`.
- HTML primera vuelta: `7193c0c18fb968582d1a5a7515faf3f621cfa4adca3950b00c3ef7f717775d0f`.
- PDF impresión HTML: `b5c513b55a6dede934d9bd6be1b9bf08fad3466bea475f348b065a5ce01fbd4b`.
