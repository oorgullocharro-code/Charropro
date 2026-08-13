# Remote Control UX Contract

## Superficie oficial

Se reutiliza el flujo existente:

`Conexión -> Controles -> Control cronómetro -> cronometro.html`

No existe una aplicación remota adicional.

## Acción primaria

En smartphone portrait, START/PAUSA/CONTINUAR se presenta como un botón circular dominante:

- ancho responsive entre 190 px y 340 px;
- objetivo táctil muy superior a 44 px;
- posición accesible con una mano;
- acción primaria visible sin scroll;
- safe areas consideradas;
- texto y estado explícitos, sin depender solo del color.

Estados visibles:

| Autoridad | Etiqueta principal |
| --- | --- |
| READY | START |
| RUNNING | PAUSA |
| PAUSED | CONTINUAR |
| FINISHED | FINALIZADO |

## Confirmación de autoridad

La UI no anticipa un cambio de estado. El flujo es:

`touch -> pendingAction -> transacción -> ACK/readback -> estado confirmado`

Mientras espera, la acción queda protegida contra dobles toques. La confirmación muestra que Timer Authority aceptó el comando.

## Control y observación

Cuando otro controlador posee el timer, el Remote entra en modo observador, muestra quién controla el tiempo y deshabilita comandos incompatibles. El regreso de una conexión no recupera autoridad automáticamente.

El Scorer muestra el mismo tiempo y puede usar `Tomar control de respaldo`. El handback explícito devuelve el control al campo sin reiniciar ni saltar el tiempo.

## Acciones secundarias

- FINISH requiere confirmación.
- Motivo de pausa se elige después de PAUSE y se conserva en la autoridad.
- Reset no es protagonista del flujo.
- Selector y lista de otros cronómetros permiten múltiples contextos sin mezclar sus estados.

## Responsive validado

- smartphone portrait;
- smartphone landscape;
- tablet/iPad;
- desktop.

La cuadrícula evita overflow mediante tracks con `min-width: 0`. El botón principal permanece visible y dominante en viewport móvil.

## Mejoras progresivas

La vibración ligera puede usarse cuando el navegador la soporte, pero no es requisito de consistencia. Smartwatch y hardware remoto no forman parte de esta versión.
