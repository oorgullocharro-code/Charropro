# Summary

## Dictamen técnico

APROBADO PARA PUBLICACIÓN CONTROLADA.

## Problema corregido

La cadena Scorer -> Attempt V2 -> Official Score -> Team Total preservaba
correctamente los componentes oficiales de Terna como `lazo` y `pial_ruedo`.
La validación documental del Formato Federación interpretaba `terna` como una
identidad de intento literal y bloqueaba el snapshot con
`official-format-required-suerte-missing:terna`.

## Correctivo

La frontera documental expande la suerte agrupada `terna` a sus identidades
oficiales `lazo` y `pial_ruedo`. Si falta un componente, el error identifica el
componente real faltante. No se modifican puntuaciones, RuleIDs, FieldIDs ni el
perfil `FMCH_2026_LIBRE 0.6.1`.

## Resultado

La prueba end-to-end confirma Cabecero 10 + Pial 8, Official Score total 18,
Formato Federación `READY` con ambos componentes y resultados públicos con
`LC=10`, `PR=8` y acumulado 18.

Build: `20260828-fmch-terna-federation-format-official-score-recovery-001-v1`.
