---
tipo: investigacion
actualizado: 2026-07-30
tema: catálogo inicial de accesorios oficiales Apple
---

# Investigación previa — Catálogo de accesorios Apple

Este documento registra la investigación previa realizada para armar el
primer catálogo real de accesorios oficiales Apple en el prototipo de
Banana Computer. Los datos son de referencia y se marcaron como
demostrativos en el prototipo. La disponibilidad y los precios finales
deben validarse contra el inventario real de Banana Computer.

## Fuentes utilizadas

- **Banana Computer** — `https://tienda.bananacomputer.com/`
  - `/accesorios-apple/accesorios-mac/`
  - `/accesorios-apple/accesorios-ipad/`
  - `/accesorios-apple/fundas-iphone/`
  - `/accesorios-apple/accesorios-watch/`
  - `/accesorios-apple/airpods/`
  - `/accesorios-apple/accesorios-iphone/airtag/`
- **Apple España** — `https://www.apple.com/es/`
  - Fichas oficiales de producto para denominación, compatibilidad e imágenes.
- **Fecha de verificación**: 2026-07-30.

No se usan Amazon, MediaMarkt, blogs, marketplaces ni resultados
antiguos. Los precios que aparecen en el prototipo son "Precio
demostrativo"; el prototipo no promete que sigan vigentes.

## Regla de prioridad aplicada

- **Banana Computer** decide qué productos entran (los publicados en la
  fecha de verificación).
- **Apple España** aporta el nombre técnico, compatibilidad y foto
  oficial cuando existía.
- Nombres que difieren: se documenta debajo.

## Tabla de decisión

| Producto candidato | Categoría | Banana (URL / precio) | Apple España (URL / SKU) | Nombre confirmado | Precio observado | Disponibilidad observada | Compatibilidad confirmada | Imagen | Decisión | Motivo |
|---|---|---|---|---|---|---|---|---|---|---|
| Adaptador de corriente USB-C de 20 W | carga | Banana no lo lista en esta pág.; producto estándar Apple | apple.com/es MD3J4ZM/A | Adaptador de corriente USB-C de 20 W | ~25 € (referencia) | Prototipo | iPhone 12+, iPad estándar | ✓ real (MD3J4) | **Implementar** | Producto base del ecosistema; docs oficiales |
| Adaptador de corriente USB-C de 30 W | carga | Banana €45,00 | apple.com/es MW2G3ZM/A | Adaptador de corriente USB-C de 30 W | 45,00 € | En Banana | MacBook Air, iPad, iPhone | SVG bespoke | **Implementar** | En Banana; SKU no expuesto en CDN pública |
| Cable de carga USB-C trenzado 240 W (2 m) | carga | Banana €35,00 | apple.com/es (referencia) | Cable de carga USB-C trenzado de 240 W (2 m) | 35,00 € | En Banana | Familias USB-C | SVG bespoke | **Implementar** | Publicado por Banana |
| Cable Thunderbolt 4 Pro (USB-C) 1,8 m | carga | Banana €149,00 | apple.com/es | Cable Thunderbolt 4 Pro (USB-C) 1,8 m | 149,00 € | En Banana | Mac Thunderbolt, iPad Pro Thunderbolt | SVG bespoke | **Implementar** | Publicado por Banana |
| Cargador MagSafe (1 m) | carga | Banana lo lista en accesorios iPhone | apple.com/es MHXH3AM/A | Cargador MagSafe | 45,00 € (referencia) | Prototipo | iPhone 12+ y AirPods con carga MagSafe | ✓ real (MHXH3) | **Implementar** | Referencia técnica Apple; ampliamente publicado |
| Funda de silicona con MagSafe iPhone 17 | iphone | Banana €59,00 | apple.com/es varias SKU MHVQ4 (guayaba) | Funda de silicona con MagSafe para el iPhone 17 | 59,00 € | En Banana | iPhone 17 exacto | ✓ real (MHVQ4) | **Implementar** | Confirmado por Banana |
| Funda de trenzado técnico MagSafe iPhone 17 Pro | iphone | Banana €69,00 | apple.com/es MGF44ZM/A | Funda de trenzado técnico con MagSafe para el iPhone 17 Pro | 69,00 € | En Banana | iPhone 17 Pro exacto | ✓ real (MGF44) | **Implementar** | Confirmado |
| Funda con MagSafe iPhone Air | iphone | Banana €59,00 | apple.com/es MGH34ZM/A | Funda con MagSafe para el iPhone Air | 59,00 € | En Banana | iPhone Air exacto | SVG bespoke | **Implementar** | Publicado por Banana; SKU cerrado a CDN pública |
| Correa Crossbody (Apple) | iphone | Banana la lista en iPhone accessories | apple.com/es MHYX4ZM/A | Correa Crossbody | 69,00 € | En Banana | iPhone con MagSafe (accesorio de transporte) | ✓ real (MHYX4) | **Implementar** | Novedad publicada por Apple |
| Apple Pencil Pro | ipad | Banana €149,00 | apple.com/es MX2D3ZM/A | Apple Pencil Pro | 149,00 € | En Banana | iPad Pro M4/M5, iPad Air M2/M3, iPad Air 11/13 M4 | ✓ real (MX2D3) | **Implementar** | Publicado por Banana |
| Apple Pencil (USB-C) | ipad | Banana €89,00 | apple.com/es MUWA3ZM/A | Apple Pencil (USB-C) | 89,00 € | En Banana | iPad 10ª/11ª gen., iPad mini 6/7, iPad Air/Pro compatibles | ✓ real (MUWA3) | **Implementar** | Publicado por Banana |
| Puntas Apple Pencil (Pack x4) | ipad | Banana €24,90 | apple.com/es MUF82ZM/A | Puntas para Apple Pencil (pack de 4) | 24,90 € | En Banana | Apple Pencil 1ª/2ª gen. | ✓ real (MUF82) | **Implementar** | Publicado por Banana |
| Magic Keyboard iPad Pro 11" (M4) | ipad | Banana €349,00 | apple.com/es | Magic Keyboard para el iPad Pro de 11" (M4) | 349,00 € | En Banana | iPad Pro 11 M4 exacto | SVG bespoke | **Implementar** | Publicado por Banana |
| Magic Keyboard (USB-C) | mac | Banana €119,00 | apple.com/es MXK73Y/A | Magic Keyboard (USB-C) | 119,00 € | En Banana | Mac con USB-C | ✓ real (MXK73Y) | **Implementar** | Publicado |
| Magic Keyboard con Touch ID y teclado numérico (USB-C) | mac | Banana €199-229 (blanco/negro) | apple.com/es MXK83Y/A | Magic Keyboard con Touch ID y teclado numérico (USB-C) | 229,00 € (negro) | En Banana | Mac con chip Apple | ✓ real (MXK83Y) | **Implementar** | Publicado; Touch ID requiere Mac chip Apple |
| Magic Mouse (USB-C) | mac | Banana €85 (blanco) / €119 (negro) | apple.com/es MXK63ZM/A | Magic Mouse (USB-C) | 85,00 € (blanco) / 119,00 € (negro) | En Banana | Mac | ✓ real (MXK63) | **Implementar** | Publicado; variantes blanca/negra |
| Magic Trackpad (USB-C) | mac | Banana €139 (blanco) / €169 (negro) | apple.com/es MXK53ZM/A | Magic Trackpad (USB-C) | 139,00 € (blanco) / 169,00 € (negro) | En Banana | Mac | ✓ real (MXK53) | **Implementar** | Publicado |
| Cable de carga rápida magnética Apple Watch (USB-C, 1 m) | watch | Banana €29,00 | apple.com/es MT0H3TY/A | Cable de carga rápida magnética con conector USB-C para el Apple Watch (1 m) | 29,00 € | En Banana | Apple Watch — carga rápida en Series 7+ y Ultra | ✓ real (MT0H3) | **Implementar** | Publicado |
| Correa deportiva Apple Watch 46 mm | watch | Banana €49,00 | apple.com/es MHYJ4ZM/A | Correa deportiva | 49,00 € | En Banana | Cajas 42/44/45/46/49 mm según variante | SVG bespoke | **Implementar** | Publicado; tallas M-L |
| AirTag (2ª generación) | airtag | Banana €35,00 | apple.com/es | AirTag (2ª generación) | 35,00 € | En Banana | iPhone/iPad con Buscar | SVG bespoke | **Implementar** | Publicado |
| AirTag pack de 4 | airtag | Banana €119,00 | apple.com/es | AirTag (2ª generación) — Pack de 4 | 119,00 € | En Banana | iPhone/iPad con Buscar | SVG bespoke | **Implementar** | Publicado |
| **Almohadillas para AirPods Pro** | airpods | **NO** en Banana (solo terceros: Next One, Epico) | — | — | — | — | — | — | **Descartar** | Banana no publica el accesorio oficial "Almohadillas" en su categoría AirPods. Se retira `demo:apple-airpods-tips` del buscador |
| Llavero trenzado fino AirTag | airtag | Banana €49,00 pero "Disponible próximamente" | apple.com/es | — | 49,00 € | Coming soon en Banana | AirTag | — | **Aplazar** | Sin disponibilidad actual en Banana; se aplaza |
| Batería MagSafe iPhone Air | iphone | No listado activamente | — | — | — | — | — | — | **Aplazar** | No aparece publicado por Banana en la fecha de verificación |
| iPhone 17e (para funda 17e) | — | Banana lista fundas 17e a €59 | — | — | — | — | — | — | **No aplica** | El prototipo no incluye iPhone 17e como dispositivo; no se añade su funda |
| EarPods USB-C / 3,5 mm | audio | No priorizado en fase 1 | — | — | — | — | — | — | **Aplazar** | Fuera de alcance de esta primera oleada |

### Total

- **Implementados**: 20 fichas.
- **Aplazados**: 3 (llavero AirTag por coming soon, batería MagSafe iPhone Air, EarPods USB-C).
- **Descartado**: 1 (Almohadillas AirPods — no publicado por Banana).

## Precios: observado vs mostrado

- El precio "observado" es el que aparece en Banana Computer o Apple
  España el 2026-07-30.
- El precio "mostrado" en el prototipo es idéntico al observado, pero
  siempre acompaña de la etiqueta `Precio demostrativo`.
- El prototipo NO afirma que el precio siga vigente.
- El prototipo NO añade financiación ni descuento.

## Disponibilidad: observado vs mostrado

- Banana etiqueta como "Disponible" o "Disponible próximamente" en la
  fecha de verificación.
- El prototipo muestra siempre uno de:
  - "Producto mostrado públicamente por Banana"
  - "Disponibilidad pendiente de validación"
- El prototipo NO muestra stock por tienda, plazos exactos ni promesas.

## Cambios en el índice del buscador

- `SEARCH_DEMO_ITEMS` en `src/data/searchIndex.ts` pierde:
  - `demo:apple-airpods-tips` (no verificable).
  - `demo:apple-usb-c-cable`, `demo:apple-usb-c-adapter`,
    `demo:apple-magsafe`, `demo:apple-watch-band` (sustituidos por los
    productos reales del catálogo).
- Los productos genéricos de terceras marcas
  (`demo:third-*`, `demo:beats-solo`, `demo:sony-wh`, `demo:bose-qc`)
  siguen etiquetados como "Contenido demostrativo" — el prototipo no
  puede verificarlos como parte del catálogo real.

## Limitaciones

1. Precios observados sin garantía de vigencia.
2. Disponibilidad sujeta a validación con Banana.
3. Falta acceso al SKU/EAN real y al inventario por tienda.
4. Algunas imágenes son ilustraciones bespoke del prototipo cuando el
   asset oficial no era accesible desde el CDN público de Apple; se
   documentan en `docs/fuentes-imagenes-accesorios.md`.
5. Sin integración con carrito, checkout, seguro, favoritos o
   comparador — fuera de alcance de esta PR.

## Datos que Banana necesitaría aportar para una v2

- Lista canónica de SKUs de accesorios en stock por tienda.
- Precios y promociones vigentes.
- Fotos de producto propias con derechos de uso web.
- Compatibilidad detallada por familia y generación.
- Etiquetas de disponibilidad reales (Disponible / Bajo pedido / Agotado).
- Política sobre accesorios de terceros (¿cuáles entran como catálogo real?).
