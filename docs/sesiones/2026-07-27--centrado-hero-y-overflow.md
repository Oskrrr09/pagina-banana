---
tipo: sesion
fecha: 2026-07-27
tema: centrado imagen hero y corrección de desplazamiento horizontal
---

# Centrado hero y overflow horizontal

## Objetivo

Centrar el iPhone en las imágenes hero (tenían negro a la izquierda) y eliminar el desplazamiento lateral de la página causado por el carrusel bento.

## Estado inicial

- `hero-17pro-mobile.png` (465×540 tras recorte inferior anterior) mostraba el iPhone desplazado a la derecha con un borde negro prominente a la izquierda.
- `hero-17pro-desktop.png` (1200×555) mismo problema.
- La página entera se desplazaba ligeramente a la derecha: el truco `-mx-5 px-5` del carrusel BentoShowcase extendía el contenido más allá del ancho visible, generando un scroll horizontal fantasma.

## Trabajo realizado

### Centrado de imágenes hero

- `hero-17pro-mobile.png`: recortado de 525×540 a 465×540 eliminando ~60 px de negro por la izquierda.
  - Comando: `sips -c 540 465 --cropOffset 30 0 public/img/hero-17pro-mobile.png`
- `hero-17pro-desktop.png`: recortado de 1400×555 a 1200×555 eliminando ~200 px de negro por la izquierda.
  - Comando: `sips -c 555 1200 --cropOffset 100 0 public/img/hero-17pro-desktop.png`

### Corrección del desplazamiento de página

- Añadido `overflow-x: hidden` a los selectores `html` y `body` en `src/index.css`.
- Esto oculta el overflow horizontal causado por el carrusel sin romper el scroll lateral interno del propio carrusel.

## Comprobaciones

- `npm run build`: correcto; 421 módulos, build en 563 ms.
- Push directo a `main`; commit `b1dcb2e`.

## Archivos afectados

- `public/img/hero-17pro-mobile.png`
- `public/img/hero-17pro-desktop.png`
- `src/index.css`

## Siguiente paso

Verificar en dispositivo real: iPhone centrado en el hero, sin banda negra prominente, y la página sin desplazamiento lateral. Confirmar también que las flechas del carrusel bento son visibles ahora que se eliminó el overflow.
