---
tipo: sesion
fecha: 2026-07-29
tema: tienda favorita (PR3 del bloque diferencial)
---

# Tienda favorita

## Objetivo

Personalizar la experiencia con una tienda favorita sin pedir
permisos del navegador, sin geolocalización y sin recopilar datos
personales.

## Cambios

- `src/lib/storePreference.tsx`: contexto React + persistencia
  local (`banana:favorite-store` = slug, `banana:favorite-store-prompt`
  = 'dismissed').
- `src/components/layout/FavoriteStoreDialogs.tsx`: bottom sheet no
  bloqueante, oculto en checkout, dismissable con Escape y
  confirmación discreta al elegir.
- `src/components/layout/Header.tsx`: `FavoriteStoreMenu` en la
  barra utilitaria con `role="menu"` / `menuitemradio`.
- `src/components/layout/MobileMenu.tsx`: `FavoriteStoreMobileBlock`
  con la misma funcionalidad accesible desde móvil.
- `src/pages/StoresPage.tsx`: `sortStoresWithFavoriteFirst` + badge
  "Tu tienda".
- `src/pages/StoreDetailPage.tsx`: `FavoriteStoreControl` con CTA
  "Marcar como mi tienda" / "Esta es tu tienda" + "Quitar".
- `src/components/product/StorePicker.tsx`: prioriza la tienda
  favorita con badge y nota "Consultar en tu tienda".

## Privacidad

- Sólo se guarda el slug de tienda y el flag `dismissed`.
- No hay `getCurrentPosition`, IP, email, nombre ni ninguna otra
  clave nueva relacionada con el usuario. Verificado por test.

## Checkout

- No se modifica lógica de checkout ni de seguro.
- La priorización de tienda favorita se limita al `StorePicker` y
  a la página de tiendas, no cambia selección explícita en el
  paso 1.

## Tests

- Nueva `tests/e2e/favorite-store.spec.ts` (7): prompt inicial
  no bloqueante, "Ahora no", elegir tienda + persistencia,
  cabecera actualizada + badge en `/tiendas`, marcar/quitar
  desde detalle, sin PII, 375 px sin scroll y ausencia en
  checkout.
- Total: 82 → 90 en verde.

## Resultados

- `npm run build`: correcto.
- `npm run test:e2e`: 90/90.

## Fuera de alcance

- PR4: favoritos + avisos.
- Sin cambios en seguro, checkout, catálogo, Plan Renove,
  Servicio Técnico ni scripts privados.
