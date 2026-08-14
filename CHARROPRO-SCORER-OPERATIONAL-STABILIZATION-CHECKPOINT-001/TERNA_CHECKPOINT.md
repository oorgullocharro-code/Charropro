# Terna Checkpoint

## Autoridad

Attempt V2 sigue siendo la autoridad del intento. La terminacion se deriva de la seleccion base canonica y del estado deportivo normalizado.

## Matriz preservada

| Secuencia | Resultado |
| --- | --- |
| O1 Cabecero FAIL | O2 Cabecero |
| O1 Cabecero SUCCESS | O2 Pial |
| O1 Cabecero FAIL + O2 Cabecero SUCCESS | O3 Pial |
| O1 Cabecero SUCCESS + O2 Pial FAIL | O3 Pial |
| O1 Cabecero SUCCESS + O2 Pial SUCCESS | COMPLETE 2/5 |
| O1 FAIL + O2 Cabecero SUCCESS + O3 Pial SUCCESS | COMPLETE 3/5 |
| O1 Cabecero SUCCESS + O2 Pial FAIL + O3 Pial SUCCESS | COMPLETE 3/5 |

## Terminacion

Cuando `headCounted && pialCounted`:

- `status` pasa a `COMPLETED`;
- `currentOpportunity` queda en `null`;
- no se reserva una oportunidad adicional;
- el historial conserva solo intentos consumidos;
- las oportunidades restantes quedan `CLOSED_UNUSED`;
- `sharedTimerId` y referencias de score se preservan;
- el CTA cambia a `Finalizar Terna`;
- el Flow Engine decide el siguiente contexto canonico.

## Limites

Este checkpoint no cambia el maximo compartido de cinco oportunidades, no modifica el cronometro unico de Terna y no introduce la futura politica temporal Toro / Terna.
