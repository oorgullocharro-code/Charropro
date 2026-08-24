# Productive Profile Analysis

La configuracion canonica declara `productiveRuleProfileDefaults.Libre` con `FMCH_2026_LIBRE 0.6.0` habilitado.

La arquitectura vigente no autoriza al cliente a convertir ese dato directamente en una asignacion deportiva. `applyProductiveRuleProfilePolicy()` marca la necesidad y la autoridad server-side crea la asignacion trazable. Mientras esta pendiente, `PRODUCT_BASE` no debe presentarse como FMCH.

Por tanto, el comportamiento final es automatico para Supervisor, pero conserva su frontera de seguridad:

1. se crea torneo Libre;
2. se aplica la politica productiva;
3. la autoridad asigna FMCH;
4. el scorer resuelve el catalogo.

No hay checkboxes de suertes, hardcode disperso ni migracion de historicos.
