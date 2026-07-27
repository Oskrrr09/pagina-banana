---
tipo: sesion
fecha: 2026-07-27
tema: mejoras de UX en móvil
---

# Mejoras de UX en móvil

## Objetivo

Corregir cinco problemas de usabilidad detectados por el usuario en la versión móvil de la web.

## Estado inicial

- La sección "Todo lo Apple cerca de ti" (BentoShowcase) apilaba las tarjetas verticalmente en móvil, obligando a hacer scroll largo antes de llegar a las categorías.
- La burbuja del chat flotaba a `bottom-24` (96 px del fondo), sin quedar en la esquina real.
- El `<h1>` de la ficha de variante incluía `color.name`, por lo que al cambiar de color el título cambiaba de altura y desplazaba el contenido inferior.
- El buscador sólo era accesible desde el menú de las tres rayas en móvil.
- El botón de lupa del escritorio estaba oculto en móvil (`hidden xl:grid`).

## Trabajo realizado

- **BentoShowcase**: el contenedor pasa de `grid grid-cols-1` a `flex snap-x snap-mandatory overflow-x-auto no-scrollbar` con `-mx-5 px-5` para extenderse a pantalla completa. Cada tarjeta recibe `w-[calc(100vw-2.5rem)] shrink-0 snap-center`, mostrando una sola a la vez centrada. En `sm+` se restaura el bento grid original.
- **ChatBubble**: `bottom-24` → `bottom-6` en móvil.
- **VariantPage**: eliminado `{color.name}` del `<h1>`; el color sigue visible en el selector de chips, que ya incluye la etiqueta "Color: {color.name}".
- **Header**: añadido botón de lupa (`xl:hidden`) en la barra de iconos móvil. Al pulsarlo, la barra amarilla se oculta (`hidden xl:flex`) y aparece un overlay `bg-surface` con `←` para cerrar, input autoFocus "¿Qué estás buscando?" y lupa para enviar. El desplegable previo queda restringido a `xl+`.
- **MobileMenu**: eliminados el formulario de búsqueda, el estado `q`, la función `submitSearch` y la importación de `useNavigate`.

## Comprobaciones

- `npm run build`: correcto; 421 módulos transformados.
- PR #8 fusionada en `main`; workflow `30266223973` completado con `success`.
- URL pública actualizada: https://luis-lop-nas.github.io/pagina-banana/

## Archivos afectados

- `src/components/home/BentoShowcase.tsx`
- `src/components/layout/ChatBubble.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileMenu.tsx`
- `src/pages/VariantPage.tsx`

## Siguiente paso

Verificar visualmente en móvil real: carrusel de bento, lupa en nav, posición del chat y estabilidad del h1 al cambiar de color.
