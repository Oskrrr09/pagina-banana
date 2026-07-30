---
tipo: auditoria
actualizado: 2026-07-30
tema: auditoría visual del catálogo de accesorios Apple
---

# Auditoría visual — Catálogo de accesorios

Origen: PR correctiva `fix/accessory-images-and-search-cards` sobre
la primera oleada (PR #27, merge `cf40bd6`).

## Metodología

Se recorrieron los 20 productos actuales del catálogo. Para cada uno
se comprobó:

- Tipo de asset (fotografía, ilustración, icono).
- Correspondencia producto/imagen.
- Correspondencia variante/imagen.
- Espacio blanco interno excesivo.
- Duplicidad entre variantes.
- Fuente documentada.

## Tabla

| Slug | Variante | Ruta ANTES | Formato ANTES | Fotografía real | Correcto (producto) | Correcto (color) | Margen excesivo | Duplicada con | Decisión | Ruta AHORA |
|---|---|---|---|---|---|---|---|---|---|---|
| adaptador-corriente-usb-c-20w | único | apple-20w-usb-c-adapter.jpg (MD3J4) | JPEG 1200 | Sí | Sí | Sí | Ligero | — | Conservar + `imagePresentation.scale=1.1` | apple-20w-usb-c-adapter.jpg |
| adaptador-corriente-usb-c-30w | único | apple-30w-usb-c-adapter.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MY1W2_GEO_EMEA) | apple-30w-usb-c-adapter.jpg |
| cargador-magsafe | 1 m | magsafe-charger-1m.jpg (MHXH3) | JPEG 1200 | Sí | Sí | — | — | — | Conservar | magsafe-charger-1m.jpg |
| cargador-magsafe | 2 m | magsafe-charger-2m.jpg (MT0J3) | JPEG 1200 | Sí | Sí | — | — | — | Conservar | magsafe-charger-2m.jpg |
| cable-usb-c-trenzado-240w-2m | único | usb-c-cable-240w-2m.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MU2G3) | usb-c-cable-240w-2m.jpg |
| cable-thunderbolt-4-pro-1_8m | único | thunderbolt-4-pro-cable-1_8m.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MWP73) | thunderbolt-4-pro-cable-1_8m.jpg |
| funda-silicona-magsafe-iphone-17 | guayaba | iphone-17-silicone-case-guayaba.jpg (MHVQ4) | JPEG 1200 | Sí | Sí | Sí | — | — | Conservar | iphone-17-silicone-case-guayaba.jpg |
| funda-trenzado-tecnico-magsafe-iphone-17-pro | azul | iphone-17-pro-braided-technical-case-blue.jpg (MGF44) | JPEG 1200 | Sí | Sí | Sí | — | — | Conservar | iphone-17-pro-braided-technical-case-blue.jpg |
| funda-magsafe-iphone-air | escarcha | iphone-air-magsafe-case.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MGH34) | iphone-air-magsafe-case.jpg |
| correa-crossbody | guayaba | iphone-crossbody-strap-guayaba.jpg (MHYX4) | JPEG 1200 | Sí | Sí | Sí | — | — | Conservar | iphone-crossbody-strap-guayaba.jpg |
| apple-pencil-pro | único | apple-pencil-pro.jpg (MX2D3) | JPEG 1200 | Sí | Sí | — | — | — | Conservar | apple-pencil-pro.jpg |
| apple-pencil-usb-c | único | apple-pencil-usb-c.jpg (MUWA3) | JPEG 1200 | Sí | Sí | — | — | — | Conservar | apple-pencil-usb-c.jpg |
| puntas-apple-pencil-pack-4 | pack | apple-pencil-tips-4pack.jpg (MUF82) | JPEG 1200 | Sí | Sí | — | — | — | Conservar | apple-pencil-tips-4pack.jpg |
| magic-keyboard-ipad-pro-11-m4 | único | magic-keyboard-ipad-pro-11-m4.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MWR03) | magic-keyboard-ipad-pro-11-m4.jpg |
| magic-keyboard-usb-c | único | magic-keyboard-usb-c.jpg (MXK73Y) | JPEG 1200 | Sí | Sí | — | — | — | Conservar | magic-keyboard-usb-c.jpg |
| magic-keyboard-touch-id-numeric-usb-c | negro | magic-keyboard-touch-id-numeric.jpg (MXK83Y) | JPEG 1200 | Sí | Sí | Sí | — | — | Conservar | magic-keyboard-touch-id-numeric.jpg |
| magic-mouse-usb-c | blanco | magic-mouse.jpg (MXK63) | JPEG 1200 | Sí | **No — es el Magic Mouse negro** | **No** | — | Se usaba también como negro | **Sustituir** por MXK53 (blanco real) | magic-mouse-white.jpg |
| magic-mouse-usb-c | negro | magic-mouse.jpg (MXK63) | JPEG 1200 | Sí | Sí | Sí | — | Compartía con blanco | **Renombrar** a magic-mouse-black.jpg | magic-mouse-black.jpg |
| magic-trackpad-usb-c | blanco | magic-trackpad.jpg (MXK53) | JPEG 1200 | Sí | **No — era Magic Mouse blanco, no un trackpad** | — | — | Compartía imagen con negro | **Sustituir** por MXK93 (Trackpad blanco real) | magic-trackpad-white.jpg |
| magic-trackpad-usb-c | negro | magic-trackpad.jpg (MXK53) | JPEG 1200 | Sí | **No — era Magic Mouse blanco** | **No** | — | Igual que blanco | **Sustituir** por MXKA3 (Trackpad negro real) | magic-trackpad-black.jpg |
| watch-fast-charge-cable-usb-c-1m | 1 m | watch-fast-charge-cable-usb-c-1m.jpg (MT0H3) | JPEG 1200 | Sí | Sí | — | — | — | Conservar | watch-fast-charge-cable-usb-c-1m.jpg |
| correa-deportiva-watch-46mm | guayaba | watch-sport-band-46mm.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MHYH4ref) | watch-sport-band-46mm-guayaba.jpg |
| airtag-2gen | individual | airtag-single.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MX542) | airtag-single.jpg |
| airtag-2gen-pack-4 | pack | airtag-4pack.svg | SVG bespoke | **No** | — | — | — | — | **Sustituir** por foto real (MX4M2) | airtag-4pack.jpg |

## Resumen

- **8 SVG bespoke** localizados. Todos sustituidos por fotografías
  reales del CDN público de Apple España.
- **4 variantes con imagen equivocada** (Magic Mouse blanco/negro y
  Magic Trackpad blanco/negro compartían un asset o usaban el
  asset del otro producto). Corregidas con 4 fotos distintas.
- **0 productos retirados**: se pudo obtener una fotografía real para
  cada uno de los 20.
- **0 variantes retiradas**.

## Cambios de encuadre

- Retirado `object-contain p-6` de `AccessoryCard` — sustituido por
  el helper `AccessoryImage` (padding tipado, valores por defecto
  moderados).
- Retirado `object-contain p-8` de la galería principal de
  `AccessoryDetailPage`.
- Retirado `object-contain p-4` de las miniaturas de "Accesorios
  compatibles" en `ModelPage`.
- Retirado `imageBg: '#f5f5f7'` de todas las fichas: las
  fotografías ya llevan fondo blanco propio, no hace falta pintar
  otro.
- Nuevo `imagePresentation` en el tipo `Accessory` con `fit`,
  `scale`, `position`, `padding` y `background` tipados. Usado en
  adaptadores 20 W y 30 W (scale 1.1, padding compact) para que no
  se vean diminutos.

## Cambios en resultados de búsqueda

- Nuevo componente `AccessorySearchCard` con fotografía + nombre +
  marca + compatibilidad + precio demostrativo.
- `SearchPage.tsx`: la sección "Accesorios Apple" ahora usa
  `AccessoryVisualGrid` que renderiza `AccessorySearchCard` para
  ítems reales (`kind: 'apple-accessory'`, `demo: false`) y mantiene
  `CompactSearchCard` como fallback para eventuales demos.
- `ExactMatchCard` también renderiza `AccessorySearchCard` cuando el
  match exacto es un accesorio real.

## Cambios en Header

- `SuggestionRow` muestra miniatura de 44×44 px cuando `item.image`
  existe y `item.demo === false`. Los ítems demo mantienen el icono
  de lupa.
- Enter directo, ArrowUp/Down, Escape y aria-activedescendant
  intactos.
