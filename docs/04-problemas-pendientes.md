---
tipo: problemas
actualizado: 2026-07-26
---

# Problemas pendientes

Todos los elementos siguientes se observaron directamente en el estado auditado
del repositorio. No se corrigen en la preparación documental.

## WEB-001 — La URL de variante ignora el basename

- Estado: cerrado el 2026-07-26.
- Impacto: alto en GitHub Pages; bajo en desarrollo local.
- Evidencia: `src/pages/VariantPage.tsx` llama a
  `window.history.replaceState` con una ruta que empieza en
  `/${family.slug}/...`, mientras la aplicación se sirve desde
  `/pagina-banana/`.
- Riesgo: al cambiar color o capacidad, la barra de direcciones puede salir de
  la subruta publicada y una recarga puede terminar fuera del sitio.
- Resolución: la ficha actualiza la variante mediante `navigate(..., {
  replace: true })`, por lo que React Router aplica su `basename`.
- Validación: los cambios entre `512gb-naranja` y `512gb-azul` conservaron
  `/pagina-banana/` en la URL.

## WEB-002 — El checkout duplica la estructura global

- Estado: cerrado el 2026-07-26.
- Impacto: medio.
- Evidencia: `/checkout/:step` es hija de `Layout`, que ya renderiza `Header` y
  `Footer`; `CheckoutPage` añade además una cabecera propia descrita como
  “simplificada”.
- Resolución: `/checkout/:step` usa `CheckoutLayout`, separado de `Layout`, con
  una sola cabecera simplificada y sin footer comercial.
- Validación: los tres pasos se completaron manualmente; se comprobó una sola
  cabecera a 375, 768, 1024 y 1440 px.

## FUNC-001 — “Añadir seguro” añade otra unidad del producto

- Estado: cerrado el 2026-07-26.
- Impacto: alto dentro del flujo demostrado.
- Evidencia: en `src/pages/VariantPage.tsx`, el botón “Añadir seguro a todo
  riesgo” ejecuta `addToCart(cartLine)`.
- Resultado actual: incrementa el producto en el carrito; no representa un
  seguro separado.
- Resolución: sustituido el botón por una casilla asociada a la línea exacta del
  carrito. Añade 8,99 € por unidad asegurada y puede modificarse en la propia
  tarjeta de cesta o en “Pago y extras”.
- Validación: una compra con seguro mantuvo `1 ud.`, mostró el extra en esa
  tarjeta y en el resumen, y conservó la casilla marcada en checkout.

## FUNC-003 — “Comprar” omite la ficha de variante

- Estado: cerrado el 2026-07-26.
- Impacto: alto en el recorrido de producto.
- Evidencia: las tarjetas de `ModelPage` llamaban directamente a `addToCart`.
- Resolución: “Comprar” navega a la ruta formada por familia, modelo, capacidad
  y color seleccionados.
- Validación: iPhone 17 Pro, color Naranja cósmico y 512GB abrió
  `/pagina-banana/iphone/17-pro/512gb-naranja` sin modificar el carrito.
- Evolución posterior: los escaparates de iPhone y Mac y los enlaces del
  megamenú abren directamente la variante inicial, sin exigir esta pantalla
  intermedia.

## DATA-001 — Tiendas inconsistentes en el checkout

- Estado: cerrado el 2026-07-26.
- Impacto: medio.
- Evidencia: `CheckoutPage` ofrece `plaza-espana`, que no existe en
  `src/data/stores.ts`, y omite tiendas que sí están en ese módulo.
- Resolución: el selector genera sus opciones directamente desde
  `src/data/stores.ts`.
- Validación: muestra las cinco tiendas actuales, incluida Banana Plaza de
  España, sin opciones duplicadas manualmente en el componente.

## DOC-001 — README desactualizado

- Estado: abierto.
- Impacto: medio para incorporación de colaboradores.
- Evidencia:
  - Indica que solo iPhone está desarrollado a fondo; el código incluye Mac,
    iPad, Apple Watch y AirPods.
  - Describe marcadores sin fotos reales, mientras `src/data/products.ts` y
    `public/img/products/` usan imágenes locales de producto.
  - El árbol resumido y el número de pantallas no reflejan todas las páginas
    actuales.

## FUNC-002 — Controles deliberadamente simulados sin resultado

- Estado: abierto hasta decidir alcance.
- Impacto: esperado en un prototipo, pero debe seguir señalizado.
- Evidencia:
  - Cuenta, idioma y tienda favorita no tienen acción.
  - Newsletter impide el envío.
  - Chat, formulario, accesos rápidos de soporte, cómo llegar y reservar cita no
    están conectados.
  - Cupones no se aplican.
  - Avisos de reposición usan `alert`.
  - La confirmación de checkout genera un identificador local y vacía el
    carrito, sin crear un pedido.

## QA-001 — No hay suite de calidad automatizada

- Estado: abierto.
- Impacto: medio.
- Evidencia: `package.json` solo define `dev`, `build` y `preview`.
- Consecuencia: el build comprueba tipos y empaquetado, pero no comportamiento,
  regresiones visuales, accesibilidad ni rutas publicadas.

## SEG-001 — Avisos de seguridad en React Router

- Estado: abierto.
- Impacto: moderado según `npm audit`.
- Evidencia: el lockfile resuelve `react-router-dom@6.30.4` y
  `react-router@6.30.4`. La auditoría del 2026-07-26 reportó:
  - `GHSA-jjmj-jmhj-qwj2`: redirección abierta con posible XSS.
  - `GHSA-wrjc-x8rr-h8h6`: bypass de redirección abierta mediante barra
    invertida.
  - `GHSA-337j-9hxr-rhxg`: inyección de constructor en hidratación SSR.
- Matiz: este proyecto es una SPA sin SSR, por lo que el tercer caso no coincide
  con la arquitectura actual; los avisos de navegación sí afectan a la
  dependencia instalada.
- Corrección disponible: sí, según `npm audit`. Debe evaluarse y verificarse sin
  aplicar automáticamente `npm audit fix`.

## ENTORNO-001 — Configuración Obsidian preexistente en la raíz

- Estado: cerrado el 2026-07-26.
- Impacto: bajo.
- Evidencia: `.obsidian/` ya existía como carpeta local no versionada antes de
  esta tarea.
- Resolución: `.obsidian/` y `docs/.obsidian/` quedan ignoradas; no se versiona
  configuración local de Obsidian.
