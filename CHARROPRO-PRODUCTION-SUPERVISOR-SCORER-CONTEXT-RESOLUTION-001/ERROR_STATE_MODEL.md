# Error State Model

## Principios

- La ausencia de assignment no equivale a competencia no soportada.
- Un error de lectura remota no se degrada a `PRODUCT_BASE`.
- Una revision o huella incoherente bloquea captura.
- Panel, Programa, acceso directo y Scorer aplican el mismo resolver.
- Solo un platform admin puede ejecutar la recuperacion explicita.

## Mensajes

Los mensajes distinguen carga, assignment requerido, pending, error, invalido, perfil no resoluble y catalogo vacio. Los detalles remotos se limitan a una razon normalizada y no exponen stack, token ni identidad personal.
