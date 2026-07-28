# Banana Computer — Prototipo navegable (Fase 2)

Prototipo de demostración de la nueva web de Banana Computer. SPA construida
sobre React + Vite + TypeScript y publicada en GitHub Pages.

> ⚠️ **Demostración conceptual.** Ningún precio, condición, stock, pedido, pago
> o email es real. Los datos aparecen etiquetados como _Precio demostrativo_,
> _Pedido de demostración_, _Condición demostrativa_, _Stock de ejemplo_ o
> _Pendiente de validación con Banana Computer_.

**URL pública:** <https://luis-lop-nas.github.io/pagina-banana/>

## Stack

| Pieza | Versión efectiva |
| --- | --- |
| React / React DOM | 18.3.1 |
| React Router DOM | 6.30.4 |
| Motion (`motion/react`) | 11.x |
| Vite | 6.x |
| TypeScript | 5.x |
| Tailwind CSS (+ plugin de Vite) | 4.x |
| Playwright | 1.62 |

## Arrancar y verificar

```bash
npm ci                  # instala dependencias reproducibles
npm run dev             # http://localhost:5173/pagina-banana/
npm run build           # comprueba tipos + genera dist/
npm run test:e2e        # pruebas end-to-end con Playwright
npm run test:e2e:ui     # modo UI (Playwright test explorer)
npm run test:e2e:headed # con el navegador visible
```

Antes de ejecutar los tests por primera vez:

```bash
npx playwright install chromium
```

## Catálogo desarrollado

Cinco familias con datos, imágenes locales y variantes reales:

| Familia | Modelos | Nota |
| --- | --- | --- |
| **iPhone** | 4 (17 Pro Max, 17 Pro, Air, 17) | Fotos oficiales por color |
| **Mac** | 8 (MacBook Neo, Air M4/M5, Pro M4/M5, iMac 24" M4, Mac Studio, Mac mini M4) | Imágenes oficiales optimizadas en WebP |
| **iPad** | 4 (Pro, Air, mini, A16) | Pulgada seleccionable dentro de la ficha |
| **Apple Watch** | 3 (Ultra 3, Series 11, SE 3) | Tamaño y GPS/Cellular seleccionables (excepto Ultra) |
| **AirPods** | 2 (Pro 3, Max) | 5 colores de AirPods Max |

**Accesorios** aún no tiene catálogo propio: los cinco tiles de la home
enlazan a `/buscar?q=<término>` (fundas, magsafe, correas, teclados, audio).

## Estructura del código

```
src/
  data/
    products.ts         Catálogo central (5 familias, ~20 modelos)
    stores.ts           5 tiendas con coords + mapQuery + horarios reales
    nav.ts              familiesNav, utilityLinks, directLinks
    content.ts          Servicios, FAQ, ventajas
    commercialClaims.ts Afirmaciones comerciales con status demo|verified|pending
    types.ts
  lib/
    store.tsx           Carrito, favoritos y comparador (localStorage)
    checkoutState.tsx   Estado compartido del checkout (sessionStorage)
    demoOrderRepository.ts  Pedidos de demostración (sessionStorage)
    format.ts
  components/
    ui/                 Button, Chip, Modal, Accordion, Reveal, Icon,
                        Placeholder, Tag, StockIndicator, MobileScroller…
    layout/             Header + MegaMenu + MobileMenu, Footer, Layout,
                        CheckoutLayout, ChatBubble, Logo
    home/               HeroCarousel, BentoShowcase, StoreCarousel
    product/            ProductCard, ProductImage, FinanceSimulator, StorePicker
  pages/                Home, Family, Model, Variant, Search, Compare,
                        Cart, Checkout, Services, PlanRenove, Stores,
                        StoreDetail, Support, Favorites, NotFound
tests/e2e/              Pruebas Playwright (home, checkout, search)
docs/                   Documentación viva (00–05 + sesiones)
public/img/             WebP optimizados (~2,9 MB para todo el catálogo)
```

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Portada (carrusel + franja de confianza + categorías + ofertas + accesorios + servicios + testimonios demo + tiendas + FAQ + newsletter) |
| `/:family` | Familia (`iphone`, `mac`, `ipad`, `apple-watch`, `airpods` usan `ShowcaseFamilyPage`) |
| `/:family/:model` | Modelo (redirige a la variante base) |
| `/:family/:model/:variant` | Ficha con selectores de color, capacidad y (según modelo) tamaño |
| `/buscar?q=…` | Buscador sincronizado con la URL |
| `/comparar` | Comparador de hasta 3 productos de la misma familia |
| `/carrito` | Carrito con selección de entrega compartida con checkout |
| `/checkout/1` | Datos y entrega/recogida (obligatorio antes del 2) |
| `/checkout/2` | Pago y extras (crea el pedido demo al confirmar) |
| `/checkout/3` | Confirmación (solo accesible con pedido válido) |
| `/servicios` | Servicios de Banana (contenido demostrativo) |
| `/plan-renove` | Página con timeline oficial de 4 pasos con Foxway, sin precios ni tasador propio |
| `/soporte` | Centro de soporte (buscador, FAQ y acceso al Servicio Técnico) |
| `/servicio-tecnico` | **Servicio Técnico Autorizado**: sin cita, checklist, entrega, garantía / fuera de garantía y plazos orientativos |
| `/tiendas`, `/tiendas/:slug` | Google Maps embed con las 5 tiendas |
| `/favoritos` | Favoritos del usuario |
| `*` | 404 amable |

## Checkout blindado

- El paso 3 exige un pedido creado en `demoOrderRepository`. Abrir
  `/checkout/3` sin pedido redirige a `/carrito` o `/iphone` según haya
  productos.
- El paso 2 exige `step1Valid`. Sin nombre + email válido + dirección o
  tienda, redirige a `/checkout/1`.
- El ID `BC-XXXXXX` se genera **solo** al pulsar "Confirmar pedido".
- La confirmación sobrevive a recargas dentro de la misma sesión.
- La selección de entrega en `/carrito` se comparte con el checkout via
  `CheckoutProvider`. Cambiarla en cualquiera de los dos actualiza el estado
  compartido.

Todo esto es demostrativo: no hay backend, ni pagos, ni emails.

## Servicio Técnico Autorizado (página propia `/servicio-tecnico`)

Información operativa demostrativa facilitada para el proyecto —
sin conexión con un sistema real de gestión de reparaciones:

- **Sin cita previa.** Puedes acudir durante el horario de apertura.
  Antes de entregar el dispositivo, realiza una copia de seguridad y
  desactiva las funciones de seguridad necesarias.
- **Prepara tu dispositivo** en este orden: 1) copia de seguridad
  actualizada; 2) desactiva la Protección del dispositivo en caso de
  robo o el modo antirrobo cuando corresponda; 3) desactiva "Buscar"
  (mi iPhone / mi iPad / mi Mac). El modo antirrobo debe estar
  desactivado antes que "Buscar".
- **Lugares de entrega:** entrega directa en un establecimiento
  Banana que gestione el servicio técnico, o dejarlo en cualquier
  otra tienda Banana para que sea recogido y enviado al SAT.
- **Dispositivo en garantía:** el envío al servicio técnico es
  gratuito. La cobertura de la reparación dependerá del diagnóstico
  y de las condiciones de garantía aplicables.
- **Dispositivo fuera de garantía:** envío al servicio técnico
  **35 €**. Si aceptas la reparación, esos 35 € se descuentan del
  precio final. Si decides no reparar, el importe no será
  reembolsable.
- **Plazos orientativos:** el traslado desde una tienda al servicio
  técnico suele tardar un mínimo de **3 días**. A ese plazo hay que
  añadir el tiempo de diagnóstico y, cuando corresponda, el tiempo
  de reparación tras la aceptación del presupuesto. Los 3 días
  corresponden únicamente al traslado, no al plazo total. **No se
  promete un plazo total garantizado.**
- No implementa reserva de cita, calendario, pago online de los
  35 €, seguimiento real de reparaciones ni recogida a domicilio.

## Plan Renove — valoración estimada online, ejecución en tienda (bloque en `/plan-renove`)

- **El Plan Renove se completa en tienda física.** En web se puede
  consultar una valoración estimada orientativa, pero la valoración
  real y la aplicación de la compensación requieren pasar por una
  tienda de Banana Computer.
- **Cuatro pasos:** 1) valoración estimada online; 2) valoración en
  tienda (iPhone, iPad o Watch en el momento, una sola vez); 3)
  para Mac, envío al servicio técnico para comprobar que no ha sido
  abierto ni reparado y confirmar la valoración; 4) compensación en
  tu nueva compra realizada en tienda.
- **La valoración puede cambiar de un día para otro,** incluso
  valorada en tienda. Cualquier importe mostrado online es solo
  orientativo.
- **Traspaso de datos:** si necesitas que Banana traspase tus
  datos, acude a la tienda con un mínimo de **2 horas de
  antelación** antes del cierre.
- **Sin precios, sin ejemplos de tasación, sin tasador propio.** El
  texto no nombra al partner externo que confirma la valoración de
  los Mac.

## Contenido comercial y testimonios

- **Afirmaciones estructuradas** — Las condiciones comerciales usadas por
  bloques concretos ("Envío 24-48 h", "Financiación al 0 %",
  "hasta 400 €", "Servicio técnico oficial"…) viven en
  `src/data/commercialClaims.ts` con `status: 'demo' | 'verified' | 'pending'`,
  `source`, `verifiedAt` y `disclaimer`. Solo se marcan como `verified`
  las que se han contrastado con la fuente oficial (por ejemplo, las 5
  tiendas verificadas el 2026-07-26). Los bloques que las usan muestran un
  aviso discreto cuando el contenido es demostrativo.
- **Textos visuales en componentes** — Algunos textos comerciales de la
  portada permanecen intencionadamente dentro de sus componentes de UI
  para conservar la presentación visual del prototipo. Están claramente
  identificados como demostrativos y se mantendrán como tales hasta que
  Banana Computer los valide; no son un pendiente que haya que "arreglar"
  moviéndolos a `commercialClaims.ts`.
- **Reseñas / testimonios** — Las reseñas visibles en portada son
  contenido demostrativo creado para enseñar el diseño. Aparecen
  claramente etiquetadas como tal y se conservan intencionadamente
  hasta que existan reseñas reales autorizadas.

## Buscador

- El input de `SearchPage` se sincroniza con `?q=` via `useEffect`, así al
  buscar "iPhone" y después "Mac" desde la lupa del Header, el campo y los
  resultados quedan alineados. Adelante/atrás del navegador también lo
  mantienen sincronizado.
- Las sugerencias del overlay del Header se generan en runtime desde
  `families + modelsByFamily` (`buildSearchSuggestions`), usando
  `variantPath` para las URLs. Añadir o retirar modelos aparece o desaparece
  automáticamente sin tocar el Header.

## Chat provisional

`<ChatBubble />` es solo un aviso ("El chat estará disponible próximamente").
Se oculta durante el checkout (`/checkout/*`) para no distraer del proceso
de compra. El panel es accesible: `role="dialog"` + `aria-modal="true"`,
foco al botón cerrar al abrir, Escape cierra y devuelve foco al botón
flotante.

## Persistencia

| Clave | Storage | Contenido |
| --- | --- | --- |
| `banana:cart` | localStorage | Líneas de carrito con seguro por unidad |
| `banana:fav` | localStorage | Favoritos (IDs `family/model`) |
| `banana:compare` | localStorage | Comparador (hasta 3, misma familia) |
| `banana:checkout-state` | sessionStorage | Datos del paso 1 + entrega |
| `banana:demo-orders` | sessionStorage | Diccionario de pedidos demostrativos |
| `banana:demo-last-order-id` | sessionStorage | Último pedido creado (usado por `/checkout/3`) |

## Rendimiento

- **Imágenes**: todo el catálogo (~90 archivos) se sirve como WebP,
  ~2,9 MB total (frente a los 42 MB originales en PNG). Compresión hecha
  con `pngquant` (q 70-90) + conversión con Pillow (q 82, method 6).
- **Preload** del primer producto del hero en `index.html`.
- **`content-visibility: auto`** en cada `<Section>` para saltar el pintado
  de secciones fuera del viewport.
- **Header** sin `backdrop-blur` durante el scroll para eliminar repaints
  costosos; `bg-banana/[0.97]` da la sensación de superposición sin coste.

## Accesibilidad

- Foco visible siempre; áreas táctiles ≥44 px.
- Formularios con `label` asociada y `autocomplete` en el checkout.
- `prefers-reduced-motion` respetado en reveals y transiciones.
- Menú móvil con trampa de foco y bloqueo de scroll.
- Chat con `role="dialog"` + `aria-modal`, trampa de foco confinada al panel
  (Tab / Shift+Tab cíclicos), Escape que cierra y devuelve el foco al botón
  flotante, y `inert` sobre el resto del documento mientras está abierto.
- La interfaz utiliza actualmente un modo claro fijo. No hay selector de
  tema y `prefers-color-scheme` no cambia la apariencia — solo se respeta
  `prefers-reduced-motion`.

## CI / CD

- `.github/workflows/deploy.yml` — build + publicación a GitHub Pages en
  cada push a `main`.
- `.github/workflows/e2e.yml` — `npm ci` + `npm run build` +
  `npx playwright install --with-deps chromium` + `npm run test:e2e`
  en cada push/PR sobre `main`. **Solo se instala Chromium**, así que
  el proyecto `mobile` está deliberadamente configurado con `Pixel 5`
  (Chromium) en `playwright.config.ts` para no requerir WebKit. Sube
  el reporte HTML como artefacto si algo falla.

## Pruebas Playwright

`playwright.config.ts` levanta Vite automáticamente en el puerto 5173 con
`baseURL: http://127.0.0.1:5173/pagina-banana/`. Proyectos:

- `chromium` — todas las pruebas.
- `mobile` (Pixel 5) — solo las marcadas con `@mobile` o `@all`.

Suites actuales (49 pruebas, medido con `npm run test:e2e` — 48 en
`chromium` + 1 en `mobile` etiquetada `@mobile`):

- `tests/e2e/home.spec.ts` — carga de portada, tiles de accesorios que
  llevan a `/buscar` y ausencia de scroll horizontal a 375 px.
- `tests/e2e/checkout.spec.ts` — guardas de `/checkout/2` y `/checkout/3`,
  flujo demostrativo completo (`BC-\d{6}`) con recarga y chat oculto en
  checkout.
- `tests/e2e/checkout-flow.spec.ts` — entrega compartida entre `/carrito`
  y `/checkout/1` en ambos sentidos, y seguro activable/desactivable que
  no cambia la cantidad y aparece separado en el resumen.
- `tests/e2e/chat.spec.ts` — apertura del chat con teclado, trampa de
  foco Tab/Shift+Tab cíclica, Escape con retorno de foco al disparador
  y ausencia total del chat dentro de `/checkout/*`.
- `tests/e2e/product.spec.ts` — cambio de color y capacidad conservando
  `/pagina-banana/`, recarga de ruta profunda, Apple Watch Series 11
  con tamaño y GPS/Cellular preservados al alternar, y navegación entre
  pasos del checkout sin errores de hooks en consola.
- `tests/e2e/favorites-compare.spec.ts` — flujo real de usuario: añadir
  y quitar favoritos desde el `ProductCard` de `/iphone` y `/favoritos`,
  y añadir dos productos al comparador desde `/iphone/17-pro` usando los
  checkboxes "Añadir a comparar", verlos en `/comparar` y vaciarlo con
  los botones "Quitar". **No se preselecciona nada en `localStorage`.**
- `tests/e2e/search.spec.ts` — sincronización del input con `?q=` y
  destinos reales de los tiles de accesorios.
- `tests/e2e/audit-ux.spec.ts` — regresión de las mejoras post-auditoría:
  H1 semántico único en portada, banner "Sin cita previa" en `/soporte`,
  checklist de preparación (copia, Buscar, modo antirrobo), entrega en
  cualquier tienda Banana, garantía / fuera de garantía con **35 €** y su
  descuento/no-reembolso, plazos orientativos con mínimo de 3 días,
  ausencia de reserva de cita/calendario/contraseña, y timeline oficial
  del Plan Renove con Foxway sin precios ni tasador.
- `tests/e2e/accessibility.spec.ts` — comprobaciones con
  [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright)
  (etiquetas `wcag2a`, `wcag2aa`, `wcag21a`) sobre siete rutas: `/`,
  `/iphone`, `/iphone/17-pro/256gb-plata`, `/tiendas`, `/soporte`,
  `/plan-renove` y `/checkout/1` (con carrito sembrado). Se documentan
  dos excepciones justificadas: `color-contrast` (paleta de marca a
  revisar en el rediseño) y `region` (bloques decorativos del hero).

## Documentación

Fuente de verdad viva en `docs/`:

- `00-estado-actual.md` — capacidades y últimos cambios.
- `01-contexto-del-proyecto.md` — propósito y mapa técnico.
- `02-decisiones.md` — decisiones aceptadas con fecha y evidencia.
- `03-roadmap.md` — trabajo previsible (no compromiso).
- `04-problemas-pendientes.md` — bugs, deuda y validaciones.
- `05-registro-de-cambios.md` — bitácora de entregas.
- `sesiones/AAAA-MM-DD--tema.md` — notas de sesión.

El código ejecutable es siempre la fuente de verdad cuando choque con la
documentación.

## Pendiente de validar con Banana Computer

Manual de marca definitivo, precios reales, condiciones reales de
financiación / envío / seguro / garantía / descuento educativo,
funcionamiento del Plan Renove, reseñas reales, autorización de uso de
recursos de marca e imágenes, y horarios/servicios de tienda en la fecha
de validación final.

Hasta esa validación, todo el contenido con etiqueta demostrativa debe
conservarse como tal.
