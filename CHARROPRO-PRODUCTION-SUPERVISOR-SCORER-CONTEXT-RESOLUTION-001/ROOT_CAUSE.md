# Root Cause

## Causa primaria

El scorer usaba la longitud final del catalogo como senal unica. Cuando el torneo Libre todavia no tenia `ruleProfileAssignment`, la seleccion reglamentaria quedaba bloqueada y devolvia cero suertes; la UI interpretaba ese cero como competencia no soportada.

## Causa de creacion

El flujo de nuevo torneo publicaba y renderizaba antes de esperar la callable de assignment. En latencia, rechazo o sesion sin autoridad, el usuario podia entrar a un contexto reglamentario incompleto.

## Causa de cache

La firma no representaba todos los campos superiores de estado/source/revision usados por la resolucion, por lo que una resolucion incompleta podia sobrevivir mas de lo debido.
