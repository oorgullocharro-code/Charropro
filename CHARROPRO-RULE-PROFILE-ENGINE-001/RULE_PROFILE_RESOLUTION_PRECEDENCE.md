# Rule Profile Resolution Precedence

## 1. Precedencia final

```text
TOURNAMENT_OVERRIDE
>
RULE_PROFILE
>
PRODUCT_BASE administrada
>
PRODUCT_BASE estatica
```

`MANUAL` no participa en este merge. Se aplica al intento y conserva su auditoria independiente.

## 2. Semantica preservada

Antes del ticket:

1. `SUERTES` aportaba el catalogo estatico.
2. `globalRuleOverrides[suerteId].catalog[group]` reemplazaba el grupo completo.
3. `tournament.ruleOverrides[suerteId].catalog[group]` reemplazaba el grupo completo resultante.

Esa semantica no cambia. Rule Profile se inserta entre botonera general y convocatoria.

## 3. Merge del perfil

El perfil opera por patch sobre `ruleKey`:

- misma identidad: modifica solo campos declarados;
- `enabled:false`: conserva la regla y la retira del catalogo activo;
- RuleID nuevo con label: agrega regla;
- categoria incompatible: error;
- identidad duplicada en el perfil: error;
- valor dinamico: se conserva declarativo;
- orden: numero finito y desempate por RuleID.

## 4. Merge del torneo

Dos contratos son aceptados:

### Catalogo legacy

`tournament.ruleOverrides[suerte].catalog[group]` reemplaza el grupo completo, tal como antes. Una regla nueva exige `custom:true`.

### Patch preparado

`tournament.ruleOverrides[suerte].rules[]` modifica por identidad. Un RuleID inexistente es `override-rule-not-found`, salvo `custom:true` con label.

No existe `last object wins` entre reglas duplicadas.

## 5. Conflictos bloqueantes

- referencia de perfil incompleta;
- profile/version inexistente;
- profile no activo;
- suerte, categoria o RuleID invalido;
- identidad duplicada dentro de una capa;
- categoria incompatible;
- override no custom a RuleID inexistente;
- condicion o tabla dinamica invalida;
- dato no declarativo.

Un conflicto bloqueante produce `suertes: []` en `resolveTournamentRules()`. El scorer no recibe una botonera potencialmente equivocada.

## 6. Fallback

| Contexto | Resultado |
| --- | --- |
| Sin profile configurado | Product Base vigente, compatibilidad legacy |
| Profile valido exacto | Product Base + Profile + Tournament Override |
| Profile desconocido | Bloqueo |
| Profile desconocido + fallback explicito | Product Base + Tournament Override, con warning |
| Perfil skeleton/draft/archived | Bloqueo salvo fallback explicito |

No se usa fallback cruzado entre perfiles, versiones, tenants u organizaciones.

## 7. Ejemplos

### Herencia

```text
BASE A=10, PROFILE sin A, TORNEO sin A -> A=10 / PRODUCT_BASE
```

### Perfil

```text
BASE A=10, PROFILE A=12 -> A=12 / RULE_PROFILE
```

### Convocatoria

```text
BASE A=10, PROFILE A=12, TORNEO A=14 -> A=14 / TOURNAMENT_OVERRIDE
```

### Disable

```text
BASE A=10, PROFILE A enabled=false -> A no aparece; permanece en allRules
```

## 8. Determinismo

La resolucion:

- no usa tiempo actual;
- no usa aleatoriedad;
- no depende del orden de propiedades de objetos;
- clona entradas;
- ordena por `order` y RuleID;
- no muta Product Base, profile ni torneo;
- no ejecuta codigo de configuracion.
