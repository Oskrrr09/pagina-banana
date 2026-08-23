---
tipo: sesion
fecha: 2026-08-23
tema: A62-07 — lo que falla por dentro deja de contarse por fuera
---

# `Failed to fetch` no es un mensaje para nadie

## El defecto

`LoginPage` y `AgentLoginPage` traducían **un único** error —`Invalid login
credentials`— y para cualquier otro hacían `setError(signInError)`. Ese
`signInError` es el `error.message` que devuelven `customerAuth` y `agentAuth`
desde Supabase, así que la pantalla enseñaba lo de dentro.

Medido antes del arreglo, con la petición real de GoTrue interceptada:

| Superficie | Error provocado | Texto visible |
| --- | --- | --- |
| Cliente | 500 con `relation "auth.users" does not exist` | **`{}`** |
| Cliente | conexión rechazada | **`Failed to fetch`** |
| Agente | 500 técnico | **`{}`** |
| Agente | conexión rechazada | **`Failed to fetch`** |

## Contraprueba, test-first

Las siete pruebas se escribieron **antes** del arreglo y se ejecutaron contra el
código defectuoso: **4 rojas y 3 verdes**. Las tres que ya pasaban son
exactamente las que debían seguir funcionando —credenciales incorrectas en
cliente y agente, y la cuenta sin permiso de agente—, lo que demuestra que la
suite distingue lo roto de lo sano en vez de fallar por construcción.

## La frontera elegida

Una función pura compartida, `clasificarErrorInicioSesion`, en
`src/lib/loginErrors.ts`. Devuelve `'credenciales'` o `'generico'`.

Se descartó sanear en cada pantalla —dos mapeos separados divergen en cuanto uno
añade un caso— y también cambiar lo que devuelven las capas de auth: eso es más
arquitectura de la necesaria y el `error.message` sigue siendo útil para quien
depura. Lo que no puede es llegar al DOM.

**No se generalizó** a `signUp`, `signOut`, perfil, checkout ni al resto de
Supabase. A62-07 es el inicio de sesión de cliente y agente.

## Resultado

Verificado en las 12 combinaciones de superficie × viewport × escenario:

| Escenario | Cliente | Agente |
| --- | --- | --- |
| Fallo de servidor | «No se ha podido iniciar sesión. Inténtalo de nuevo.» | ídem |
| Red caída | ídem | ídem |
| Credenciales incorrectas | «Email o contraseña incorrectos.» | ídem |
| Sin permiso de agente | — | conserva su mensaje propio |

En los doce casos: `role="alert"` intacto, ningún rastro técnico en el `body`, y
el botón vuelve a su estado normal.

## Alcance

`LoginPage`, `AgentLoginPage`, el helper nuevo, los cinco diccionarios y dos
ficheros de prueba. **No se tocaron** `customerAuth` ni `agentAuth`, ni la
pantalla de «Supabase no está configurado», que es configuración de entorno y no
un error de petición.

**A62-09 queda explícitamente fuera**: no se añadió `AbortController`, ni
`AbortSignal.timeout`, ni `setTimeout`, ni reintento. Esta entrega decide **qué**
se enseña, no **cuándo** aparece.

`RegisterPage` muestra igual el error crudo de `signUp`. Es la misma familia de
defecto pero **no es A62-07**, que se limita al inicio de sesión; queda anotado
sin implementar.

## Siguiente paso

Revisar la PR antes de fusionarla.
