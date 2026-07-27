---
tipo: sesion
fecha: 2026-07-27
tema: imágenes Mac por color y corrección de escala visual
---

# Imágenes Mac por color y corrección de escala visual

## Objetivo

Reemplazar las imágenes JPG genéricas del catálogo Mac por PNGs reales de Banana Computer, añadir imágenes por color donde fuese posible, y corregir la inconsistencia de tamaño visual causada por imágenes 2250×2250 con exceso de espacio en blanco.

## Estado inicial

- Todos los colores de un mismo modelo Mac compartían la misma imagen (JPG placeholder).
- MacBook Neo solo tenía 2 colores (Cítrico, Plata) y una imagen de relleno.
- Tres modelos (Pro M4, iMac, Mac mini) usaban imágenes 2250×2250 que hacían que el producto pareciese más pequeño que los demás (que usaban 1080×1080).

## Trabajo realizado

### Imágenes por color — MacBook Neo (4 colores reales)

Imágenes descargadas de `media.bananacomputer.com/MacBook/Neo/`:
- `macbook-neo-plata.png` (1080×1080)
- `macbook-neo-citrico.png` (1080×1080)
- `macbook-neo-rosa-nube.png` (1080×1080)
- `macbook-neo-indigo.png` (1080×1080)

### Imágenes por color — MacBook Pro M4

Ya existían en el proyecto desde una sesión anterior:
- `mac-mbp14-negro.png` (1080×1080) → Negro espacial
- `mac-mbp14-plata.png` (1080×1080) → Plata

### Imágenes por color — MacBook Pro M5

Descargadas de `media.bananacomputer.com`:
- `macbook-pro-m5-negro-16.png` (1080×1080) → Negro espacial
- `macbook-pro-m5-plata-14.png` (1080×1080) → Plata 14"

### MacBook Air M4 — color Azul cielo añadido

Descargado de `tienda.bananacomputer.com/cms/uploads/MacBook_Air_M4_15_Azul_Cielo_41.png`:
- `macbook-air-m4-azul-cielo.png` (1080×1080)
- Añadido como 4.º color del Air M4 en `products.ts`.

### MacBook Air M5 — color Blanco estrella añadido

Sin imagen diferenciada disponible en Banana. Se añade el color con la misma imagen genérica del modelo.

### Corrección de escala visual (iMac, Mac mini)

Las imágenes 2250×2250 se redimensionaron a 1080×1080 con `sips -Z 1080` para igualar la escala visual con el resto del catálogo.

### Actualización de products.ts

- MacBook Neo: 4 colores (Plata, Cítrico, Rosa nube, Índigo) con imágenes individuales. Precio corregido a 749 €.
- MacBook Air M4: añadido Azul cielo (4 colores totales).
- MacBook Air M5: añadido Blanco estrella (4 colores totales).
- MacBook Pro M4: imágenes por color en lugar de imagen única.
- MacBook Pro M5: imágenes por color en lugar de imagen única.

## Limitaciones encontradas

- No existen imágenes por color para Air M4/M5 (exceptuando Azul cielo para el 15") ni para el iMac en los servidores de Banana. Solo se encontró la imagen genérica para todos los colores.
- El servidor `media.bananacomputer.com` solo aloja imágenes para Neo, Pro M5 14", Pro M5 16" y algunos modelos seleccionados.

## Comprobaciones

- `npm run build`: correcto; 421 módulos, build en 553 ms.
- Captura mobile del catálogo Mac: escala visual uniforme en todos los modelos.
- Captura mobile del MacBook Neo: 4 colores con imágenes diferenciadas, correctas.
- Workflow `30277394128` completado con `success` en 43 s.

## Archivos afectados

- `public/img/products/macbook-neo-{plata,citrico,rosa-nube,indigo}.png` (nuevos)
- `public/img/products/macbook-air-m4-azul-cielo.png` (nuevo)
- `public/img/products/macbook-pro-m5-{negro-16,plata-14,plata-16}.png` (nuevos)
- `public/img/products/imac-24-m4-photo.png` (redimensionado 2250→1080)
- `public/img/products/mac-mini-m4-photo.png` (redimensionado 2250→1080)
- `src/data/products.ts` (colores y referencias de imagen)

## Siguiente paso

Verificar en producción que los 4 colores del Neo se muestran correctamente y que las páginas de variante de color cargan la imagen correspondiente al seleccionar color.
