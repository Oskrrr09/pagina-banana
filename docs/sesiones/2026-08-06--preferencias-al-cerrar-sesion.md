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

## Decisiones tomadas

- [[02-decisiones#D-062]]: reinicio por aviso interno, concreto y no genérico,
  con cada escucha en su propio `try` para que un `localStorage` no disponible
  no pueda dejar el cierre de sesión a medias.

## Comprobaciones

- Prettier, TypeScript y ESLint: sin incidencias.
- Vitest: **187 aprobadas**, con los 5 casos nuevos del aviso interno.
- `npm run build:test`: correcto.
- `npm run test:e2e:prefs`: **6 aprobadas** con los proveedores reales montados
  en un navegador real y su `localStorage`.
- E2E existentes de favoritos, avisos y cuentas: **18 aprobadas**.
- Contraprueba: revertido el cableado, **4 de los 6 casos nuevos fallan** y los
  2 que cubren el uso normal siguen pasando. Las pruebas cazan el fallo.

## Archivos afectados

- `src/lib/accountSession.ts` (nuevo)
- `src/lib/customerAuth.tsx`, `src/lib/storePreference.tsx`,
  `src/lib/favoriteAlerts.tsx`
- `tests/unit/account-session.test.ts` (nuevo)
- `tests/e2e-prefs/` (nuevo: fixture y suite)
- `playwright.prefs.config.ts` (nuevo), `package.json`,
  `.github/workflows/ci.yml`

## Siguiente paso

La PR queda **en borrador**, sin fusionar. Pendiente de revisión.
