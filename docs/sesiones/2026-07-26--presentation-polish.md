---
tipo: sesion
fecha: 2026-07-26
tema: presentation-polish
---

# Correcciones previas a presentación

## Objetivo

Corregir contenido ficticio y problemas de presentación, checkout y
accesibilidad sin alterar el diseño general ni añadir flujos de producto.

## Estado inicial

- Portada con reseña, autor y cinco estrellas inventados.
- Checkout dentro del layout comercial y con una segunda cabecera propia.
- Tiendas con nombres, direcciones, horarios y estados `openNow` demostrativos.
- Menú móvil sin trampa de foco, Escape ni retorno de foco.
- Footer basado en `<details open>`, desplegado también en móvil.
- Newsletter funcionalmente correcta, pero con presentación móvil frágil.

## Trabajo realizado

- Sustituido el testimonio por el texto neutro solicitado.
- Creado `CheckoutLayout` y movida la ruta fuera del layout comercial.
- Contrastadas las cinco tiendas con sus fichas oficiales de Banana Computer;
  se guardan fecha y URL de origen y no se muestra un estado en tiempo real.
- Alineado el selector de recogida del checkout con `src/data/stores.ts`.
- Implementado diálogo modal accesible para el menú móvil.
- Implementados acordeones de footer cerrados inicialmente en móvil.
- Reforzado el formulario móvil de newsletter.
- Ajustado el breakpoint de navegación para evitar overflow a 1024 px.

## Decisiones

- No mostrar “Abierto ahora”: los horarios regulares no permiten garantizar el
  estado real ante festivos o incidencias.
- Mantener visibles las fuentes y el aviso de confirmación de horarios.
- Conservar los acordeones solo en móvil; desde 768 px el footer sigue en
  columnas abiertas.

## Comprobaciones

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-polish`: correcto.
- `npm run build`: correcto; 420 módulos transformados.
- No hay scripts de test ni lint disponibles.
- 375 px: sin scroll horizontal; newsletter 48 px/16 px; footer cerrado; menú
  con foco inicial, trampa bidireccional, Escape, retorno de foco y scroll
  restaurado.
- 768, 1024 y 1440 px: sin scroll horizontal.
- Portada sin reseñas, nombres, estrellas ni cifras de valoración inventadas.
- Tiendas: cinco fichas, horario del día en zona `Atlantic/Canary`, fuentes
  oficiales y ausencia de “Abierto ahora”.
- Carrito: producto añadido y resumen correcto.
- Checkout: tres pasos completados; una sola cabecera y ningún footer comercial.

## Archivos afectados

- Rutas y checkout: `src/App.tsx`,
  `src/components/layout/CheckoutLayout.tsx`, `src/pages/CheckoutPage.tsx`.
- Portada: `src/pages/Home.tsx`, `src/data/content.ts`.
- Tiendas: `src/data/stores.ts`, `src/data/types.ts`,
  `src/components/home/StoreCarousel.tsx`, `src/pages/StoresPage.tsx`,
  `src/pages/StoreDetailPage.tsx`.
- Navegación y footer: `src/components/layout/Header.tsx`,
  `src/components/layout/MobileMenu.tsx`, `src/components/layout/Footer.tsx`.
- Documentación: `docs/`.

## Pendientes y siguiente paso

Revisar la pull request y validar visualmente la propuesta con el equipo de
Banana Computer antes de fusionarla.
