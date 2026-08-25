# Lifecycle

## Transiciones preservadas

```text
READY -> RUNNING -> PAUSED -> RUNNING
                    |          |
                    +-------> FINISHED
RUNNING --------------------> FINISHED
```

`FINISHED` no equivale a `DESTROYED`. Conserva evidencia, revision, actor, controlador, pausas y tiempos.

## Siguiente contexto

- `FINISHED` + nueva suerte: la UI selecciona la definicion vigente, que nace `READY` hasta que una persona pulsa Iniciar.
- `FINISHED` + nueva oportunidad de Piales/Coleadero: la identidad incorpora la oportunidad y evita reutilizar el Timer terminal.
- `RUNNING` o `PAUSED` + cambio de suerte: no hay reset silencioso; se conserva el Timer activo y se muestra bloqueo operativo.
- Suerte sin Timer vigente: no se presenta un Timer historico terminado como si fuera el actual.

El historial RTDB permanece intacto. No se agrego una transicion destructiva `RESET` ni se redujo `officialElapsedMs`.
