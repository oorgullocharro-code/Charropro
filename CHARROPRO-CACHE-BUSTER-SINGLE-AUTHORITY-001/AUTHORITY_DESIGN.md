# Authority Design

## Flujo canonico

```text
functions/configuration.defaults.json
  values.system.appVersion
          |
          v
configurationBootstrap.js (estable, fetch no-store)
          |
          v
clientBootstrap.js (estable)
          |
          +-- CSS ?v=<appVersion>
          +-- entrypoint ?v=<appVersion>
                    |
                    v
       imports internos ?v=<appVersion>
```

`version.js` ya no se carga a traves de una referencia historica y obtiene `CHARROPRO_APP_VERSION` de la misma configuracion validada. Los modulos de arranque estables no declaran una version propia y por ello no son una segunda autoridad.

## Generacion

`tools/release/applyClientBuildVersion.mjs` lee exclusivamente la configuracion canonica y aplica ese valor a imports relativos `.js` bajo `js/`, `fixtures/` y `tests/`. Una segunda ejecucion produce cero cambios.

## Seguridad

El bootstrap valida el identificador de build, restringe entrypoints y estilos a rutas relativas `.js`/`.css`, usa la validacion de checksum existente y no acepta URLs arbitrarias.
