---
tipo: sesion
fecha: 2026-07-26
tema: variant-insurance-flow
---

# Flujo de variante y seguro

## Objetivo

Hacer que la selección de color y capacidad conduzca a una ficha específica y
que el seguro funcione como opción del pedido sin añadir otra unidad.

## Estado inicial

- “Comprar” en `ModelPage` añadía inmediatamente la variante al carrito.
- La ficha profunda existía, pero no tenía un enlace desde el recorrido normal.
- “Añadir seguro a todo riesgo” ejecutaba `addToCart` con la misma línea.
- La ficha reescribía la URL sin el `basename` de GitHub Pages.
- La casilla de seguro del checkout sí sumaba correctamente 8,99 €.

## Trabajo realizado

- Las tarjetas de color navegan a la variante seleccionada.
- La URL se actualiza mediante React Router y conserva `/pagina-banana/`.
- El seguro de la ficha es ahora una casilla con control táctil amplio.
- El estado del seguro se persiste en `banana:insurance`.
- Carrito y checkout reutilizan el mismo estado e importe.
- Al vaciar el carrito también se limpia el seguro.

## Comprobaciones

- `npm run build`: correcto; 420 módulos transformados.
- iPhone 17 Pro, Naranja cósmico, 512GB: navegación correcta a
  `/pagina-banana/iphone/17-pro/512gb-naranja`.
- Cambiar a Azul intenso conserva la subruta de GitHub Pages.
- Compra con seguro: una unidad, extra de 8,99 € y total de 1.487,99 €.
- “Pago y extras”: casilla marcada, una unidad y el mismo total.
- 375 px: ancho de documento igual al viewport y control del seguro de 62 px.

## Archivos afectados

- `src/lib/store.tsx`.
- `src/pages/ModelPage.tsx`.
- `src/pages/VariantPage.tsx`.
- `src/pages/CartPage.tsx`.
- `src/pages/CheckoutPage.tsx`.
- Documentación de `docs/`.

## Siguiente paso

Revisar el diff y decidir si se publica la rama `fix/product-variant-flow`.
