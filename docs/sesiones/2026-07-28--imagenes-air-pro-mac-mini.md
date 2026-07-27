---
tipo: sesion
fecha: 2026-07-28
tema: Imágenes Air/Pro corregidas y Mac mini visible en nav
---

# Imágenes Air/Pro, centrado Pro y Mac mini en nav

## Objetivo

El usuario identificó cuatro problemas en la pantalla "Comprar un Mac":
1. MacBook Air M4/M5: imágenes muestran el portátil "cortado a la mitad" (vista de perfil cerrado).
2. Mac mini: no aparece en el selector de modelos.
3. iMac: ocupa todo el cuadro de miniatura sin fondo de color.
4. MacBook Pro: imagen descentrada, portátil demasiado abajo.

## Estado inicial

- `macbook-air-medianoche/plata/blanco-estrella/skyblue.png`: recortes erróneos de la sesión anterior (y=0–350 del compuesto) que capturaban el perfil lateral en lugar de la vista frontal abierta.
- `macbook-air-skyblue.png`: mismo problema.
- Nav strip (`FamilyPage.tsx`): `overflow-x-auto` + `no-scrollbar`; Mac mini (8.º modelo) quedaba fuera de pantalla sin indicador de scroll.
- Nav strip `<img>`: sin soporte para `imageBg`, el iMac mostraba su fondo de color llenando todo el cuadro.
- Imágenes Pro M4/M5: portátil en el 28–89 % vertical del encuadre (demasiado abajo).

## Trabajo realizado

### MacBook Air — vista frontal abierta

Se analizó la estructura real del compuesto 504×876 de Apple mediante recortes de sección en tramos de 130 px. Resultado:
- y=0–~60 px: perfil lateral (vista cerrada)
- y=~60–~400 px: vista frontal abierta (pantalla + teclado)
- y=~400–876 px: vista superior de la tapa cerrada

Parámetros finales: `sips -c 340 504 --cropOffset 60 0` (altura=340, sin el perfil), luego `sips -Z 1080` (escala a 1080 px de ancho → ~728 px de alto) y `sips -p 1080 1080 --padColor FFFFFF` (margen blanco ~176 px arriba y abajo).

Aplicado a: `macbook-air-medianoche.png`, `macbook-air-plata.png`, `macbook-air-blanco-estrella.png`.

Para Azul cielo: se copió directamente `macbook-air-m4-photo.png` (imagen oficial 1080×1080 de Apple Newsroom, ya en el repositorio).

### MacBook Pro — centrado vertical

Recorte `sips -c 750 1080 --cropOffset 265 0` (elimina ~265 px de espacio blanco superior) seguido de `sips -p 1080 1080 --padColor FFFFFF`. El portátil pasa de ocupar el 28–89 % al ~20–80 % del encuadre, con márgenes aproximadamente iguales arriba (~210 px) y abajo (~215 px).

Archivos: `mac-mbp14-negro.png`, `mac-mbp14-plata.png`, `macbook-pro-m5-negro-16.png`, `macbook-pro-m5-plata-14.png`, `macbook-pro-m5-plata-16.png`.

### Nav strip — Mac mini visible

Cambiado `<ul className="mx-auto flex w-max min-w-full justify-start gap-3 md:justify-center">` a `<ul className="flex flex-wrap justify-center gap-3">`. Con esta cuadrícula flexible, los 8 modelos Mac y el botón de comparar siempre son visibles sin scroll. En escritorio aparecen 7 en la primera fila y Mac mini + comparar en la segunda.

### Nav strip — iMac con fondo de color

Añadido `style={model.colors[0].imageBg ? { backgroundColor: model.colors[0].imageBg } : {}}` al `<span>` del thumbnail en el nav. El iMac 24" M4 muestra ahora el fondo azul que coincide con la foto, igual que en las tarjetas de producto.

## Decisiones tomadas

- Se usaron los compuestos 504×876 (large_2x de apple.com/macbook-air) porque las imágenes originales 1080×1080 ya habían sido reemplazadas en la sesión anterior. La escala 2,14× es aceptable a tamaños de miniatura.
- Para Azul cielo se aprovechó `macbook-air-m4-photo.png` (1080×1080 nativa), que tiene mayor calidad.
- Se descartó buscar imágenes por color en Apple Newsroom o CDN de la Apple Store (solo se encontró una imagen de Sky Blue; las demás no están disponibles públicamente con URL directa).

## Comprobaciones

- `npm run build`: correcto, 421 módulos.
- Workflows `30312650928` y `30313030912` completados con `success`.
- Verificado visualmente en producción: nav strip con 7+2 filas, Air M4 Midnight con vista frontal correcta, iMac con fondo azul, Pro M4/M5 centrado.

## Archivos afectados

- `public/img/products/macbook-air-medianoche.png`
- `public/img/products/macbook-air-plata.png`
- `public/img/products/macbook-air-blanco-estrella.png`
- `public/img/products/macbook-air-skyblue.png`
- `public/img/products/mac-mbp14-negro.png`
- `public/img/products/mac-mbp14-plata.png`
- `public/img/products/macbook-pro-m5-negro-16.png`
- `public/img/products/macbook-pro-m5-plata-14.png`
- `public/img/products/macbook-pro-m5-plata-16.png`
- `src/pages/FamilyPage.tsx`

## Siguiente paso

Valorar mejora de calidad de las imágenes Air (actualmente 2,14× escaladas desde 504 px) si se encuentran fuentes de mayor resolución por color. La experiencia de compra y la consistencia visual están resueltas.
