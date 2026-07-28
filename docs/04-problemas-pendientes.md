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

- Estado: cerrado el 2026-07-28.
- Evolución: el README se reescribió por completo en `f1e3db7` y se
  ajustó de nuevo en la rama `fix/checkout-hooks-docs-e2e` para reflejar
  con precisión que las imágenes de Mac se sirven optimizadas en WebP
  (no PNG), que la interfaz utiliza un modo claro fijo (no cambia con
  `prefers-color-scheme`) y que las reseñas y textos comerciales
  visibles son contenido demostrativo intencionado.
- Fuente: `README.md` en la rama actual, secciones "Stack",
  "Accesibilidad", "Contenido comercial y testimonios" y "Persistencia".

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

## QA-001 — Suite E2E con Playwright

- Estado: ampliado y consolidado el 2026-07-28.
- Evidencia: 21 pruebas en `tests/e2e/` (20 en `chromium` + 1 en
  `mobile` etiquetada `@mobile`), distribuidas en `home.spec.ts`,
  `checkout.spec.ts`, `checkout-flow.spec.ts`, `chat.spec.ts`,
  `product.spec.ts`, `favorites-compare.spec.ts` y `search.spec.ts`.
- Cobertura:
  - Portada y no-scroll horizontal a 375 px.
  - Redirecciones y guardas de `/checkout/2` y `/checkout/3` sin pedido.
  - Flujo demostrativo completo con recarga (`BC-\d{6}`).
  - Entrega compartida entre `/carrito` y `/checkout/1` en ambos
    sentidos.
  - Seguro que no duplica cantidad y aparece separado en el resumen.
  - Cambio de color y capacidad conservando `/pagina-banana/`; Apple
    Watch Series 11 con tamaño y GPS/Cellular preservados al alternar.
  - Recarga de ruta profunda; navegación entre pasos sin errores de
    hooks en consola.
  - Ausencia del chat en `/checkout/*`; trampa de foco del chat con
    teclado (Enter/Tab/Shift+Tab/Escape).
  - **Favoritos y comparador probados mediante interacción real**:
    `favorites-compare.spec.ts` navega a `/iphone`, pulsa el corazón
    del `ProductCard` de "iPhone 17 Pro", confirma que aparece en
    `/favoritos` y lo quita hasta ver el estado vacío. El comparador
    entra a `/iphone/17-pro`, marca dos checkboxes "Añadir a
    comparar", verifica que aparecen en `/comparar` y los elimina uno
    a uno con los botones "Quitar". **No se usa
    `localStorage.setItem('banana:fav', …)` ni
    `localStorage.setItem('banana:compare', …)`** para preparar el
    resultado final ni existe eliminación condicional que permita
    pasar sin botón.
  - Sincronización del buscador con la URL y destinos reales de los
    tiles de accesorios.
- CI: `.github/workflows/e2e.yml` ejecuta `npm ci`, `npm run build`,
  `npx playwright install --with-deps chromium` y `npm run test:e2e`
  en cada push/PR sobre `main`, con el proyecto móvil corriendo sobre
  Chromium (`Pixel 5`) para no requerir WebKit.
- Pendiente: comprobaciones de accesibilidad automáticas (axe) y
  cobertura del detalle de tienda.

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

## HOOKS-001 — CheckoutPage llamaba hooks tras retornos condicionales

- Estado: cerrado el 2026-07-28.
- Evidencia previa: `src/pages/CheckoutPage.tsx` colocaba un `useEffect`
  y un `useMemo` **después** de los `return <Navigate />` de guarda de
  pasos. Al cambiar de paso en el mismo montaje del componente esto podía
  disparar el warning "Rendered more hooks than during the previous
  render" y romper el árbol de React.
- Resolución: reorganizado el componente para invocar todos los hooks
  (`useState`, `useMemo`, `useEffect`) siempre en el mismo orden antes de
  cualquier retorno; las tres guardas quedan agrupadas debajo. La lógica
  de limpieza del carrito al llegar al paso 3 pasa a depender de la
  existencia del pedido confirmado, no del propio return.
- Validación: `tests/e2e/product.spec.ts` incluye la prueba
  "navegar entre pasos del checkout no genera errores de hooks en
  consola", que captura los mensajes de la consola y falla si aparece
  un warning de Rules of Hooks.

## A11Y-001 — Chat sin trampa de foco completa

- Estado: cerrado el 2026-07-28.
- Evidencia previa: el panel del chat ya tenía `role="dialog"`,
  `aria-modal`, foco al abrir y Escape, pero Tab y Shift+Tab podían
  sacar el foco del panel y llegar a los enlaces de la página de fondo.
- Resolución: `ChatBubble` añade un manejador de teclado que confina el
  foco entre "Cerrar información del chat" e "Ir a soporte" (cíclico en
  ambas direcciones), Escape cierra y devuelve el foco al botón
  flotante, y mientras el panel está abierto el resto del documento se
  marca como `inert` para que no reciba foco ni interacción de puntero.
  El aria-label del botón flotante pasa de "Cerrar información del
  chat" (colisión con el botón interno) a "Ocultar chat" mientras el
  panel está abierto.
- Validación: `tests/e2e/chat.spec.ts` — abre el chat con Enter, valida
  que el foco entra en el panel, recorre Tab/Shift+Tab de forma cíclica,
  cierra con Escape y confirma el retorno del foco al botón flotante.

## ENTORNO-001 — Configuración Obsidian preexistente en la raíz

- Estado: cerrado el 2026-07-26.
- Impacto: bajo.
- Evidencia: `.obsidian/` ya existía como carpeta local no versionada antes de
  esta tarea.
- Resolución: `.obsidian/` y `docs/.obsidian/` quedan ignoradas; no se versiona
  configuración local de Obsidian.
