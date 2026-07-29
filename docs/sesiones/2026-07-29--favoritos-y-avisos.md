---
tipo: sesion
fecha: 2026-07-29
tema: favoritos + seguimiento de disponibilidad + notificaciones (PR4)
---

# Favoritos + avisos de disponibilidad

## Objetivo

Convertir favoritos en una herramienta útil después de guardar un
producto: seguimiento demostrativo de disponibilidad en una tienda
+ centro de notificaciones interno + simulación de llegada.

## Datos y estado

- `src/data/demoStoreInventory.ts`: 4 estados demostrativos por
  tienda × modelo con hash determinista (mismo par → mismo
  estado). `setInventoryOverride` para la simulación de llegada.
- `src/lib/favoriteAlerts.tsx`: contexto con `alerts`,
  `notifications`, `setAlert`, `changeAlertStore`, `disableAlert`,
  `simulateArrival`, `markRead`, `markAllRead`.
- Claves nuevas:
  * `banana:favorite-alerts`
  * `banana:favorite-notifications`
- Sin cambios en `banana:fav`.

## UI

- `/favoritos` rediseñada con tres secciones (`Mis productos`,
  `Mis avisos`, `Notificaciones`).
- Nueva `NotificationsBell` en la cabecera con contador de no
  leídos, panel accesible (Escape, click-out, `role="dialog"`,
  `aria-labelledby`).
- Al quitar un favorito con seguimiento se elimina también el
  alert y sus notificaciones huérfanas.

## Privacidad

- Sin inputs de email.
- Sin peticiones de red externas (comprobado por test).
- Sin PII: sólo se guardan slugs, timestamps y estados.

## Tests

- Nueva `tests/e2e/favorites-alerts.spec.ts` (3):
  1. Seguimiento + simulación de llegada + notificación +
     contador en la campana + marcar todas como leídas.
  2. Quitar favorito con seguimiento activo → no quedan
     alertas huérfanas ni notificaciones.
  3. Ausencia de `input[type=email]` y de peticiones externas.
- Ajuste mínimo en la tarjeta de favoritos: el nombre pasa a
  `<h3>` para que `favorites-compare.spec.ts` siga usando
  `getByRole('heading', { level: 3, name: ... })`.

## Resultados

- `npm run build`: correcto.
- `npm run test:e2e`: 93/93.

## Fuera de alcance

- Envío real de correos.
- Backend / base de datos.
- Cambios en el catálogo, seguro, checkout o Plan Renove.
