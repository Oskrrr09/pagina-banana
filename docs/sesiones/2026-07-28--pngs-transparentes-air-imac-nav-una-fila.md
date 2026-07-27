---
tipo: sesion
fecha: 2026-07-28
tema: PNGs transparentes Air+iMac desde CDN Apple y nav en una sola fila
---

# PNGs transparentes Air/iMac y nav en una fila

## Objetivo

El usuario identificó tres problemas restantes en la pantalla "Comprar un Mac":
1. Las imágenes de MacBook Air e iMac tenían fondo blanco sólido, no eran PNGs transparentes.
2. El nav strip aparecía en dos filas (solución anterior con `flex-wrap`).
3. Algunas miniaturas se veían más arriba o más abajo que otras.

## Trabajo realizado

### PNGs transparentes desde el CDN de Apple

Se accedió a `apple.com/shop/buy-mac/macbook-air` y `apple.com/macbook-air/` para
extraer los slugs de imagen de color del CDN `store.storeimages.cdn-apple.com`.

**Slugs encontrados:**
- MacBook Air 13": `mba13-midnight-select-202503`, `mba13-silver-select-202503`,
  `mba13-starlight-select-202503`, `mba13-skyblue-select-202503`
- iMac 24" M4 (touch id): `imac-touch-id-blue-selection-hero-202410`,
  `imac-touch-id-orange-selection-hero-202410`, `imac-touch-id-pink-selection-hero-202410`,
  `imac-touch-id-purple-selection-hero-202410`
- iMac 24" M4 (vesa): `imac-vesa-green-selection-hero-202410`,
  `imac-vesa-silver-selection-hero-202410`, `imac-vesa-yellow-selection-hero-202410`

**Parámetro CDN:** `?fmt=png-alpha&wid=1080&hei=1080` → PNG RGBA 1080×1080 con canal alpha.

Todos los archivos verificados con Python: color type = RGBA (bit_depth=8).

### Nav strip — una sola fila

Cambiado el nav en `FamilyPage.tsx`:
- `<nav>`: `overflow-x-auto no-scrollbar pb-2` (scroll horizontal en móvil)
- `<ul>`: `flex w-max min-w-full gap-2 justify-start lg:justify-center`
- `<li>`: `w-24 shrink-0` (96px por item)

Con 9 items (8 modelos + comparar): 9×96 + 8×8 = 928px < 960px disponibles en lg. 
En escritorio quedan centrados; en móvil se hace scroll horizontal sin scrollbar visible.

### Centrado de miniaturas

Con imágenes 1080×1080 cuadradas desde Apple CDN y `object-contain object-center`,
todos los thumbnails se renderizan con la misma composición. El iMac mantiene `imageBg`
para el fondo de color característico.

## Comprobaciones

- Build: `✓ built in 647ms`, 3 assets.
- Workflow `30313993859` completado con `success`.
- Screenshot `/mac`: nav en una fila, 9 items visibles sin scroll.
- Screenshot `/mac/macbook-air-m4`: Air Medianoche/Plata/Blanco estrella transparentes y centrados.
- Screenshot `/mac/imac-24-m4`: iMac Azul/Verde/Rosa con fondo de color, sin recuadro blanco.

## Archivos afectados

- `public/img/products/macbook-air-medianoche.png`
- `public/img/products/macbook-air-plata.png`
- `public/img/products/macbook-air-blanco-estrella.png`
- `public/img/products/macbook-air-skyblue.png`
- `public/img/products/imac-24-m4-azul.png`
- `public/img/products/imac-24-m4-naranja.png`
- `public/img/products/imac-24-m4-rosa.png`
- `public/img/products/imac-24-m4-morado.png`
- `public/img/products/imac-24-m4-verde.png`
- `public/img/products/imac-24-m4-plata.png`
- `public/img/products/imac-24-m4-amarillo.png`
- `src/pages/FamilyPage.tsx`

## Siguiente paso

Valorar si añadir imágenes equivalentes para MacBook Pro y otros modelos Mac
(actualmente usan imágenes con fondo blanco procesadas con sips).
