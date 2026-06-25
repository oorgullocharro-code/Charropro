# Configuracion de roles Firebase para CharroPro

Hazlo en este orden para no cerrar Firebase sin un usuario supervisor.

## 1. Crear usuario

En Firebase Console:

1. Authentication.
2. Usuarios.
3. Agregar usuario.
4. Captura correo y contrasena.
5. Copia el `UID` del usuario creado.

## 2. Dar rol al primer supervisor

En Realtime Database > Datos, agrega este nodo:

```json
{
  "charropro": {
    "users": {
      "PEGA_AQUI_EL_UID": {
        "name": "Alejandro",
        "email": "correo@ejemplo.com",
        "role": "supervisor",
        "active": true
      }
    }
  }
}
```

Roles validos:

```text
supervisor
operador
juez
locutor
graficos
organizador
lectura
```

## 3. Pegar reglas

En Realtime Database > Reglas, pega el contenido de:

```text
firebase-rules-auditoria.json
```

Despues publica las reglas.

## 4. Desplegar funcion para crear usuarios desde CharroPro

La pagina `Usuarios` puede guardar perfiles por UID aunque no despliegues Functions, pero para crear cuentas completas desde CharroPro necesitas desplegar la funcion segura:

Firebase requiere plan Blaze para desplegar Cloud Functions en produccion. Si no quieres activar Blaze todavia, conserva el metodo de respaldo por UID.

```text
cd charropro-organizado
cd functions
npm install
cd ..
firebase login
firebase use charropro-e8a68
firebase deploy --only functions:upsertCharroProUser
```

La funcion se llama:

```text
upsertCharroProUser
```

Esa funcion solo acepta llamadas de un usuario con rol `supervisor` activo en `charropro/users`.

## 5. Crear mas usuarios desde CharroPro

Con el primer supervisor ya activo puedes agregar mas usuarios desde la app:

```text
CharroPro > Usuarios > Agregar usuario
```

Con Cloud Functions desplegado, deja el UID vacio, escribe correo, nombre, rol y contrasena inicial. CharroPro creara la cuenta en Authentication y guardara el perfil automaticamente.

Sin Cloud Functions, crea primero la cuenta en Firebase Authentication, copia el `UID`, pegalo en CharroPro y asigna rol.

Ejemplo de operador:

```json
{
  "name": "Operador 1",
  "email": "operador@ejemplo.com",
  "role": "operador",
  "active": true
}
```

Ejemplo de juez:

```json
{
  "name": "Juez 1",
  "email": "juez@ejemplo.com",
  "role": "juez",
  "active": true
}
```

Ejemplo de solo lectura:

```json
{
  "name": "Consulta",
  "email": "consulta@ejemplo.com",
  "role": "lectura",
  "active": true
}
```

## Permisos

`supervisor`: administra, revisa auditoria, congela y puede modificar todo.

`operador`: administra torneo, programa, equipos, botoneras, graficos y estado en vivo.

`juez`: califica, publica pasadas y mueve cronometro.

`locutor`: consulta la pagina de locutores.

`graficos`: accede a links y editor de graficos para OBS.

`organizador`: consulta el torneo completo, locutores y supervision sin modificar.

`lectura`: consulta datos privados sin modificar.

OBS lee `charropro/live/{tournamentId}` sin login para no romper fuentes de navegador, pero cada fuente debe llevar `?tournamentId=ID_DEL_TORNEO` y nadie puede escribir ahi sin rol autorizado.

## Checklist rapido despues de publicar reglas

1. Cierra sesion en CharroPro.
2. Entra con un usuario `supervisor`.
3. Verifica que aparezca `Usuarios` en el menu.
4. Crea un usuario nuevo desde `Usuarios` con contrasena inicial.
5. Abre `Conexion` y confirma que `Auditoria` y `Usuarios` digan `SI` en supervisor.
6. Entra con un juez y confirma que solo pueda abrir la pagina de jueces.
7. Entra con locutor y confirma que solo pueda abrir locutores.
8. Entra con graficos y confirma que vea links/pantallas de OBS.
