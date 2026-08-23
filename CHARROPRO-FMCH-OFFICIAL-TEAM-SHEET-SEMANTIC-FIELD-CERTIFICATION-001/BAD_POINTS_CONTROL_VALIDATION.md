# Bad Points Control Validation

## Contrato certificado

Cada control punteado lateral recibe la magnitud de `individualBadPoints + teamPenaltyTotal` de su sección desde Official Score / Attempt V2 congelado. El snapshot expone `documentalControls.badPointsBySection` para:

`cala`, `piales`, `coleadero`, `toro`, `terna`, `yegua`, `manganasPie`, `manganasCaballo`, `paso`.

`badPointsControlTotal` suma esos nueve controles y declara `affectsScore:false`. La fixture obligatoria de Cala comprueba `5 + 4 = 9`.

## No doble descuento

El score final sigue siendo la suma de `teamAdjustedTotal` congelada. Los controles documentales no participan en `officialScoreTotal`, `finalScore`, reglas ni cálculos. La prueba dirigida verifica igualdad antes/después del control.

## Cala

Los ocho slots canónicos usan `documentalEvidence.badPointSlots`. Cada entrada conserva RuleID, label, quantity, total y `documentCode` cuando la autoridad lo proporciona. AH, D y R viajan desde metadata congelada; nunca se infieren por el valor. Si existen más de ocho entradas documentales, el snapshot bloquea con `official-format-cala-bad-point-slots-overflow`; nunca trunca silenciosamente.
