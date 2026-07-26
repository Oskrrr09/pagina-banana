---
tipo: sesion
fecha: 2026-07-26
tema: catálogo Mac y flujo de compra
---

# Catálogo Mac y flujo de compra

## Objetivo

Acercar los escaparates de iPhone y Mac a una navegación por modelos, completar
la categoría Mac, diferenciar compra inmediata de carrito, asociar el seguro a
cada producto y reservar un acceso global al futuro chat.

## Estado inicial

- iPhone y Mac usaban el catálogo genérico; Mac contenía un único modelo.
- El seguro era una opción global del pedido.
- La ficha solo ofrecía “Comprar” y terminaba en la cesta.
- El checkout ya tenía layout propio, pero su cabecera era blanca.
- No existía acceso persistente al chat.

## Trabajo realizado

- Añadidos ocho grupos Mac con imágenes locales y contenido demostrativo.
- Creados escaparates de modelos y ofertas para iPhone y Mac; sus enlaces abren
  variantes configurables.
- Separadas las acciones “Comprar” y “Añadir al carrito”.
- Migrado el seguro al modelo de línea de carrito y añadidos controles por
  producto en cesta y checkout.
- Aplicado amarillo suave a la cabecera simplificada del checkout.
- Añadido el globo global de chat con aviso “próximamente” y enlace a soporte.

La selección de grupos se contrastó con
[Banana Computer](https://tienda.bananacomputer.com/productos/) y
[K-tuin](https://www.k-tuin.com/comprar-un-mac) el 2026-07-26. Esto no convierte
los precios, stock o condiciones del prototipo en datos oficiales.

## Comprobaciones

- `npm run build`: correcto, 421 módulos transformados.
- Recorrido iPhone → variante → carrito → entrega → “Pago y extras”: correcto.
- Recorrido Mac → variante con capacidad compuesta → checkout: correcto.
- Seguro visible y editable por línea, sin incrementar unidades.
- El globo abre y cierra, Escape devuelve el foco al disparador.
- Sin scroll horizontal a 375, 768, 1024 y 1440 px en iPhone, Mac, carrito y
  checkout.

## Archivos afectados

- Catálogo y navegación: `src/data/products.ts`, `src/data/nav.ts`,
  `src/pages/FamilyPage.tsx`, `src/pages/ModelPage.tsx`,
  `src/components/product/ProductCard.tsx`.
- Compra y seguro: `src/lib/store.tsx`, `src/pages/VariantPage.tsx`,
  `src/pages/CartPage.tsx`, `src/pages/CheckoutPage.tsx`.
- Layout y presentación: `src/App.tsx`,
  `src/components/layout/CheckoutLayout.tsx`,
  `src/components/layout/ChatBubble.tsx`, `src/index.css`.
- Recursos: ocho imágenes Mac en `public/img/products/`.
- Documentación canónica de `docs/`.

## Siguiente paso

Validar con usuarios el nuevo flujo y decidir el alcance real del chat. La PR
#3, el workflow `30210351355` y la URL pública quedaron verificados.
