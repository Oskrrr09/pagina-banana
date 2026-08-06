---
tipo: sesion
fecha: 2026-08-06
tema: las preferencias de cuenta dejan de sobrevivir al cierre de sesión
---

# Las preferencias de cuenta dejan de sobrevivir al cierre de sesión

## Objetivo

Cerrar un fallo de privacidad: en un navegador compartido, quien entraba después
de que otra persona cerrara sesión seguía viendo su tienda habitual, los
productos que estaba siguiendo y sus notificaciones.

## Estado inicial

Cuatro preferencias guardadas en claves generales de `localStorage`, sin separar
por usuario, y un `signOut()` que sólo se ocupaba de Supabase y de su propio
estado:

- `banana:favorite-store`
- `banana:favorite-store-prompt`
- `banana:favorite-alerts`
- `banana:favorite-notifications`

## Trabajo realizado

La causa es de modelo, no de olvido: son datos **de la cuenta** guardados como
si fueran **del dispositivo**.

El arreglo tiene una restricción que condiciona la forma. `StorePreferenceProvider`
y `FavoriteAlertsProvider` están por debajo de `CustomerAuthProvider` en el árbol
de `src/main.tsx`, así que desde el proveedor de sesión no se pueden usar sus
hooks, y reordenarlos arrastraría al Header, al checkout y al panel de agentes.

Se resuelve con un aviso interno tipado, `src/lib/accountSession.ts`:
`signOut()` lo emite después de cerrar en Supabase y cada proveedor se suscribe
y se reinicia solo. Cada proveedor sigue siendo dueño de su estado.

### Dos medias soluciones que no habrían bastado

- **Sólo borrar las claves**: los proveedores mantienen el estado en memoria, así
  que la interfaz habría seguido enseñando los datos hasta recargar.
- **Sólo reiniciar el estado**: el efecto de persistencia de `favoriteAlerts`
  volvía a escribir `"[]"` y la clave reaparecía. Ahora una lista vacía **borra**
  su clave, que además es lo coherente: al leer, ausente y vacía ya significaban
  lo mismo.

Descartado `window.location.reload()`: esconde el problema y tira por delante el
estado de toda la aplicación.

## Segunda pasada: el error de Supabase se ignoraba

Revisando el cambio apareció algo peor que lo original: `signOut()` no miraba el
`{ error }` que devuelve `supabase.auth.signOut()`. Las preferencias podían
borrarse con la sesión **todavía abierta**, y `/cuenta` navegaba a la portada
antes de saber si el cierre había funcionado: quien fallara al salir se iba
convencido de haber salido.

Se corrige extrayendo `cerrarSesionCliente()`, con las dependencias inyectadas
para poder probarla sin navegador ni Supabase y sin duplicar la lógica en un
fixture. La limpieza va dentro de su callback de éxito. `signOut()` devuelve
`{ error }` y `/cuenta` lo gestiona: si falla se queda en la página y lo dice
con un `role="alert"`.

Eso obligó a rehacer el guardia de la página, que mandaba a `/login` en cuanto
la sesión pasaba a null. Ahora queda suspendido mientras dura el cierre.

## Decisiones tomadas

- [[02-decisiones#D-062]]: reinicio por aviso interno, concreto y no genérico,
  con cada escucha en su propio `try` para que un `localStorage` no disponible
  no pueda dejar el cierre de sesión a medias.
- El aviso se emite **sólo** desde `signOut()`, no desde `onAuthStateChange`:
  supabase-js emite `SIGNED_OUT` antes de resolver la promesa, así que hacerlo
  en los dos sitios lo dispararía dos veces. Los cierres externos quedan como
  riesgo residual documentado —[[03-roadmap#5.4 Reiniciar preferencias en cierres de sesión externos]]—
  y no se resuelven ahí sin distinguir antes la sesión anónima del chat, que
  comparte cliente de Supabase.

## Comprobaciones

- Prettier, TypeScript y ESLint: sin incidencias.
- Vitest: **193 aprobadas**, con los 5 casos del aviso interno y los 6 del
  cableado de `cerrarSesionCliente()`.
- `npm run build:test`: correcto.
- `npm run test:e2e:prefs`: **10 aprobadas** — 6 con los proveedores reales
  montados en un navegador real y su `localStorage`, y 4 con el `ProfilePage`
  de producción y el contexto de sesión inyectado.
- E2E existentes de favoritos, avisos y cuentas: **18 aprobadas**.
- Contraprueba doble: revertido el cableado de los proveedores, **4 de los 6**
  casos de preferencias fallan y los 2 del uso normal siguen pasando;
  restaurada la `ProfilePage` anterior, **fallan las 4** de la pantalla. Las
  pruebas cazan los dos fallos.

### CI en verde — run `31128555965` sobre `a3aa23e`

| Trabajo | Resultado |
| --- | --- |
| Tipos, lint y pruebas unitarias | 193 aprobadas (11 ficheros) · 48s |
| Compilar | correcto · 43s |
| Integración Supabase local | 36 RLS + 2 integración + 5 confirmación · 4m25s |
| Pruebas E2E, cinco motores | 296 aprobadas, 1 omitida · 6m09s |
| Panel de agentes aislado | 6 aprobadas |
| Reinicio de preferencias al cerrar sesión | 10 aprobadas |

`Publicar en GitHub Pages` figura **omitido, y es lo correcto**: el workflow se
lanzó a mano y la publicación sólo ocurre al fusionar en `main`.

Las 10 del banco de pruebas aislado pasaron en CI, no sólo en local. Y la E2E
que en la rama anterior salió inestable —`search.spec.ts:342`— pasó aquí a la
primera.

Los **cuatro intentos anteriores no llegaron a ejecutar ni un paso**: GitHub no
asignaba máquina («the job was not acquired by Runner of type hosted»). No era
del cambio, sino de los runners alojados: la misma revisión pasó entera después
sin tocar una línea. Queda anotado porque un CI en rojo no siempre habla del
código.

## Archivos afectados

- `src/lib/accountSession.ts` (nuevo)
- `src/lib/customerAuth.tsx`, `src/lib/storePreference.tsx`,
  `src/lib/favoriteAlerts.tsx`, `src/pages/ProfilePage.tsx`
- `tests/unit/account-session.test.ts` y `tests/unit/cerrar-sesion.test.ts`
  (nuevos)
- `tests/e2e-prefs/` (nuevo: dos fixtures y dos suites, preferencias y
  `/cuenta`)
- `playwright.prefs.config.ts` (nuevo), `package.json`,
  `.github/workflows/ci.yml`

## Siguiente paso

PR #36 sobre `a3aa23e`, marcada como lista para revisión con el CI en verde.
**Sin fusionar**: la integración es decisión de Oscar.
