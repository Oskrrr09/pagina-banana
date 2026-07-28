---
tipo: problemas
actualizado: 2026-07-28
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

- Estado: parcialmente actualizado el 2026-07-28.
- Evidencia: el README sigue afirmando que solo iPhone está desarrollado a
  fondo. El código incluye Mac (8 modelos), iPad (4), Apple Watch (3) y
  AirPods (2), todos con fotos reales en `public/img/products/*.webp`.
- Pendiente: reescribir README para reflejar el catálogo actual, el nuevo
  demoOrderRepository, `commercialClaims.ts` y la suite Playwright.

## FLUJO-001 — Checkout permitía saltar pasos

- Estado: cerrado el 2026-07-28.
- Evidencia: `/checkout/3` se abría con solo cambiar la URL, generando un
  número de pedido "BC-XXXXXX" en `useState(() => ...)`. `/checkout/2` no
  validaba que el paso 1 estuviera completo.
- Resolución: introducidos `src/lib/checkoutState.tsx` (contexto con
  sessionStorage) y `src/lib/demoOrderRepository.ts` (crea el pedido sólo al
  pulsar "Confirmar pedido"). `CheckoutPage` redirige a `/checkout/1` si el
  paso 1 no es válido y a `/carrito` (o `/iphone` si está vacío) cuando se
  abre `/checkout/3` sin pedido en la sesión. La selección de entrega se
  comparte entre `CartPage` y `CheckoutPage`.

## LINKS-001 — Accesorios envían siempre al catálogo de iPhone

- Estado: cerrado el 2026-07-28.
- Evidencia previa: los cinco tiles de "Complementa tu equipo" usaban
  `to="/iphone"`.
- Resolución: cada tile enlaza a `/buscar?q=<término>` (fundas, magsafe,
  correas, teclados, audio). El buscador ya muestra un estado vacío útil si
  no hay coincidencias en el catálogo.

## CLAIMS-001 — Afirmaciones comerciales dispersas

- Estado: cerrado el 2026-07-28.
- Evidencia: textos como "Envío 24-48 h", "Financiación al 0 %" o "hasta
  400 €" aparecían literales en varios componentes sin marca de estado.
- Resolución: nuevo módulo `src/data/commercialClaims.ts` con
  `status: 'demo' | 'verified' | 'pending'`, `source`, `verifiedAt` y
  `disclaimer`. La franja de confianza y otros bloques leen desde ahí; el
  home muestra un aviso discreto de que las condiciones son demostrativas.

## CHAT-001 — Chat flotante visible en el checkout

- Estado: cerrado el 2026-07-28.
- Evidencia: `<ChatBubble />` se renderizaba dentro de `/checkout/*`.
- Resolución: `ChatBubble` detecta la ruta con `useLocation` y devuelve
  `null` cuando el pathname empieza por `/checkout`. Además se añadieron
  `aria-modal`, `aria-haspopup`, foco al botón de cerrar al abrir y retorno
  de foco al botón flotante al cerrar (además del Escape ya existente).

## FUNC-002 — Controles deliberadamente simulados sin resultado

- Estado: abierto hasta decidir alcance.
- Impacto: esperado en un prototipo, pero debe seguir señalizado.
- Evidencia:
  - Cuenta, idioma y tienda favorita no tienen acción.
  - Newsletter impide el envío.
  - Chat provisional (aviso "próximamente"), formulario, accesos rápidos de
    soporte y "Cómo llegar" siguen sin conectarse a un backend real.
  - Cupones no se aplican.
  - Avisos de reposición usan `alert`.
- Evolución 2026-07-28: la confirmación de checkout ya genera un pedido en
  `demoOrderRepository` con ID/fecha/productos, sobrevive a recargas dentro
  de la sesión y no se crea al abrir la URL. Sigue sin ser un pedido real:
  aparece marcado como "Pedido de demostración" y no dispara emails ni pagos.

## QA-001 — Suite E2E mínima con Playwright

- Estado: parcialmente resuelto el 2026-07-28.
- Evidencia: nuevos scripts `test:e2e`, `test:e2e:ui`, `test:e2e:headed` en
  `package.json`. Config en `playwright.config.ts`. Nueve pruebas en
  `tests/e2e/` cubriendo: portada, no-scroll a 375 px, redirecciones de
  `/checkout/2` y `/checkout/3` sin pedido, flujo demostrativo completo con
  recarga, ausencia del chat en checkout, sincronización del buscador con la
  URL y destinos de los accesorios.
- CI: nuevo workflow `.github/workflows/e2e.yml` ejecuta `npm ci`, `npm run
  build`, instala navegadores y corre las pruebas en cada push/PR sobre
  `main`. Sube el reporte HTML como artefacto cuando fallan.
- Pendiente: ampliar a más rutas (favoritos, comparador), cambios de color
  y capacidad en la ficha, y comprobaciones de accesibilidad automáticas.

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

## CI-001 — Actions fuerza Node 24 por obsolescencia de Node 20

- Estado: abierto.
- Impacto: bajo hoy; mantenimiento preventivo.
- Evidencia: el workflow de Pages `30210351355` terminó correctamente, pero
  avisó de que Node.js 20 está obsoleto y que fuerza Node.js 24 para
  `actions/checkout@v4`, `actions/setup-node@v4` y
  `actions/upload-artifact@v4`.
- Consecuencia actual: ninguna en el despliegue verificado.
- Siguiente validación: actualizar de forma explícita la versión de Node del
  workflow y volver a comprobar `npm ci`, build y Pages.

## ENTORNO-001 — Configuración Obsidian preexistente en la raíz

- Estado: cerrado el 2026-07-26.
- Impacto: bajo.
- Evidencia: `.obsidian/` ya existía como carpeta local no versionada antes de
  esta tarea.
- Resolución: `.obsidian/` y `docs/.obsidian/` quedan ignoradas; no se versiona
  configuración local de Obsidian.
