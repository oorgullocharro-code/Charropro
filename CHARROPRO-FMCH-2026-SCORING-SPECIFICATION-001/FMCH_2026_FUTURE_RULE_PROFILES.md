# Perfiles reglamentarios futuros FMCH 2026

## 1. Alcance

Estos perfiles se documentan para no perder informacion del Reglamento, pero quedan fuera del scorer Libre activo. Ninguna regla de este archivo debe aplicarse por fallback silencioso. Cada perfil futuro necesita identidad, version, vigencia, pruebas y seleccion explicita.

## 2. Estados Unidos de America

Referencia: adecuaciones, paginas 102-103.

### Jineteos y Paso

- Espoleo moderado sin sangrar.
- Sangrado: `-2`.
- Sangrado exagerado: DQ, conservando malos acumulados.

### Manganas a Pie

- Cada mangana acertada debe chorrearse alrededor de los cuadriles al menos 10 m sin que la reata caiga.
- Chorrear soltando `+1`; girando sin soltar `+2`.
- No chorrear: `-2` y la oportunidad no cumple la condicion del perfil.
- Seguir yegua para chorrear `-2`; chorrear sin mangana `-2`; apoyo mano/rodilla `-2`; hocico `-2`; sobre lomo `-2`; caer al chorrear `-3`; camino `-4`; chorreada incorrecta `-2`.

### Manganas a Caballo

- Chorrear 10 m amarrado a cabeza de silla, media vuelta o vuelta completa, sin seguir a la yegua.
- Seguir para chorrear `-4`.
- Reglas especiales de DQ: maltrato, derribo intencional, vueltas en cabeza, no completar 10 m y tapar carrera.
- Equino sin herraduras; de lo contrario DQ de todas las oportunidades.

Estado: `FUTURE RULE PROFILE`; no implementar en Libre.

## 3. Charro Completo Libre y Juvenil

Referencia: adecuaciones, pagina 104.

- Jineteo de Toro obligatorio.
- Apretalamiento: cinco minutos, tres ordinarios y dos con infraccion; tiempo ahorrado `+1/min` si cuenta y no Minima.
- Negarse a presentar Jineteo de Toro: descalificacion de competencia y consecuencia disciplinaria reglada.
- Tres auxiliares dentro del ruedo en cuadros 4 x 4; deben permanecer hasta quitar verijero u orden.
- Lesion certificada: resultado final es la ultima suma de faenas ejecutadas; retiro sin autorizacion sigue regimen disciplinario.
- Juvenil: quien no cumpla 18 durante el ano de la competencia, por ano de nacimiento.
- Infracciones del equipo de arreo se descuentan al total del Charro Completo.
- Despues de Manganas a Caballo del competidor anterior, el siguiente tiene dos minutos para iniciar Manganas a Pie, y asi en transiciones sucesivas.

Estado: `FUTURE RULE PROFILE`; requiere modelo de competencia individual y secuencia propia. No debe sumar al ranking de equipos.

## 4. Charro Mayor

Referencia: adecuaciones, paginas 105-107.

### Edad

| Edad el dia de competencia | Adicional por oportunidad lograda |
| --- | ---: |
| Hasta 54 | 0 |
| 55-59 | +1 |
| 60-64 | +2 |
| 65-69 | +3 |
| 70-74 | +4 |
| 75 o mas | +5 |

La categoria Mayor inicia a los 50 anos y requiere comprobacion de edad. En Cala, otra persona puede presentar el freno.

### Manganas a Caballo

- Remates de una o varias vueltas sin floreo adicional: base 20, mas infracciones aplicables.

### Jineteo de Toro y Yegua

- Ejecutados por charro de otra categoria: reglamento Libre; caida = cero; si cuenta, solo Minima y tiempo; descomponerse `-2`.
- Ejecutados por Charro Mayor: reglamento Libre; caida cuenta con `-4`.

### Paso de la Muerte

- Otra categoria: primera 15, segunda 10, parada/caminando/trotando 5; sin distancia; caida = cero.
- Charro Mayor: reglamento Libre mas edad; no aplica infraccion por apoyarse; caida sobre yegua bruta cuenta con `-4`.
- Si ambos arreadores son Charro Mayor, miembros del equipo y el jinete es de la categoria: `+2`.

### Modalidad de cinco faenas

Obligatorias: Cala, Piales, Colas, Manganas a Pie y Manganas a Caballo. Calificacion Libre mas adicionales por edad.

Estado: `FUTURE RULE PROFILE`; no activar en Libre.

## 5. Tiebreak asociado

El Reglamento coloca el criterio general tras las adecuaciones. La implementacion futura debe resolverlo por perfil, sin asumir que un cambio de categoria altera el orden:

- equipos/Charro Completo: malos, oportunidades consumadas, malos en Colas, calificacion oficial anterior;
- individuales: malos, adicionales, puntuacion del equipo.

## 6. Modelo futuro minimo

Un Rule Profile necesita:

- `ruleProfileId` estable;
- version semantica y fecha de vigencia;
- jurisdiccion/categoria/modalidad;
- herencia explicita desde Libre 2026;
- overrides declarativos por RuleID;
- reglas prohibidas y obligatorias;
- timer/opportunity overrides;
- migracion y compatibilidad;
- checksum de fuente;
- aprobacion deportiva y auditoria;
- no fallback entre tenants/organizaciones.

Orden recomendado:

1. `CHARROPRO-RULE-PROFILE-ENGINE-001`.
2. Perfil Libre 2026 canónico.
3. Perfil Charro Completo/Juvenil.
4. Perfil USA.
5. Perfil Charro Mayor.

## 7. Exclusiones

No se crean perfiles productivos, selectores, tablas Firebase, migraciones, recalculos historicos ni cambios de UI. Este anexo solo congela la informacion fuente para tickets posteriores.
