---
tipo: sesion
fecha: 2026-07-26
tema: tema manual e imágenes Mac
---

# Tema manual e imágenes Mac

## Objetivo

Corregir la adaptación al modo oscuro, animar el cambio de tema, eliminar las
franjas claras de la campaña principal y reemplazar las siluetas Mac por
fotografías reales centradas.

## Estado inicial

- El tema dependía exclusivamente de `prefers-color-scheme`.
- No existía un control manual ni una preferencia persistida.
- El contenedor exterior de la campaña principal heredaba un token que se
  convertía en blanco en modo oscuro.
- El selector Mac reutilizaba siluetas y algunas imágenes no coincidían
  visualmente con el centro de sus marcos.

## Trabajo realizado

- Creado un proveedor de tema con selección manual, valor inicial del sistema,
  persistencia y actualización del DOM antes del primer render.
- Añadido un control accesible en las dos cabeceras.
- Aplicado un fundido global de 360 ms, desactivado con reducción de movimiento.
- Fijado el fondo negro de la campaña principal.
- Sustituidas las imágenes de los ocho modelos Mac por fotografías oficiales de
  Apple Newsroom y registrada su procedencia.
- Normalizado el marco y el centrado de las imágenes del selector.

## Comprobaciones

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-theme`: correcto.
- `npm run build`: correcto; 423 módulos transformados.
- No existen scripts de test ni lint configurados.
- Cambio claro → oscuro → claro verificado en navegador.
- Clase de transición presente durante el fundido y retirada al finalizar.
- Fondo exterior de la campaña verificado como negro en ambos temas.
- Ocho fotografías Mac cargadas y centradas respecto a sus marcos.

## Archivos afectados

- Tema: `src/lib/theme.tsx`, `src/components/ui/ThemeToggle.tsx`,
  `src/main.tsx`, `src/index.css`, `src/components/ui/Icon.tsx`.
- Cabeceras: `src/components/layout/Header.tsx`,
  `src/components/layout/CheckoutLayout.tsx`.
- Portada y catálogo: `src/pages/Home.tsx`, `src/pages/FamilyPage.tsx`,
  `src/data/products.ts`, `src/components/product/ProductImage.tsx`.
- Activos y fuentes: `public/img/products/*-photo.jpg`,
  `public/img/products/SOURCES.md`.
- Documentación viva: `docs/00-estado-actual.md`,
  `docs/01-contexto-del-proyecto.md`, `docs/02-decisiones.md`,
  `docs/05-registro-de-cambios.md`.

## Siguiente paso

Publicar la rama, fusionarla en `main` y verificar el resultado en GitHub Pages.
