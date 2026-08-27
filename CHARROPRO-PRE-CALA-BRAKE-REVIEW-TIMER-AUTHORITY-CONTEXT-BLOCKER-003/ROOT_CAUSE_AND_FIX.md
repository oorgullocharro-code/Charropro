# Root Cause And Fix

## 1. Contexto remoto incompleto

`compactTournament()` retiraba la identidad de Rule Profile y politica temporal antes de publicar `live/current`. El Control remoto recibia Cala/Colas sin autoridad FMCH certificada y caia en compatibilidad legacy. Se transportan ahora exclusivamente los identificadores, versiones y fingerprints seguros necesarios para resolver la politica.

## 2. Autoridad inicial de Brake Review

El Scorer enviaba la transicion canonica, pero su controlador `scorer_backup` no podia auto-reclamar un timer nuevo. La excepcion queda limitada a `phaseId=freno_review`; el Control remoto conserva autoridad primaria en las demas fases y suertes.

## 3. Seleccion entre oportunidades

Un timer PAUSED de la oportunidad anterior bloqueaba la seleccion del nuevo `timerId`. PAUSED permanece como historico, pero solo RUNNING bloquea un cambio de contexto. La siguiente oportunidad crea un timer READY limpio.

## 4. Interpolacion del Scorer

El ticker se activaba mediante una lista que omitia Piales y Coleadero. La activacion ahora depende de los nodos oficiales realmente montados. Cada tick consulta el DOM vigente, por lo que un rerender no deja el ticker ligado a un nodo anterior.

## Limites

- El valor legacy de 15 s no fue presentado como certificado ni modificado de forma aislada.
- Bajo `FMCH_2026_LIBRE 0.6.1`, la politica certificada de 20 s tiene precedencia.
- No hay polling ni writes por tick.
- No se modificaron reglas deportivas, Rules, Functions o perfiles.
