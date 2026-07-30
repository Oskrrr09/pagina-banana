---
tipo: fuentes
actualizado: 2026-07-30
tema: origen de las imágenes de accesorios Apple
---

# Fuentes de imágenes — Catálogo de accesorios

Fecha de descarga: 2026-07-30.

Todas las imágenes viven en `public/img/accessories/`. Se sirven
localmente (sin hotlinking) y su alt es descriptivo.

## Convenciones

- **Fotografías oficiales de Apple España** (formato JPEG 1200×1200)
  descargadas desde `store.storeimages.cdn-apple.com` a partir del
  SKU público visible en la ficha correspondiente
  (`apple.com/es/shop/product/…`). Se conservan tal cual, sin
  recorte ni marcas.
- **Ilustraciones bespoke del prototipo** (formato SVG, ~1–2 KB) para
  productos en los que no fue posible obtener un asset oficial estable
  desde el CDN público de Apple. Incluyen la leyenda "Ilustración del
  prototipo" y son originales de este repositorio.

## Tabla

| Producto | Archivo local | Fuente | Fecha | Variante | Transformación | Dimensiones | Formato |
|---|---|---|---|---|---|---|---|
| Adaptador USB-C 20 W | `apple-20w-usb-c-adapter.jpg` | apple.com/es CDN (SKU MD3J4) | 2026-07-30 | Único | Ninguna | 1200×1200 | JPEG |
| Adaptador USB-C 30 W | `apple-30w-usb-c-adapter.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Único | — | 800×800 (SVG) | SVG |
| Cargador MagSafe (1 m) | `magsafe-charger-1m.jpg` | apple.com/es CDN (SKU MHXH3) | 2026-07-30 | 1 m | Ninguna | 1200×1200 | JPEG |
| Cargador MagSafe (2 m) | `magsafe-charger-2m.jpg` | apple.com/es CDN (SKU MT0J3) | 2026-07-30 | 2 m | Ninguna | 1200×1200 | JPEG |
| Cable USB-C trenzado 240 W 2 m | `usb-c-cable-240w-2m.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Único | — | 800×800 (SVG) | SVG |
| Cable Thunderbolt 4 Pro 1,8 m | `thunderbolt-4-pro-cable-1_8m.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Único | — | 800×800 (SVG) | SVG |
| Funda silicona MagSafe iPhone 17 | `iphone-17-silicone-case-guayaba.jpg` | apple.com/es CDN (SKU MHVQ4) | 2026-07-30 | Guayaba intenso | Ninguna | 1200×1200 | JPEG |
| Funda trenzado técnico MagSafe iPhone 17 Pro | `iphone-17-pro-braided-technical-case-blue.jpg` | apple.com/es CDN (SKU MGF44) | 2026-07-30 | Azul | Ninguna | 1200×1200 | JPEG |
| Funda MagSafe iPhone Air | `iphone-air-magsafe-case.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Escarcha | — | 800×800 (SVG) | SVG |
| Correa Crossbody | `iphone-crossbody-strap-guayaba.jpg` | apple.com/es CDN (SKU MHYX4) | 2026-07-30 | Guayaba intenso | Ninguna | 1200×1200 | JPEG |
| Apple Pencil Pro | `apple-pencil-pro.jpg` | apple.com/es CDN (SKU MX2D3) | 2026-07-30 | Único | Ninguna | 1200×1200 | JPEG |
| Apple Pencil (USB-C) | `apple-pencil-usb-c.jpg` | apple.com/es CDN (SKU MUWA3) | 2026-07-30 | Único | Ninguna | 1200×1200 | JPEG |
| Puntas Apple Pencil (pack 4) | `apple-pencil-tips-4pack.jpg` | apple.com/es CDN (SKU MUF82) | 2026-07-30 | Pack | Ninguna | 1200×1200 | JPEG |
| Magic Keyboard iPad Pro 11" (M4) | `magic-keyboard-ipad-pro-11-m4.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Único | — | 800×800 (SVG) | SVG |
| Magic Keyboard (USB-C) | `magic-keyboard-usb-c.jpg` | apple.com/es CDN (SKU MXK73Y) | 2026-07-30 | Único | Ninguna | 1200×1200 | JPEG |
| Magic Keyboard Touch ID y numérico | `magic-keyboard-touch-id-numeric.jpg` | apple.com/es CDN (SKU MXK83Y) | 2026-07-30 | Negro | Ninguna | 1200×1200 | JPEG |
| Magic Mouse (USB-C) | `magic-mouse.jpg` | apple.com/es CDN (SKU MXK63) | 2026-07-30 | Blanco/Negro comparten foto | Ninguna | 1200×1200 | JPEG |
| Magic Trackpad (USB-C) | `magic-trackpad.jpg` | apple.com/es CDN (SKU MXK53) | 2026-07-30 | Blanco/Negro comparten foto | Ninguna | 1200×1200 | JPEG |
| Cable Watch USB-C 1 m | `watch-fast-charge-cable-usb-c-1m.jpg` | apple.com/es CDN (SKU MT0H3) | 2026-07-30 | 1 m | Ninguna | 1200×1200 | JPEG |
| Correa deportiva Watch 46 mm | `watch-sport-band-46mm.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Guayaba intenso M/L | — | 800×800 (SVG) | SVG |
| AirTag (2ª gen.) | `airtag-single.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Individual | — | 800×800 (SVG) | SVG |
| AirTag pack 4 | `airtag-4pack.svg` | Ilustración bespoke del prototipo | 2026-07-30 | Pack | — | 800×800 (SVG) | SVG |

## Notas

- Las variantes `blanco` y `negro` de Magic Mouse y Magic Trackpad
  comparten la misma imagen porque Apple España usa una única
  fotografía representativa. El alt del `<img>` sí distingue la
  variante activa. En una v2 con imágenes propias de Banana se
  pueden separar.
- Las ilustraciones SVG bespoke son originales de este repositorio,
  no reproducen material sujeto a derechos de terceros y se marcan
  visualmente como "Ilustración del prototipo".
- Los archivos JPEG se sirven directamente. Cuando Banana Computer
  aporte fotos propias con derechos de uso web, podrían sustituirse
  por WebP optimizado.
