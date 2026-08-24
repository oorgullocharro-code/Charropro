# Risks

## Riesgos cerrados

- Ancho HTML millonario: eliminado mediante autoridad CSS de 1180 px y límite probado de 5000 px.
- Divergencia HTML/XLSX: mitigada con snapshot y geometría compartidos.
- Filas deformadas por texto: mitigada con alturas por rol y wrap controlado.
- Malos de Cala sin identidad visible: mitigado con matriz completa, metadata y generación determinista.
- Doble descuento de controles: no introducido; los controles documentales conservan `affectsScore: false`.
- Confusión `0`/`-`: cubierta por contrato y pruebas.

## Riesgos residuales

- La certificación humana final sigue pendiente; el estado permitido es `READY_FOR_CERTIFIED_JUDGE_REVIEW`.
- Las opciones de encabezado/pie propias del diálogo de impresión dependen de la configuración local del navegador; el CSS elimina toda UI propia de CharroPro.
- Una futura versión documental FMCH requiere un nuevo perfil documental; esta versión no se convierte en default global ni infiere vigencia futura.
- Una nueva regla deportiva requeriría recertificación y, si corresponde, una nueva versión del Rule Profile; no debe editarse silenciosamente `0.6.0`.

## Infraestructura

- Firebase Production Writes: 0.
- Functions deploy: no requerido.
- RTDB Rules deploy: no requerido.
