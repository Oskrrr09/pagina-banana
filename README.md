# Banana Computer — Prototipo navegable

Prototipo de demostración de una tienda Apple para Banana Computer. Una sola
SPA de React + Vite + TypeScript que se sirve como **tres superficies**:

- **Web** pública, publicada en GitHub Pages;
- **tienda nativa** para iOS y Android, empaquetada con Capacitor;
- **panel de agentes** en `/agente`, instalable como PWA.

> ⚠️ **Demostración conceptual.** Ningún precio, condición, stock, pedido, pago
> o email es real. No hay pasarela de pago, ni inventario, ni pedidos
> comerciales, ni integración definitiva con Banana Computer. Los datos
> aparecen etiquetados como _Precio demostrativo_, _Pedido de demostración_,
> _Condición demostrativa_, _Stock de ejemplo_ o _Pendiente de validación con
> Banana Computer_.

**URL pública:** <https://oskrrr09.github.io/pagina-banana/>

## Stack

| Pieza | Versión efectiva |
| --- | --- |
| Node.js | 24 (`.nvmrc` y GitHub Actions) |
| React / React DOM | 18.3.1 |
| React Router DOM | 7.18.2 |
| Motion (`motion/react`) | 11.x |
| Vite | 6.4.x |
| TypeScript | 5.9.x |
| Tailwind CSS (+ plugin de Vite) | 4.3.x |
| Capacitor (`core`, `ios`, `android`, `splash-screen`) | 8.4.x |
| Playwright | 1.62 |
| Vitest | 4.x |
| Supabase | proyecto de demostración + local para pruebas |

## Arrancar y verificar

Este repositorio utiliza **Node.js 24** en GitHub Actions. Con
[nvm](https://github.com/nvm-sh/nvm) puedes activar la misma versión
ejecutando `nvm use` (el archivo `.nvmrc` en la raíz fija la versión).

```bash
nvm use                 # opcional, si usas nvm — fija Node 24 según .nvmrc
npm ci                  # instala dependencias reproducibles
npm run dev             # http://localhost:5173/pagina-banana/
npm run build           # comprueba tipos + genera dist/
npm run check           # formato + lint + tipos + Vitest/esquema + build
npm run check:full      # check + E2E multi-navegador + panel de agentes
npm run test:unit       # unitarias y PostgreSQL/PGlite
npm run test:integration # Supabase local: RLS + cierre de sesión PWA
npm run test:smoke      # flujos críticos en Chromium, Firefox y WebKit
npm run test:pwa        # manifest, precache y arranque offline
npm run test:e2e        # pruebas end-to-end con Playwright
npm run test:e2e:agent  # permisos y errores del panel con backend controlado
npm run test:e2e:ui     # modo UI (Playwright test explorer)
npm run test:e2e:headed # con el navegador visible
```

Antes de ejecutar los tests por primera vez:

```bash
npx playwright install chromium firefox webkit
```

## Aplicaciones

Hay dos, por públicos distintos:

- **Panel de agentes como PWA.** `/agente` se instala como aplicación
  desde el propio navegador (Dock en Mac y Windows, pantalla de inicio en
  móvil), con icono y nombre propios, contador de conversaciones sin leer
  y notificaciones. No requiere nada: viaja en el despliegue normal.
  `npm run build` genera además `dist/sw.js` con el precache.
- **Tienda como aplicación nativa** (iOS y Android) con Capacitor, para
  App Store y Google Play.

```bash
npm run icons        # regenera iconos y splash desde el logo vectorial
npm run build:app    # build de la web para el binario (base '/', a dist-app/)
npm run app:ios      # build + sync + abre Xcode
npm run app:android  # build + sync + abre Android Studio
```

Los dos últimos necesitan Xcode completo, Android Studio y un JDK. Los
binarios se compilaron y ejecutaron en un simulador iOS y un emulador Android
el 2026-08-01; los requisitos y lo que hace falta para publicar de verdad están en
[`docs/06-app-nativa.md`](docs/06-app-nativa.md).

## Arquitectura: una base, dos composiciones

El principio que sostiene el proyecto y que **no conviene romper al
retomarlo**:

> Compartir dominio no significa compartir composición.

Web y app comparten repositorio, build, datos, tipos, precios, ofertas, rutas,
estado y persistencia. Lo que puede diverger es **cómo se ve y cómo se toca**.

La plataforma se resuelve una sola vez al arrancar, en
[`src/lib/nativeApp.ts`](src/lib/nativeApp.ts):

```ts
export const isNativeApp = Boolean(window.Capacitor)
```

Capacitor inyecta `window.Capacitor` en el WebView antes del bundle, así que el
valor no cambia durante la vida de la aplicación. En las pruebas E2E se simula
con `window.Capacitor = {}` desde un `addInitScript`.

**Dónde se decide**, comprobado contra el código:

| Superficie | Cómo diverge |
| --- | --- |
| `Home` | la página elige: `AppCustomerHome` en la app, composición web aparte |
| `FamilyPage` | elige entre `WebFamilyPage` y `AppFamilyPage` |
| `ComparePage` | elige entre `CompareWeb` y `CompareApp`; el dominio vive en `useComparador` |
| `FavoritesPage` | elige entre su composición web y `FavoritesApp`; el dominio, en `useFavoritos` |
| Tarjeta de producto | `ProductCardWeb` y `ProductCardApp`, con el comportamiento en `useTarjetaDeProducto`. `ProductCardCompact` es aparte: sólo la usan los carriles nativos |
| `SearchPage` | comparte composición y sólo escoge la tarjeta |
| `VariantPage`, `CartPage`, `CheckoutPage` | **una sola página compartida** con divergencias locales contadas, no dos páginas |
| `CheckoutLayout` | armazón propio, con modelo de scroll nativo en la app |
| `ModelPage` y las páginas editoriales | compartidas, sin frontera |

**Por qué a veces una página entera y a veces tres nodos.** Cuando divergen la
estructura y el público —una portada de escaparate frente a una de cliente—,
salpicar condicionales por doce secciones deja un archivo que nadie lee entero.
Cuando divergen tres detalles, duplicar la página garantiza que las dos copias
se separen sin que nadie se entere. El criterio está escrito en D-085, D-086 y
D-087.

**Dominio compartido, y no duplicado**: `useStore` (carrito, favoritos,
comparador y su persistencia), `useCheckoutState`, `productDecisionData`,
`useFavoritos`, `useComparador` y `useTarjetaDeProducto`. Las composiciones
consumen; no reimplementan.

El detalle y el porqué de cada decisión están en
[`docs/02-decisiones.md`](docs/02-decisiones.md) — especialmente **D-085** a
**D-090**.

## Catálogo desarrollado

Cinco familias con datos, imágenes locales y variantes reales:

| Familia | Modelos | Nota |
| --- | --- | --- |
| **iPhone** | 4 (17 Pro Max, 17 Pro, Air, 17) | Fotos oficiales por color |
| **Mac** | 8 (MacBook Neo, Air M4/M5, Pro M4/M5, iMac 24" M4, Mac Studio, Mac mini M4) | Imágenes oficiales optimizadas en WebP |
| **iPad** | 4 (Pro, Air, mini, A16) | Pulgada seleccionable dentro de la ficha |
| **Apple Watch** | 3 (Ultra 3, Series 11, SE 3) | Tamaño y GPS/Cellular seleccionables (excepto Ultra) |
| **AirPods** | 4 (Pro 3, 4 con Cancelación Activa de Ruido, 4, Max) | 5 colores de AirPods Max |

**Accesorios** reúne 18 modelos demostrativos y fichas propias bajo
`/accesorios`, con
fotografías, variantes y compatibilidad estructurada. Sigue siendo contenido
demostrativo, sin stock ni compra real.

## Estructura del código

```
src/
  data/
    products/           Catálogo por familia
    accessories/        Catálogo de accesorios por categoría
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
    product/            ProductCardWeb / ProductCardApp / ProductCardCompact,
                        useTarjetaDeProducto, CatalogFiltersWeb/App,
                        ProductImage, FinanceSimulator, StorePicker
    family/             WebFamilyPage, AppFamilyPage
    home/app/           AppCustomerHome y sus secciones
    favorites/          FavoritesApp, useFavoritos, identidadDeFavoritos
    compare/            CompareApp, useComparador, ModelPickerDialog
  pages/                Home, Family, Model, Variant, Search, Compare, Store,
                        Cart, Checkout, Services, PlanRenove, Stores,
                        StoreDetail, Support, ServiceTechnical, Favorites,
                        Accessories, AppleFinder, Login, Register, Profile,
                        MyProducts, Agent, NotFound
tests/e2e/              Pruebas Playwright de interfaz y accesibilidad
tests/unit/             Vitest sobre dominio y utilidades
tests/schema/           Instalación, actualización y RLS en PGlite
tests/rls/              GoTrue/PostgREST/Storage en Supabase dedicado
tests/integration/      Flujos autenticados contra Supabase local
docs/                   Documentación viva (00–09 + sesiones)
public/img/             WebP optimizados (~2,9 MB para todo el catálogo)
```

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Portada (empieza directamente por el `HeroCarousel` — sin `<h1>` por decisión visual consciente) |
| `/tienda` | Catálogo de la app nativa. En el navegador redirige a `/` |
| `/:family` | Familia (`iphone`, `mac`, `ipad`, `apple-watch`, `airpods`). Web y app montan composiciones distintas: `WebFamilyPage` / `AppFamilyPage` |
| `/:family/:model` | Modelo (redirige a la variante base) |
| `/:family/:model/:variant` | Ficha con selectores de color, capacidad y (según modelo) tamaño |
| `/buscar?q=…` | Buscador sincronizado con la URL |
| `/accesorios` | Catálogo inicial de accesorios oficiales Apple (§4.5). Filtros por categoría y compatibilidad, precios demostrativos, sin CTA de compra. |
| `/accesorios/:slug` | Ficha de un accesorio (variantes, especificaciones, compatibilidad estructurada, CTA a tiendas). |
| `/comparar` | Comparador esencial (hasta 3 productos, misma familia) con "Solo diferencias" y resumen orientativo |
| `/elige-tu-apple` | Asistente "Encuentra tu Apple" con recomendación determinista basada en las respuestas del usuario |
| `/carrito` | Carrito con selección de entrega compartida con checkout |
| `/checkout/1` | Datos y entrega/recogida (obligatorio antes del 2) |
| `/checkout/2` | Pago y extras (crea el pedido demo al confirmar) |
| `/checkout/3` | Confirmación (solo accesible con pedido válido) |
| `/servicios` | Servicios de Banana (contenido demostrativo) |
| `/plan-renove` | Plan Renove con valoración estimada online y finalización en tienda, sin precios ni tasador propio |
| `/soporte` | Centro de soporte (buscador, FAQ, acceso al Servicio Técnico y activador de la guía **Preparar mi dispositivo**) |
| `/servicio-tecnico` | **Servicio Técnico Autorizado**: sin cita, checklist, entrega, garantía / fuera de garantía y plazos orientativos |
| `/tiendas`, `/tiendas/:slug` | Google Maps embed con las 5 tiendas |
| `/favoritos` | Favoritos, con seguimiento de disponibilidad. Composición propia en la app |
| `/login`, `/registro` | Acceso y alta de cliente (Supabase Auth) |
| `/cuenta`, `/cuenta/:apartado` | Mi cuenta: datos, direcciones, pedidos, reservas, descuento educativo y favoritos |
| `/mis-productos` | Dispositivos comprados, con acceso a Mis pedidos |
| `/agente`, `/agente/login` | Panel interno de agentes, instalable como PWA |
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

Todo esto es demostrativo: existe un espejo opcional en Supabase cuando hay
sesión, pero no hay pedidos comerciales, pagos ni emails reales.

## Favoritos con seguimiento de disponibilidad (`/favoritos`)

- Página rediseñada con tres bloques: **Mis productos** (cada
  favorito con imagen, precio, estado en la tienda favorita y
  acciones "Ver producto" / "Quitar" / "Seguir disponibilidad"),
  **Mis avisos** (seguimiento activo por producto con "Simular
  llegada", cambio de tienda y "Desactivar") y **Notificaciones**
  internas.
- Estado en `src/lib/favoriteAlerts.tsx` con dos claves nuevas:
  `banana:favorite-alerts` y `banana:favorite-notifications`.
  Compatible con `banana:fav` existente sin migración.
- Nueva **campana** en la barra del Header (`NotificationsBell`)
  con contador de no leídos, panel accesible (Escape cierra),
  "Marcar todos como leídos" y enlace a `/favoritos`.
- Inventario demostrativo en `src/data/demoStoreInventory.ts`
  (determinista por tienda × modelo) con overrides en memoria
  para la simulación. Etiquetado siempre como "Disponibilidad
  de ejemplo" / "Simulación de stock".
- **Sin emails, sin peticiones de red, sin PII.** Nota
  explícita en la página: *"En una versión conectada al
  inventario y al sistema de comunicaciones, este aviso también
  podría enviarse por email."*
- Al quitar un favorito con seguimiento activo, el alert y sus
  notificaciones se borran para no dejar huérfanos.

## Tienda favorita (`storePreference.tsx`)

- Estado global en `src/lib/storePreference.tsx` con dos claves de
  `localStorage`: `banana:favorite-store` (slug de tienda) y
  `banana:favorite-store-prompt` (`dismissed` cuando el usuario
  cierra el prompt inicial). **No se guarda ubicación,
  coordenadas, IP, email ni ningún dato personal.**
- Bottom sheet accesible (`FavoriteStoreDialogs`) que aparece a
  los ~800 ms en la primera visita si no hay tienda ni prompt
  descartado. Nunca se muestra en `/checkout/*` y no bloquea la
  navegación.
- Selector "Mi tienda" en la barra utilitaria (`FavoriteStoreMenu`)
  y en el menú móvil (`FavoriteStoreMobileBlock`) para elegir,
  cambiar o quitar la tienda.
- Personalización: en `/tiendas` la tienda favorita aparece
  primero con badge *Tu tienda*; en el detalle de tienda hay un
  CTA "Marcar como mi tienda" / "Esta es tu tienda"; el
  `StorePicker` de las fichas de producto también prioriza la
  tienda favorita.
- Los horarios siguen calculados con `getTodayHours`, `isOpenNow`
  y `Atlantic/Canary`; se mantiene el aviso de que pueden variar
  en festivos.

## Asistente "Encuentra tu Apple" (`/elige-tu-apple`)

- Recorrido guiado con estado 100 % en React: intro → pregunta de
  familia → (opcional) preguntas generales cuando el usuario elige
  "No lo tengo claro" → 3-4 preguntas específicas por familia →
  hasta 3 resultados etiquetados como *Nuestra recomendación*,
  *Alternativa más económica* y *Alternativa más avanzada*.
- **No usa IA real ni backend.** `scoreModel` es una función pura
  determinista que combina las respuestas con la metadata de
  `MODEL_META` (`portabilityLevel`, `performanceLevel`,
  `cameraLevel`, `batteryLevel`, `valueLevel`, `professionalLevel`,
  `supportsPencil`, `supportsKeyboard`, `hasNoiseCancellation`,
  `hasCellular`, `fitType`) — todos declarados como orientación
  demostrativa del prototipo.
- Presupuesto orientativo: hasta 500 €, 1.000 €, 1.500 € o sin
  límite. Productos por encima del presupuesto quedan penalizados
  pero aparecen como *Alternativa más avanzada* con una advertencia.
- Cada resultado ofrece "Ver producto", añadir a favoritos, añadir
  al comparador y "Comparar estas opciones" (envía los 3 resultados
  a `/comparar` respetando el máximo de 3 y misma familia).
- Accesos: barra utilitaria superior, franja discreta en la portada,
  estado vacío del comparador y estado vacío de favoritos.

## Comparador esencial (`/comparar`)

- Título "Compara tus opciones" + descripción: *"Consulta solo las
  diferencias que realmente pueden ayudarte a elegir."*
- Cada columna muestra imagen, nombre, variante, capacidad, precio
  demostrativo, un `<select>` "Sustituir por" con los modelos
  restantes de la misma familia, y botones de "Ver producto",
  "Favorito" y "Comprar".
- Chip toggle **"Solo diferencias" (activo por defecto)** vs
  **"Mostrar todas"**. Con dos o más productos, un resumen
  superior indica "Opción más económica de esta comparación",
  "Mayor capacidad inicial", "Mayor pantalla entre los modelos
  seleccionados" y "Más ligero de la comparación" cuando existen
  datos comparables — marcado como *Orientación demostrativa*.
- Los campos esenciales y su mapeo desde `model.specs` viven en
  `src/data/productDecisionData.ts`. Nunca se inventan
  especificaciones: si el catálogo no tiene el dato, la celda
  muestra "No especificado" o se omite toda la fila.
- Los usuarios con `banana:compare` previo siguen viendo la nueva
  UI sin migración (el shape de `CompareItem` no cambia).

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

## Chat de Bananito

`<ChatBubble />` abre una conversación persistente y en tiempo real con
Supabase cuando el proyecto está configurado. El visitante no crea una cuenta,
pero obtiene una sesión anónima firmada; la apertura y los mensajes pasan por
RPC y RLS limita cada conversación a su propietario. El equipo responde desde
`/agente`, protegido por una sesión y una fila válida en `agentes`.

Sin credenciales, el widget cae a una respuesta local de demostración en vez
de romper la tienda. Se oculta durante `/checkout/*`. El diálogo mantiene
nombre accesible, trampa de foco, Escape y retorno del foco al activador.

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

`.github/workflows/ci.yml` encadena tipos, ESLint, Vitest/esquema, build,
Playwright y validación RLS antes de GitHub Pages. Solo publica desde `main`.
Las pruebas de navegador usan Chromium y Pixel 5; las RLS necesitan un
Supabase dedicado y bloquean un despliegue de `main` si faltan sus secretos.
El job RLS invoca Playwright directamente con `--reporter=json`, conserva su
código de salida y rechaza informes ausentes, vacíos, malformados o con texto
adicional antes de exigir exactamente 27 pruebas aprobadas.

## Pruebas Playwright

`playwright.config.ts` levanta Vite automáticamente en el puerto 5173 con
`baseURL: http://127.0.0.1:5173/pagina-banana/`. Proyectos:

- `chromium` — todas las pruebas.
- `mobile` (Pixel 5) — solo las marcadas con `@mobile` o `@all`.

La ejecución completa del 2026-08-04 sobre el build produjo 264 pruebas
aprobadas y una omitida porque solo aplica al servidor de desarrollo. El
conteo debe tomarse siempre de Playwright, no mantenerse a mano en esta lista.

- `tests/e2e/home.spec.ts` — carga de portada, acceso al catálogo de
  accesorios y ausencia de scroll horizontal a 375 px.
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
  y quitar favoritos desde la tarjeta de producto de `/iphone` y `/favoritos`,
  y añadir dos productos al comparador desde `/iphone/17-pro` usando los
  checkboxes "Añadir a comparar", verlos en `/comparar` y vaciarlo con
  los botones "Quitar". **No se preselecciona nada en `localStorage`.**
- `tests/e2e/accessories.spec.ts` — catálogo de accesorios Apple:
  encabezado, filtros por categoría y compatibilidad, cinco fichas
  distintas (MagSafe, Apple Pencil Pro, Magic Mouse, correa Watch,
  AirTag), imágenes reales con `naturalWidth > 0` y `alt` no vacío,
  cambio de variante, compatibilidad exacta iPhone 17 Pro / iPad Pro,
  buscador AirPods/cargador/funda/Pencil/Watch, navegación Home +
  Header, axe limpio en `/accesorios` y ficha, sin scroll horizontal
  a 375 px.
- `tests/e2e/search.spec.ts` — buscador semántico agrupado:
  sincronización del input con `?q=`, coincidencia principal +
  Dispositivos Apple + Productos relacionados + Accesorios Apple +
  Accesorios compatibles + Servicios + Ayuda; intención de accesorio
  vs dispositivo; sinónimos ("air pods" ≡ "airpods"); corrección
  ("airpds" → AirPods); estado vacío; URL + back/forward;
  autocompletado del Header (escritorio y móvil) con navegación por
  teclado; axe limpio.
- `tests/e2e/apple-finder.spec.ts` — asistente "Encuentra tu Apple":
  acceso desde portada, flujo iPhone completo (4 preguntas + resultados
  + reiniciar), imposibilidad de avanzar sin respuesta, "Anterior",
  "No lo tengo claro" (preguntas generales → familia inferida →
  preguntas específicas), resultado determinista (mismas respuestas →
  mismos productos), envío al comparador con "Comparar estas opciones",
  sin scroll horizontal a 375 px y axe limpio.
- `tests/e2e/comparator.spec.ts` — rediseño del comparador esencial:
  encabezado nuevo ("Compara tus opciones"), estado vacío con CTA del
  asistente pendiente, "Solo diferencias" activo por defecto vs
  "Mostrar todas", resumen con "Opción más económica", sustitución de
  modelo desde el `<select>` "Sustituir por", añadir a favoritos y
  cesta desde la columna, persistencia tras recargar, sin scroll
  horizontal a 375 px y axe limpio.
- `tests/e2e/audit-ux.spec.ts` — regresión de las mejoras post-auditoría:
  ahora la portada **no** contiene ningún `<h1>` (decisión visual
  consciente); banner "Sin cita previa" en `/servicio-tecnico`,
  checklist de preparación (copia, modo antirrobo, Buscar), entrega en
  cualquier tienda Banana, garantía / fuera de garantía con **35 €** y su
  descuento/no-reembolso, plazos orientativos con mínimo de 3 días, y
  Plan Renove con timeline en tienda (sin nombre de partner ni precios).
- `tests/e2e/device-preparation-guide.spec.ts` — guía interactiva
  "Preparar mi dispositivo": apertura desde `/soporte`, "Paso 1 de 4",
  confirmaciones que habilitan "Siguiente", contenido de los tres
  pasos (copia, modo antirrobo, Buscar), resumen final en orden con
  aviso de no compartir credenciales, "Anterior", Escape, trampa de
  foco, cierre desde el pie, reinicio al reabrir y ausencia de
  reserva de cita, calendario o denominación "Iniciar reparación".
- `tests/e2e/accessibility.spec.ts` — comprobaciones con
  [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright)
  (etiquetas `wcag2a`, `wcag2aa`, `wcag21a`) sobre ocho rutas
  (`/`, `/iphone`, `/iphone/17-pro/256gb-plata`, `/tiendas`,
  `/soporte`, `/servicio-tecnico`, `/plan-renove`, `/checkout/1`)
  más la guía
  interactiva abierta. **Ninguna regla se desactiva globalmente**:
  `color-contrast` y `region` están activas; las violaciones reales
  se corrigieron oscureciendo `--color-muted` a `#4d4d55`, la barra
  utilitaria a `#1f6e83` y `--color-available` a `#2a6d2e`.

## Documentación

Fuente de verdad viva en `docs/`:

- `00-estado-actual.md` — capacidades y últimos cambios. Distingue el presente
  del histórico; conviene respetar esa marca.
- `01-contexto-del-proyecto.md` — propósito y mapa técnico.
- `02-decisiones.md` — decisiones aceptadas con fecha y evidencia.
- `03-roadmap.md` — trabajo previsible (no compromiso).
- `04-problemas-pendientes.md` — bugs, deuda y validaciones. Abre con un índice
  de lo que sigue abierto.
- `05-registro-de-cambios.md` — bitácora de entregas.
- `06-app-nativa.md` — requisitos, firma y publicación de iOS/Android.
- `07-modelo-seguridad.md` — superficie de seguridad y RLS.
- `08-predespliegue-supabase.md` — comprobaciones antes de tocar producción.
- **`09-entrega-y-reanudacion.md`** — cómo levantarlo desde cero, qué
  arquitectura no romper y un guion para enseñarlo. **Empieza por aquí si
  retomas el proyecto.**
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
