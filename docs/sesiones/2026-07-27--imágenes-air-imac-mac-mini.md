---
tipo: sesion
fecha: 2026-07-27
tema: Imágenes Air (portátil abierto), fondo iMac y visibilidad Mac mini
---

# Imágenes Air abiertas, fondo iMac y catálogo Mac mini

## Objetivo

Corregir tres problemas detectados en la sesión anterior:
1. Las imágenes del MacBook Air M4/M5 mostraban un compuesto de tres vistas (perfil de canto, vista abierta y tapa) en lugar de solo el portátil abierto.
2. Las fotos del iMac 24" M4 tienen fondos de color que creaban un recuadro visible al mostrarse sobre el fondo neutro de las tarjetas.
3. El Mac mini M4 no aparecía en la pantalla de Macs porque no tenía `previousPrice` y la sección de "Ofertas destacadas" lo excluía.

## Estado inicial

- `macbook-air-medianoche.png`, `macbook-air-plata.png`, `macbook-air-blanco-estrella.png`, `macbook-air-skyblue.png`: imágenes 1080×1080 con composición de tres vistas (vista lateral de canto, pantalla abierta y tapa).
- `imac-24-m4-{color}.png`: imágenes 1080×1080 con fondo de color (azul, verde, rosa, amarillo, naranja, morado, plata) que no coincidía con el fondo neutro (`bg-neutral`) del contenedor en `ProductImage`.
- `ShowcaseFamilyPage`: solo muestra en "Ofertas destacadas" los modelos con `previousPrice`, dejando fuera Mac mini y Mac Studio.

## Trabajo realizado

### MacBook Air — portátil abierto

Se analizó la estructura de las imágenes compuestas mediante recortes de franjas a distintas alturas con `sips`. Se identificó que el compuesto tiene este orden de arriba abajo:
- y ≈ 0–90: espacio blanco
- y ≈ 90–400: vista frontal abierta (pantalla + base de teclado)
- y ≈ 420–530: perfil de canto (muy fino)
- y ≈ 640–1080: tapa (logo Apple)

Se recortó la sección abierta con `sips -c 350 1080 --cropOffset 70 0` y se rellenó a 1080×1080 con `sips -p 1080 1080 --padColor FFFFFF`. El mismo proceso se aplicó a los cuatro colores: Medianoche, Plata, Blanco estrella y Azul cielo. Las imágenes del Air M5 reutilizan estos mismos archivos.

### iMac — fondo de imagen

Se añadió `imageBg?: string` a `ColorVariant` en `types.ts` y a la interfaz `ColorSpec` interna de `products.ts`. `buildColors` propaga el campo cuando está presente.

Se estimaron visualmente los colores de fondo de cada imagen y se asignaron a los siete colores del iMac 24" M4:

| Color | hex iMac | imageBg |
|-------|----------|---------|
| Azul | #7babcd | #bdd5e8 |
| Verde | #6aaa8a | #b4d4c4 |
| Rosa | #e0929f | #efc8cf |
| Amarillo | #f5c842 | #fae3a0 |
| Naranja | #df7944 | #efbca1 |
| Morado | #9b86bd | #cdc2de |
| Plata | #d8d9dc | #e8e8ec |

`ProductImage` acepta ahora `bgColor?: string`: cuando se proporciona, el contenedor usa `style={{ backgroundColor: bgColor }}` en lugar de `bg-neutral`, y `pad` se pasa como `false` para eliminar los 12 px de margen interior que dejaban ver el fondo neutro. `ProductCard` y la sección de Ofertas de `FamilyPage` propagan estas props desde el primer color del modelo.

### Mac mini visible — Catálogo completo

Se añadió una sección "Catálogo completo Mac" al final de `ShowcaseFamilyPage` que itera todos los modelos con `ProductCard`. De este modo Mac mini y Mac Studio aparecen con imagen, nombre, precio y acceso a compra, independientemente de si tienen oferta activa.

## Decisiones tomadas

- Se eligió recortar la vista abierta de la imagen compuesta en lugar de buscar imágenes nuevas por URL, ya que las imágenes compuestas de Apple eran las únicas disponibles con fondo blanco y perspectiva correcta para todos los colores.
- `imageBg` en lugar de detectar automáticamente el color del píxel de esquina (la extracción con Python puro devolvía negro por estructura PNG no trivial), puesto que las variantes son fijas y el valor estimado es suficiente para eliminar el recuadro visible.
- No se modificó `VariantPage` porque ya usa `tintHex(color.hex, 0.84)` como fondo animado, que produce un resultado visual aceptable también para el iMac.

## Comprobaciones

- `npm run build`: correcto, 421 módulos, sin errores de TypeScript.
- Workflow `30283909013` completado con `success`.
- URL pública desplegada en `https://oskrrr09.github.io/pagina-banana/`.

## Archivos afectados

- `public/img/products/macbook-air-medianoche.png` — recortado a vista abierta
- `public/img/products/macbook-air-plata.png` — recortado a vista abierta
- `public/img/products/macbook-air-blanco-estrella.png` — recortado a vista abierta
- `public/img/products/macbook-air-skyblue.png` — recortado a vista abierta
- `src/data/types.ts` — añade `imageBg?` a `ColorVariant`
- `src/data/products.ts` — añade `imageBg` e interfaz `ColorSpec` actualizada; valores para iMac
- `src/components/product/ProductImage.tsx` — acepta `bgColor` y lo aplica al contenedor
- `src/components/product/ProductCard.tsx` — pasa `bgColor` y `pad` desde el color del modelo
- `src/pages/FamilyPage.tsx` — `ProductImage` en Ofertas pasa `bgColor`/`pad`; nueva sección "Catálogo completo"

## Siguiente paso

Revisar visualmente los `imageBg` del iMac en producción y ajustar si algún color no encaja. Pendiente: valorar añadir imágenes por color para el MacBook Air M4/M5 desde la tienda de Banana cuando estén disponibles.
