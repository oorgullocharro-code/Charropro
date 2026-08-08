# Rule Profile Data Contract

## 1. Version

`RULE_PROFILE_CONTRACT_VERSION = 1.0.0`

## 2. Perfil

```json
{
  "contractVersion": "1.0.0",
  "profileId": "FMCH_2026_LIBRE",
  "version": "0.1.0",
  "name": "FMCH 2026 Libre",
  "scope": "competition",
  "status": "skeleton",
  "source": "document-reference",
  "rules": [],
  "suerteMetadata": {},
  "metadata": {}
}
```

`profileId` y `version` forman una seleccion exacta. No existe resolucion silenciosa a "la version mas nueva".

Estados soportados:

- `skeleton`;
- `draft`;
- `active`;
- `deprecated`;
- `archived`.

Solo `active` y una version exacta `deprecated` pueden resolverse. `skeleton`, `draft` y `archived` bloquean calificacion si se seleccionan.

## 3. Regla

```json
{
  "suerteId": "piales",
  "category": "base",
  "ruleId": "pb1",
  "label": "Remolineado",
  "value": 18,
  "enabled": true,
  "order": 10,
  "condition": null,
  "valueByClassification": null,
  "renderMode": "button",
  "scope": "attempt",
  "metadata": {}
}
```

El alias `pts` sigue aceptado por compatibilidad. El catalogo efectivo expone ambos `id/ruleId` y `pts/value`.

## 4. Categorias

| Contrato | Catalogo legacy | Semantica |
| --- | --- | --- |
| `base` | `base` | Puntos base |
| `adic` | `adic` | Adicional oficial |
| `infr` | `infr` | Infraccion individual |
| `team_infr` | canal preparado | Infraccion al equipo |
| `desc` | `desc` | DQ/descalificacion explicita |

La categoria no se infiere por signo. `MANUAL` no es un catalogo de perfil: adicionales, infracciones y team penalties manuales siguen siendo acciones por intento.

## 5. Identidad efectiva

```text
ruleKey = suerteId + ":" + category + ":" + ruleId
```

`ruleKey` es la identidad del resolver. `id` conserva compatibilidad con el scorer legacy. Duplicar el mismo `ruleKey` dentro de una capa es error. Repetir un `ruleId` entre categorias produce diagnostico legacy y no se confunde durante el merge.

## 6. Valores dinamicos

El contrato permite almacenar, sin evaluar:

```json
{
  "valueByClassification": {
    "excelente": 5,
    "regular": 2,
    "minima": 0
  }
}
```

El ticket no crea el calculador. Todos los valores deben ser numeros finitos.

## 7. Condiciones declarativas

Forma hoja:

```json
{
  "field": "classification",
  "operator": "in",
  "value": ["excelente", "regular"]
}
```

Composicion permitida: `all`, `any`, `not`.

Operadores: `eq`, `neq`, `in`, `not_in`, `gt`, `gte`, `lt`, `lte`, `exists`.

No se ejecuta la condicion en este ticket. No se aceptan funciones, simbolos, BigInt, ciclos, accessors, prototipos custom, claves peligrosas ni numeros no finitos.

## 8. Render modes

- `button`;
- `compact_calculator`;
- `specialized_calculator`;
- `metadata_only`.

Punta de Cala queda declarada como `specialized_calculator` y sigue usando `calculatePuntaBreakdown()`.

## 9. Metadata por suerte

`suerteMetadata` prepara, sin duplicar componentes:

- timer rules;
- opportunities;
- shared opportunities;
- sequence;
- dependencies;
- specialized calculators;
- metadata de exportacion.

Cada clave de metadata se reemplaza de forma atomica por capa. No existe deep merge ambiguo.

## 10. Seleccion de torneo

```json
{
  "ruleProfileId": "FMCH_2026_LIBRE",
  "ruleProfileVersion": "1.0.0"
}
```

Un torneo sin ambos campos usa el baseline vigente. Un perfil desconocido bloquea. Solo `ruleProfileFallback: "product_base"` autoriza fallback explicito.

## 11. Contexto del score

`breakdown.rulebook` conserva:

- `discipline`;
- `version` especializada;
- `resolutionContractVersion`;
- `ruleProfileId`;
- `ruleProfileVersion`;
- `ruleProfileStatus`;
- `fallbackUsed`;
- `layers`;
- `tournamentOverrideUpdatedAt`.

El total oficial no se recalcula desde el perfil al leer historico.
