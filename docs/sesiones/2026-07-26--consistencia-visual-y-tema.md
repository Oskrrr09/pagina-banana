---
tipo: sesion
fecha: 2026-07-26
tema: consistencia visual y tema del dispositivo
---

# Consistencia visual y tema del dispositivo

## Objetivo

Evitar saltos de tamaño en tiendas, menú y tarjetas; mejorar el menú Mac,
mantener el color de variante al cambiar capacidad, permitir ajustar unidades
desde la ficha y adaptar la web al modo oscuro del dispositivo.

## Estado inicial

- El carrusel variaba de alto según dirección, servicios y nombre de la tienda.
- El megamenú de Mac era más alto que el de iPhone y su destacado era un
  placeholder.
- Las tarjetas podían crecer por títulos y descripciones de diferente longitud.
- La ficha no daba control de cantidad tras añadir una variante.
- La paleta solo contemplaba superficies claras.

## Trabajo realizado

- Reservadas alturas para carrusel y megamenú; ordenados Air y Pro en Mac.
- Sustituido el destacado Mac por su imagen local y movida la etiqueta “Nuevo” a
  la parte superior de la tarjeta.
- Normalizada la estructura de `ProductCard`.
- Añadidos controles accesibles de incrementar, reducir o quitar una unidad en
  ficha y barra móvil.
- Añadidos tokens oscuros automáticos y ajustadas las superficies amarillas de
  marca para conservar contraste.

## Comprobaciones

- `npm run build`: correcto, 421 módulos transformados.
- Carrusel: 340 px antes y después de cambiar de tienda.
- MacBook Neo: la capacidad de 16 GB conserva Cítrico y la URL `-citrico`.
- Vista local comprobada en modo oscuro, sin degradar legibilidad de botones,
  tarjetas, cabecera o contenido amarillo.
- La PR #4 se fusionó en `main` y el workflow `30211613240` publicó la versión
  en GitHub Pages.

## Archivos afectados

- Layout y portada: `StoreCarousel.tsx`, `Header.tsx`, `MegaMenu.tsx`,
  `Home.tsx`, `index.css`.
- Catálogo y compra: `nav.ts`, `products.ts`, `ProductCard.tsx`,
  `VariantPage.tsx`, `Button.tsx`, `ChatBubble.tsx`.
- Recurso nuevo: `public/img/products/macbook-neo-clean.png`.

## Siguiente paso

Recoger validación visual adicional del usuario en la versión pública y mantener
el catálogo y sus datos de demostración actualizados solo cuando haya fuentes
confirmadas.
