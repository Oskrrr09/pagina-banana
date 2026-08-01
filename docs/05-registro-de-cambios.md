---
tipo: cambios
actualizado: 2026-08-01
---
	
# Registro de cambios

Este registro resume cambios relevantes. Git sigue siendo la fuente exacta para
autores, diffs y marcas de tiempo.

## 2026-08-01 — La app tiene interfaz de app, y compila en iOS y Android

- **Interfaz propia dentro del binario**: barra de navegación inferior con
  Inicio, Buscar, Favoritos, Carrito y Cuenta —con contadores— y sin pie de
  página. El carrito deja de estar duplicado en la cabecera. La web no
  cambia: todo va condicionado a `window.Capacitor`, que Capacitor inyecta
  antes de cargar el bundle, así que sigue habiendo un solo código.
- **El chat sale de la burbuja flotante y entra en "Contacta con
  nosotros"**, dentro del menú, junto al centro de ayuda y las tiendas.
- **iOS compilado y ejecutado por primera vez** (Xcode 26.6, SDK 26.5) en un
  simulador de iPhone 17 Pro. Hizo falta versionar el esquema compartido de
  Xcode, que se genera en `xcuserdata/` y queda fuera de git.
- **Tres fallos que solo aparecieron ejecutando los binarios**, no en el
  navegador ni en las pruebas:
  - la cabecera quedaba bajo la Dynamic Island (`env(safe-area-inset-top)`);
  - el aviso de tienda favorita tapaba la barra de navegación inferior;
  - ese mismo aviso se colaba encima del chat al pasar del menú al chat,
    porque la comprobación de A11Y-003 se hacía una sola vez y no de forma
    continua. Ahora se vigila con un `MutationObserver`.
- Suite en 230, con `tests/e2e/app-shell.spec.ts` (10 casos nuevos).

## 2026-08-01 — La app de Android compila y arranca; arreglada la trampa de foco

- **APK de Android generado y verificado** (`APP-001` cerrado para
  Android): `app-debug.apk`, 12 MB, `com.bananacomputer.tienda`,
  `targetSdk` 36. Instalado en un emulador Pixel arm64 con Android 36:
  arranca, la tienda renderiza dentro del WebView y la navegación
  profunda funciona, que era el riesgo real de meter un `BrowserRouter`
  en un WebView. Sin errores en `logcat`. Se hizo sin Android Studio,
  solo con JDK 21 y las herramientas de línea de comandos; la receta
  exacta está en [[06-app-nativa]]. **iOS sigue sin compilar**: necesita
  Xcode completo.
- **`A11Y-003` y `QA-003` cerrados, y el diagnóstico corregido.** El fallo
  intermitente de CI no era la trampa de foco de la guía, como se pensó
  primero: era el **aviso de tienda favorita**, que aparecía 800 ms
  después de cargar y tomaba el foco aunque hubiera un diálogo modal
  abierto. En el runner de Linux ese temporizador caía dentro del
  recorrido de tabulación del test. Se vio en cuanto el test empezó a
  informar de **qué elemento** recibía el foco en vez de un
  `true`/`false`.
  - El aviso ya no se muestra mientras haya un diálogo modal abierto; no
    se descarta, se reintenta y aparece al cerrarlo.
  - La trampa de foco de la guía se reescribió igualmente para gobernar el
    recorrido completo sobre una lista filtrada a los controles realmente
    alcanzables: no era la causa, pero era frágil.
  - Regresión cubierta en `favorite-store.spec.ts`. Suite en 220.

## 2026-07-31 — Aplicaciones: panel como PWA y tienda como app nativa

- **Panel de agentes instalable como aplicación**: `manifest-agente.webmanifest`
  con nombre e iconos propios (negro con el plátano amarillo, para
  distinguirlo de la tienda en el Dock). El manifest y las etiquetas de
  iOS **solo existen mientras se está en `/agente`**; las inyecta y las
  retira `AgentAppScope`, que envuelve el panel y su pantalla de acceso,
  para que ninguna página pública ofrezca instalar el panel interno.
- **Service worker generado en el build** (`scripts/generate-sw.mjs`): la
  lista de precache sale del `index.html` ya construido, con los hashes
  reales, y la versión de la caché se deriva del contenido. Navegación a
  red primero, assets con hash a caché primero, imágenes y fuentes
  stale-while-revalidate, y Supabase siempre a la red. Solo se registra
  en producción, nunca en el dev server.
- **Conversaciones sin leer**: contador en la pestaña del panel y sobre el
  icono del Dock (Badging API), negrita y punto en la bandeja, y
  notificación del sistema al llegar un mensaje con la ventana de fondo.
  El permiso se pide con un clic, nunca al cargar. Se calcula en el
  navegador del agente (`src/lib/agentUnread.ts`).
- **Barra de estado de la app** bajo la cabecera del panel: sin conexión,
  versión nueva disponible, invitación a instalar y permiso de avisos.
  Un aviso como mucho a la vez, y ninguno roba el foco.
- **Iconos generados desde el vector** (`npm run icons`) con el Chromium
  de Playwright, en vez de escalar el PNG de 144 px. Incluye variante
  `maskable` con zona segura y las pantallas de carga nativas.
- **App nativa de la tienda con Capacitor**: `capacitor.config.ts`,
  `npm run build:app` (mismo código, `--base=/`), proyectos `ios/` y
  `android/` versionados. **Sin compilar** — ver
  [[04-problemas-pendientes#APP-001 — La app nativa: Android verificada, iOS sin compilar]]
  y la guía [[06-app-nativa]].
- **Corregido**: el `<link rel="preload">` del hero llevaba
  `/pagina-banana/` escrito a mano en `index.html` y habría dado 404
  dentro de la app nativa. Ahora la base la antepone Vite en cada build.
- **Pruebas**: `tests/e2e/pwa.spec.ts`, 7 casos nuevos. Suite completa en
  219, en verde.

## 2026-07-30 — Chat de Bananito en tiempo real + panel /agente (Fase 1)

Commits: `7a73335`, `ad2c8c4`, `66c487f`, `5718b13` en `main`.

- **Mascota Bananito**: burbuja flotante circular en azul del nav
  utilitario (`#0768A9`) con la mascota Bananito encima. Fondo del panel
  de chat con patrón de plátanos sobre crema. Animación de entrada/salida
  con `transform + opacity`.
- **Panel visual del chat** con cabecera amarilla (color del nav),
  historial con burbujas asimétricas (agente/bot a la izquierda, visitante
  a la derecha), indicador de estado "En línea", auto-scroll y trampa de
  foco. Cursor pointer en todos los controles.
- **Backend Supabase** (Fase 1). Esquema versionado en
  `supabase/schema.sql`: `visitantes`, `conversaciones`, `mensajes` con
  trigger para ordenación, RLS activa con políticas abiertas al rol `anon`
  (temporal — ver [[02-decisiones#D-025 — Fase 1 sin autenticación de agentes]])
  y publicación en `supabase_realtime`.
- **Cliente Supabase** en `src/lib/supabase.ts` con fallback: si no hay
  credenciales, el chat cae al modo canned reply original y `/agente`
  muestra un aviso de configuración.
- **Hooks compartidos** en `src/lib/chatSession.ts`:
  `useVisitorChatSession(active)`, `useAgentInbox()`,
  `useAgentConversation(id)`. Todos incluyen suscripción realtime,
  deduplicación por id y manejo de estados de carga/error.
- **`ChatBubble.tsx`** reescrito para consumir la sesión real de
  Supabase manteniendo el modo demo. Se oculta también en `/agente/*`
  (antes solo en `/checkout/*`).
- **Panel `/agente`** (`src/pages/AgentPage.tsx`): layout full-screen con
  bandeja de las 50 conversaciones más recientes a la izquierda y
  ventana de chat activa a la derecha. Auto-selección de la conversación
  más reciente al cargar. Sin `Layout` público.
- **Deploy**: `.github/workflows/deploy.yml` inyecta
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` al build desde los
  secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` del repo.
- **`.gitignore`** extendido con bloque `.env` / `.env.*` (excepción
  `.env.example`). Tipos de `import.meta.env` documentados en
  `src/vite-env.d.ts`.
- **Dependencia nueva**: `@supabase/supabase-js ^2.111.0`.

## 2026-07-30 — Segunda ronda de corrección visual (PR pendiente, sin merge)

Rama `fix/accessory-images-round-2`. **NO fusionar sin revisión visual
manual.**

- **Auditoría visual manual** de las 22 imágenes de
  `public/img/accessories/`: se abrió cada archivo con `Read` para no
  fiarse del nombre. Detectadas **7 imágenes incorrectas** y 3
  productos retirados.
- **Imágenes corregidas** (SKU real verificado): AirTag individual
  (`MX532`), AirTag pack de 4 (`MX542`), puntas Apple Pencil (`MLUN2`),
  MagSafe 2 m (`MGDM4`).
- **Productos retirados** (imagen del CDN público no coincide con el
  producto declarado): Cable Thunderbolt 4 Pro 1,8 m, Magic Keyboard
  (USB-C) básico, Funda MagSafe iPhone Air. Sus rutas ya no aparecen
  en `/accesorios` ni en el buscador; visitar `/accesorios/<slug
  retirado>` redirige a `/accesorios`.
- **Magic Keyboard Touch ID + numérico** amplía a 2 variantes:
  **blanco** (`MXK73Y`, 199 €) y **negro** (`MXK83Y`, 229 €). Antes
  el archivo del basic (que en realidad era Touch ID + numérico
  blanco) se reasigna a esta variante.
- **`AccessoryCard` rediseñado** para compartir la jerarquía visual
  con `ProductCard`: mismo `min-h-[400px]`, `rounded-[12px] border
  border-line bg-surface p-4`, `hover:-translate-y-1.5
  hover:border-banana hover:shadow-[var(--shadow-raised)]`. Usa el
  helper `ProductImage` (bg neutral, `object-contain`, hover scale).
  Sin favoritos, carrito, comparador ni seguro.
- **`/buscar` usa la misma `AccessoryCard`** en la sección
  "Accesorios Apple". Se retira `AccessorySearchCard`. El
  autocompletado del Header conserva su miniatura compacta.
- **`ExactMatchCard`** también usa `AccessoryCard` cuando el match
  exacto es un accesorio Apple real.
- **Tests reforzados** (5 nuevos en `accessories.spec.ts`, total
  **194/194**): no aparecen productos retirados en `/accesorios`;
  las rutas retiradas redirigen a `/accesorios` (no ficha huérfana);
  Magic Keyboard Touch ID + numérico tiene 2 variantes con `src`
  distinto; `/buscar?q=iPhone` muestra la sección Accesorios Apple
  con la tarjeta completa `min-h-[400px]` (mismo diseño que
  `ProductCard`); guardia de altura mínima en ambas páginas.
- **Capturas** en `docs/capturas/`: `accesorios-desktop-1440.png`
  (1440 px, 19 productos), `accesorios-mobile-375.png` (móvil, sin
  scroll horizontal), `buscar-iphone-desktop.png` (accesorios con
  fotografía y misma jerarquía que dispositivos).
- **Documentación**: `docs/auditoria-visual-accesorios-round-2.md`
  con la tabla de hallazgos por archivo. `PR #28` pasa de "PR
  pendiente" a fusionada en la entrada anterior del registro.
- Sin cambios en carrito, checkout, seguro, favoritos, comparador,
  Plan Renove, Servicio Técnico, tienda favorita, alertas, inventario,
  ranking del buscador, sinónimos, fuzzy, comportamiento de Enter,
  dispositivos, precios de dispositivos, imágenes de dispositivos ni
  workflows.

## 2026-07-30 — Corrección visual del catálogo de accesorios (PR #28)

Rama `fix/accessory-images-and-search-cards`. Commit funcional
`db85349`. Merge `001d0b1`.

Rama `fix/accessory-images-and-search-cards`. **Requiere revisión
visual manual antes del merge.**

- **8 SVG bespoke retirados** y sustituidos por fotografía oficial:
  adaptador USB-C 30 W (`MY1W2_GEO_EMEA`), cable USB-C 240 W 2 m
  (`MU2G3`), cable Thunderbolt 4 Pro 1,8 m (`MWP73`), funda MagSafe
  iPhone Air (`MGH34`), Magic Keyboard iPad Pro 11" M4 (`MWR03`),
  correa deportiva Watch 46 mm (`MHYH4ref`), AirTag individual
  (`MX542`) y AirTag pack de 4 (`MX4M2`). Todas descargadas desde
  `store.storeimages.cdn-apple.com` a `public/img/accessories/`.
- **Magic Mouse y Magic Trackpad con variantes distintas**. Antes:
  el catálogo mostraba la misma foto para blanco y negro y además la
  variante "blanca" del Trackpad usaba en realidad la foto del
  Magic Mouse blanco. Ahora se sirven 4 archivos distintos
  (`magic-mouse-white/black.jpg`, `magic-trackpad-white/black.jpg`)
  correspondientes a los SKU `MXK53`, `MXK63`, `MXK93` y `MXKA3`.
- **Nuevo tipo `AccessoryImagePresentation`** con `fit`, `scale`,
  `position`, `padding` y `background` tipados. Se aplica a los
  adaptadores 20 W y 30 W (scale 1.1, padding compact) para que no
  se vean diminutos.
- **Nuevo componente `AccessoryImage`** que centraliza padding,
  fondo, `object-fit`, escala y posición. Se usa desde
  `AccessoryCard`, `AccessoryDetailPage` y la sección "Accesorios
  compatibles" de `ModelPage`. Se retiran `object-contain p-6/p-8/p-4`
  dispersos y `imageBg: '#f5f5f7'` redundante.
- **Tarjeta visual en /buscar**: nuevo componente
  `AccessorySearchCard` con fotografía + nombre + marca + categoría +
  compatibilidad + precio demostrativo. `SearchPage` pinta accesorios
  reales con `AccessoryVisualGrid` y mantiene `CompactSearchCard` como
  fallback para los ítems demostrativos de terceros.
  `ExactMatchCard` también renderiza `AccessorySearchCard` cuando el
  match exacto es un accesorio Apple real.
- **Miniatura en Header**: `SuggestionRow` muestra un thumbnail de
  44×44 px con la imagen del accesorio real. Los ítems demostrativos
  siguen con el icono de lupa. Ranking, Enter directo, ArrowUp/Down,
  Escape y aria-activedescendant intactos.
- **Tests reforzados**: 10 nuevos escenarios en `accessories.spec.ts`
  (sin SVG en `<img>`, todas las imágenes cargan y pertenecen a
  `/img/accessories/`, variantes de Mouse y Trackpad tienen `src`
  distinto, tarjetas visuales en `/buscar?q=iPhone`, `/buscar?q=cargador`
  sin badge demostrativo, Apple Pencil Pro vs USB-C con `src`
  distinto, miniatura en Header, Enter directo intacto, tamaño
  mínimo de imagen 140×140, guardia "0 SVG" en el catálogo). Total:
  **189/189** (179 → 189).
- **Documentación**: nueva `docs/auditoria-visual-accesorios.md`,
  `docs/fuentes-imagenes-accesorios.md` totalmente reescrita,
  `docs/catalogo-accesorios-apple.md` con banner de actualización,
  nueva nota de sesión
  `docs/sesiones/2026-07-30--correccion-visual-accesorios.md`.
  PR #27 pasa de "PR pendiente" a "PR #27" en la entrada anterior
  del registro.
- Sin cambios en ranking del buscador, sinónimos, fuzzy, intención,
  comportamiento de Enter, carrito, checkout, seguro, comparador,
  recomendador, Plan Renove, Servicio Técnico, tienda favorita,
  favoritos+avisos, inventario, dispositivos, precios de dispositivos,
  imágenes de dispositivos, workflows ni Node.

## 2026-07-30 — Catálogo inicial de accesorios Apple (PR #27)

Rama `feat/apple-accessories-catalog`. Commit funcional `5c5b4a2`.
Merge `cf40bd6`.

Rama `feat/apple-accessories-catalog`.

- **Nuevo tipo `Accessory`** en `src/data/accessories.ts` con
  compatibilidad estructurada (`families`, `models`, `notes`),
  variantes, especificaciones y precios de referencia. NO reutiliza
  el tipo `Model` de dispositivos.
- **20 fichas de accesorios oficiales Apple**: adaptadores USB-C
  (20 W, 30 W), MagSafe, cables (USB-C 240 W 2 m, Thunderbolt 4 Pro),
  fundas iPhone (17, 17 Pro trenzado técnico, Air), Correa Crossbody,
  Apple Pencil Pro y USB-C, puntas Pencil, Magic Keyboard iPad Pro
  11" (M4), Magic Keyboard (USB-C), Magic Keyboard Touch ID +
  numérico, Magic Mouse, Magic Trackpad, cable Watch USB-C 1 m,
  correa deportiva 46 mm, AirTag y AirTag pack de 4.
- **Página `/accesorios`** (nueva `AccessoriesPage`) con filtros por
  categoría y compatibilidad, radiogroups accesibles, botón "Limpiar
  filtros" y CTA a tiendas/soporte.
- **Ficha `/accesorios/:slug`** (nueva `AccessoryDetailPage`) con
  breadcrumb, galería con variantes accesibles, especificaciones,
  compatibilidad estructurada, aviso demostrativo, CTA
  "Consultar disponibilidad en tiendas" y sección de accesorios
  relacionados.
- **Tarjeta `AccessoryCard`** (nueva) coherente con `ProductCard`
  pero sin botón Comprar, sin stock, sin financiación ni seguro.
- **Sección "Accesorios compatibles"** en `ModelPage` (hasta 4
  accesorios por dispositivo, primero compatibilidad exacta, después
  familia).
- **Rutas** `/accesorios` y `/accesorios/:slug` registradas antes de
  la ruta dinámica `/:family` para evitar colisión con FamilyPage.
- **Integración con el buscador**: se retiran del
  `SEARCH_DEMO_ITEMS` las 5 entradas Apple sustituidas
  (`demo:apple-usb-c-cable`, `demo:apple-usb-c-adapter`,
  `demo:apple-airpods-tips`, `demo:apple-magsafe`,
  `demo:apple-watch-band`). El índice ahora genera automáticamente
  entradas `kind: 'apple-accessory'` desde `appleAccessories` con
  `source: 'catalog'` y `demo: false`. `demo:apple-airpods-tips`
  desaparece por completo (Banana no lo publica). Las terceras marcas
  (Beats, Sony, Bose, fundas y kits genéricos) siguen etiquetadas
  como "Contenido demostrativo".
- **Navegación**: Home, mega menú y accesos rápidos del Header
  ahora dirigen a `/accesorios` en lugar de `/iphone` o `/buscar`. La
  columna "Accesorios" del mega menú tiene enlaces reales, no
  fallback.
- **Imágenes**: 14 fotografías oficiales JPEG 1200×1200 descargadas
  desde `store.storeimages.cdn-apple.com` y 8 ilustraciones SVG
  bespoke del prototipo etiquetadas visualmente para los productos
  sin asset accesible desde el CDN público. Todas en
  `public/img/accessories/`. Ver
  `docs/fuentes-imagenes-accesorios.md`.
- **Documentación**:
  `docs/catalogo-accesorios-apple.md` (investigación previa,
  fuentes, decisiones, precios observados vs mostrados),
  `docs/fuentes-imagenes-accesorios.md` (origen y formato de cada
  imagen) y `docs/sesiones/2026-07-30--catalogo-accesorios-apple.md`
  (sesión).
- **Tests**: `tests/e2e/accessories.spec.ts` con 22 escenarios
  (catálogo, filtros, 5 fichas, imágenes, variantes, compatibilidad
  exacta iPhone/iPad, buscador AirPods/cargador/funda/Pencil/Watch,
  navegación Home + Header, axe /accesorios y ficha, sin scroll
  horizontal 375 px). El test histórico de home
  ("enlaces de accesorios") se adapta al nuevo destino `/accesorios`.
  Total: **179/179** (156 → 179).
- Sin cambios en `src/lib/store.tsx`, `INSURANCE_PRICE`,
  `insurancePrice`, `cartInsuranceTotal`, `setLineInsurance`, Plan
  Renove, Servicio Técnico, tienda favorita, favoritos+avisos,
  inventario demostrativo, comparador, recomendador, catálogo de
  dispositivos, precios de dispositivos, imágenes de dispositivos ni
  workflows.

## 2026-07-30 — Enter abre la página completa de resultados (PR #26)

Rama `fix/search-enter-results-page`. Commit funcional `dbf4b7f`.
Merge `a6e11dd`.

Rama `fix/search-enter-results-page`.

- **Bug corregido**: al escribir en el buscador del Header y pulsar
  Enter directamente, el autocompletado abría el primer resultado
  sugerido porque `activeIndex` se inicializaba en 0 (auto-selección).
  El comportamiento contradecía el patrón habitual: Enter sin
  selección explícita debe abrir la página completa de resultados.
- **Nuevo estado inicial**: `activeIndex = -1`. Sin selección visible,
  sin `aria-activedescendant`, sin resaltado de opción.
- **Enter sin selección** (`activeIndex === -1`): navega a
  `/buscar?q=${encodeURIComponent(query.trim())}`. Se aplica igual en
  escritorio y en el overlay móvil.
- **Enter con selección** (`activeIndex >= 0`, tras pulsar ArrowUp/
  ArrowDown): abre el destino de la sugerencia activa, como antes.
- **ArrowDown**: desde `-1` → `0` (primera sugerencia). Después
  avanza sin salir de rango.
- **ArrowUp**: desde `-1` → última sugerencia (wrap). Desde `0` →
  `-1` (vuelta al estado sin selección; Enter vuelve a abrir la
  página completa).
- **Cambiar la consulta** reinicia `activeIndex` a `-1` mediante un
  `useEffect` que observa `q`, elimina `aria-activedescendant` y la
  clase visual activa.
- **Cerrado**: `closeAndRestore()` limpia `activeIndex = -1` antes de
  ejecutar `onClose()` y de restaurar el foco a la lupa.
- **Se retiran `onMouseEnter` y `onFocus` de `SuggestionRow`**: la
  selección activa la controla exclusivamente el teclado (o el clic,
  que abre la opción directamente). Con esto el hover no cambia el
  significado de Enter.
- **Tests nuevos** (12): Enter directo abre `/buscar` en escritorio y
  móvil; Flecha abajo actualiza `aria-activedescendant`; cambiar la
  consulta lo limpia; botón lupa móvil abre `/buscar`; "Ver todos
  los resultados"; Escape con selección cierra y restaura foco sin
  navegar; regresión de orden de secciones para AirPods; intención
  accesorio para "funda AirPods"; corrección para "airpds". El test
  existente "flecha abajo + Enter" se endurece: la nueva assertion
  exige que la URL NO contenga `/buscar` cuando la selección es
  explícita. Total: **156/156** (141 → 156).
- Sin cambios en ranking, sinónimos, fuzzy, taxonomía, contenido
  demostrativo, catálogo, precios, imágenes, stock, `ProductCard`,
  comparador, recomendador, carrito, checkout, seguro, Plan Renove,
  Servicio Técnico, tienda favorita, favoritos, alertas, inventario,
  workflows ni Node. Sin dependencias nuevas.

## 2026-07-30 — Buscador inteligente por secciones (PR #25)

Rama `feat/grouped-semantic-search`. Commit funcional `420f002`.
Merge `21a93c3`.

Rama `feat/grouped-semantic-search`.

- **Nuevo motor determinista** `src/lib/catalogSearch.ts`. Puro,
  reutilizable, sin dependencias externas, sin backend, sin IA. Exporta
  `normalizeSearchText`, `tokenizeSearchQuery`, `inferSearchIntent`,
  `buildSearchIndex`, `scoreSearchItem`, `searchCatalog`,
  `limitSearchResults` y `suggestCorrection`.
- **Nuevo índice** `src/data/searchIndex.ts`. Estructura tipada
  (`SearchItem` con `kind`, `family`, `category`, `aliases`,
  `keywords`, `relatedTo`, `compatibleWith`, `demo`, `source`). Se
  construye automáticamente desde `families`, `allModels`, `services`
  y `supportTopics`; los productos relacionados y accesorios
  compatibles viven en `SEARCH_DEMO_ITEMS`, marcados como
  demostrativos.
- **Sinónimos** compactos: "air pods"→"airpods", "cascos"→"headphones",
  "funda"→"case", "cargador"→"charging"… Sin transformaciones agresivas.
- **Fuzzy matching** propio (Levenshtein sin dependencias). Palabras
  <= 4 sin fuzzy; 5..7 distancia 1; >= 8 distancia 2.
- **Intención** (`device` / `accessory` / `service` / `help` /
  `generic`) determinada por vocabulario. En intención `accessory` las
  secciones se reordenan para mostrar accesorios antes que dispositivos.
- **Puntuación por prioridad** documentada: exacto en nombre > exacto
  en alias > empieza por > todos los tokens > familia/categoría exacta
  > palabras clave > relacionado > compatible > descripción > ayuda.
  Los desempates no son alfabéticos: sección → marca Apple → orden
  estable.
- **/buscar** rediseñado: coincidencia principal + secciones agrupadas
  (Dispositivos Apple, Productos relacionados, Accesorios Apple,
  Accesorios compatibles, Servicios, Ayuda) + sugerencia "Quizá
  querías decir…" + estado vacío con categorías, asistente y soporte.
- **Header** con nuevo autocompletado accesible
  (`src/components/search/HeaderSearch.tsx`) compartido por escritorio
  y móvil. Combobox con `aria-expanded`, `aria-controls`,
  `aria-activedescendant`, `role="listbox"` + `role="option"`.
  Navegación ↓/↑/Enter/Escape; foco devuelto a la lupa al cerrar. Con
  campo vacío se muestran accesos rápidos, no todo el catálogo. Al
  final del panel, "Ver todos los resultados para «…»" enlaza a
  /buscar.
- **Contenido demostrativo** siempre etiquetado con
  `ProvisionalBadge`; sin precio, stock, financiación, botón Comprar
  ni enlace roto. Cuando no existe destino, la tarjeta es informativa.
- **Tests**: `tests/e2e/search.spec.ts` reescrito con 20 escenarios
  (AirPods, funda AirPods, cargador, cascos, air pods, airpds,
  consulta vacía, URL, back/forward, teclado del Header, Ver todos,
  overlay móvil, axe). Regresión: `apple-finder` (31) y
  `accessibility` (9) siguen verdes. Total: **141/141** (122 → 141).
- Sin cambios en carrito, checkout, seguro (`INSURANCE_PRICE`,
  `insurancePrice`, `cartInsuranceTotal`, `setLineInsurance`), Plan
  Renove, Servicio Técnico, tienda favorita, favoritos+avisos,
  inventario, comparador, recomendador, catálogo real, precios,
  imágenes ni workflows. Sin dependencias nuevas.

## 2026-07-30 — Últimos ajustes del recomendador (PR #24)

Rama `fix/finder-final-polish`. Commit funcional `88049b2`. Merge
`9fde8cf`.

- **Texto genérico para 0 candidatas**. `FamilyConfirmStep` distingue
  ahora dos casos: fotografía + complemento mantiene la explicación
  específica del prototipo; cualquier otra combinación sin candidatas
  usa un mensaje genérico ("Con las respuestas indicadas no hemos
  podido sugerir una categoría del catálogo" + "Puedes revisar tus
  respuestas o elegir manualmente una categoría para continuar"). Ya
  no se menciona fotografía cuando la ruta no es foto+accessory.
- **Foco al entrar en el estado sin coincidencias**. El encabezado
  principal recibe `tabIndex={-1}` y un `useEffect` mueve el foco al
  entrar en el estado (`focus({ preventScroll: true })`). Se mantiene
  `aria-live="polite"`. Se preserva el botón Atrás y el foco no se
  restaura en cada render.
- **Docs de la PR #23**. La entrada del registro deja de aparecer
  como "PR pendiente" y se enlaza al merge
  `67d26b9f5e5065a1e30d04e5c49f2e91c42996a8`. La nota de sesión
  correspondiente añade el bloque "Cierre" con PR, commit funcional y
  merge.
- **Tests**: se amplía "workType se limpia" para recorrer también el
  segundo resumen (Trabajo → Mac → resumen → cambio a Estudio → iPad
  → segundo resumen sin workType → resultados). Se añade un test que
  verifica el foco en el encabezado del estado sin coincidencias.
  Total: **122/122** (121 → 122).

Sin cambios en buscador, comparador, catálogo, precios, carrito,
seguro, checkout, Plan Renove, Servicio Técnico, tienda favorita,
favoritos+avisos, inventario ni imágenes.

## 2026-07-29 — Casos límite del recomendador (PR #23)

Rama `fix/finder-edge-cases-cleanup`. Commit funcional
`fe07b40d8bcd2b2a38430c24fb9cc68902297158`. Merge
`67d26b9f5e5065a1e30d04e5c49f2e91c42996a8`.

- **`workType` se limpia automáticamente** cuando `general.use` deja de ser
  "trabajo". `setGeneral` retira la clave del objeto (no la deja como
  `undefined`) para que ni el resumen ni el motor de ranking la vean como
  respuesta activa.
- **`SummaryStep` solo muestra preguntas aplicables**. Las filas
  generales se construyen a partir de `getGeneralQuestionFlow(general)`,
  respetando el orden real del recorrido y ocultando filas sin respuesta.
- **Fotografía + complemento** ya no recomienda nada. `isFamilyEligibleForIntent`
  devuelve `false` para las cinco familias cuando `use === 'foto'` y
  `role === 'accessory'`, porque el prototipo no tiene una categoría de
  accesorios fotográficos.
- **Sin fallback a iPhone**. Cuando `computeFamilyCandidates` devuelve
  `[]`, ya no se inyecta `[{ family: 'iphone', score: 0, reasons: [] }]`.
- **Estado sin coincidencias** en `FamilyConfirmStep` con título "No
  encontramos una categoría que encaje con todo" (mensaje específico
  para fotografía+complemento), acciones "Revisar respuestas" (vuelve a
  `general.productRole`) y "Ver todas las categorías" (selector manual).
  `aria-live="polite"`.
- **Soporte 0/1/2 candidatas**: con una sola candidata se renderiza una
  única tarjeta como "Recomendación principal", sin placeholder.
- **Código muerto retirado**: `FAMILY_ROLE_TAGS` y su `void` inalcanzable
  tras `return`.
- **Docs**: PRs #20, #21 y #22 ya no aparecen como "PR pendiente".
- **Tests**: 5 nuevos escenarios en `apple-finder.spec.ts`: limpieza de
  workType al cambiar de uso; SummaryStep no muestra workType; foto+
  accessory muestra estado sin coincidencias; "Revisar respuestas"
  conserva respuestas y permite cambiar el rol; "Ver todas las
  categorías" abre el selector manual. Regresión: trabajo + primary +
  portable sigue devolviendo Mac + iPad. Total: 121/121 (116 → 121).

Sin cambios en comparador, catálogo, precios, carrito, seguro,
checkout, Plan Renove, Servicio Técnico, tienda favorita,
favoritos+avisos, inventario ni imágenes.

## 2026-07-29 — Ranking de familias del recomendador (PR #22)

Rama `fix/finder-family-intent-ranking`.

- **Bug corregido**: en el flujo "No lo tengo claro" con respuestas
  Trabajo + Portabilidad + Sí lo llevaré siempre encima, el asistente
  proponía AirPods e iPhone en lugar de Mac e iPad. Causa: en
  `computeFamilyCandidates` los puntos se sumaban de forma independiente
  y el desempate final era alfabético (`family.localeCompare`), lo que
  colocaba `airpods` por delante de `mac`.
- **Nuevas preguntas generales**:
  - `general.productRole` ("¿Qué tipo de producto necesitas?") con
    valores `primary` / `mobile` / `accessory` / `unknown`.
  - `general.workType` ("¿Qué tipo de trabajo?") con `office` /
    `desktop-apps` / `creative` / `mobile-tasks` / `unknown`. Solo se
    pregunta si `general.use === 'trabajo'`.
- **`getGeneralQuestionFlow(general)`** filtra dinámicamente el flujo:
  `workType` solo aparece cuando el uso es trabajo.
- **Eligibility semántica** (`isFamilyEligibleForIntent`): un modelo
  incompatible por rol/uso NUNCA aparece. Trabajo + primary excluye
  AirPods/Watch; trabajo + accessory limita a AirPods; audio y salud
  fuerzan la familia natural.
- **Scoring por intención** (`scoreFamilyForIntent`): base por uso,
  modificador por productRole, modificador por workType, modificador
  por priority, modificador por portability. La portabilidad ya NO
  premia AirPods/Watch por ser pequeños ni penaliza a Mac con −1.
- **Desempate NO alfabético**: `FAMILY_PRIORITY_BY_USE` define una
  prioridad semántica por uso (`trabajo` → mac, ipad, iphone, airpods,
  apple-watch; etc.). El sort primero por score desc, y en empate por
  `priorityIndex` asc.
- **Tests nuevos** (9 escenarios): el bug reportado (trabajo + primary
  + portabilidad → Mac + iPad, no AirPods/Watch); trabajo + programación
  → Mac; trabajo + móvil + mobile-tasks → iPad + iPhone; estudio +
  primary → iPad + Mac; foto + primary → iPhone; audio + accessory →
  AirPods; salud + accessory → Watch; diario + mobile → iPhone;
  desempate NO alfabético. Suite: **116/116** (107 → 116).

Sin cambios en comparador, catálogo, precios, carrito, seguro, checkout,
Plan Renove, Servicio Técnico, tienda favorita, favoritos+avisos ni
imágenes.

## 2026-07-29 — Calidad de las recomendaciones del asistente (PR #21)

Rama `fix/apple-finder-recommendation-quality`.

- **Nueva arquitectura de respuestas** con namespaces en
  [[../src/data/productDecisionData]]: `FinderAnswers { general, family,
  specific }`. Los IDs específicos llevan prefijo por familia
  (`iphone.use`, `mac.form`, `airpods.fit`, `watch.cellular`, …). Ya no
  hay solapamiento de claves entre general y específica.
- **Flujo "No lo tengo claro"** con confirmación: preguntas generales →
  `computeFamilyCandidates` calcula 2 familias probables → pantalla
  "Por lo que nos cuentas, creemos que estas categorías pueden encajar"
  con recomendación principal, segunda posibilidad y "Ver todas las
  categorías". Volver atrás conserva respuestas generales.
- **Filtros duros** (`filterEligibleModels`) frente a preferencias
  blandas (`scoreEligibleModel`). Un modelo que incumple una
  restricción dura NUNCA se recomienda:
  - Mac portátil/sobremesa imprescindible;
  - AirPods `open` / `in-ear` / `over-ear` estricto;
  - iPad Pencil / Magic Keyboard imprescindible;
  - Apple Watch Cellular imprescindible;
  - presupuesto estricto o con margen del 15 %.
- **Taxonomía AirPods v2** — `airpodsFit: 'open' | 'in-ear' | 'over-ear'`
  reemplaza al antiguo `fitType`. Clasificación: AirPods 4 y 4 con ANC
  → `open`; AirPods Pro → `in-ear`; AirPods Max → `over-ear`.
- **Presupuesto por familia** — `getBudgetOptionsForFamily(family, models)`
  calcula tramos sensatos a partir de los precios reales del catálogo,
  con paso 25/50/100 € según familia. Nueva pregunta de
  **flexibilidad** (`strict` / `flex` / `reference`) que se combina con
  el filtro duro o con una penalización proporcional en el score.
- **Roles de resultado nuevos** — `best-fit` / `best-value` / `other`.
  Umbrales: best-value con score ≥ 70 % del mejor; other con score
  ≥ 75 % del mejor. Se retiran "Alternativa más económica" y
  "Alternativa más avanzada".
- **Relajación transparente** — si `filterEligibleModels` no deja
  ningún modelo, `FinderComputation.noMatch = true` y la UI muestra
  "No encontramos una opción que cumpla todo", con la lista de
  descartes, y ofrece "Ampliar presupuesto y probar" y "Revisar
  respuestas".
- **Razones y compromisos personalizados** — `buildRecommendationReasons`
  y `buildRecommendationCaveats` derivan las líneas "Encaja contigo
  porque" y "Ten en cuenta" a partir de las respuestas concretas
  (formato, prioridad, tamaño, Pencil/Cellular, presupuesto). Ya no
  se rellenan con `strengths` genéricos.
- **Resumen editable** ("Esto es lo que buscas") antes de calcular:
  Producto, respuestas generales, específicas, presupuesto y
  flexibilidad, con un botón "Cambiar" en cada línea.
- **Tests** — `tests/e2e/apple-finder.spec.ts` reescrito (16
  escenarios: flujo iPhone completo, confirmación de familia, filtros
  duros por familia, presupuesto estricto, resumen editable, roles
  nuevos, comparar, axe). Suite: **107/107** (99 → 107).

Sin cambios en carrito, seguro, checkout, Plan Renove, Servicio
Técnico, tienda favorita, favoritos+avisos, inventario demostrativo,
precios ni imágenes del catálogo.

## 2026-07-29 — Simplificación visual del comparador (PR #20)

Rama `fix/comparator-visual-simplification`.

- **Selección por diálogo** (`ModelPickerDialog`): tres "espacios" en la
  parte superior con "Elegir modelo" y "Cambiar modelo". Se retira la
  rejilla inferior con todos los modelos y el bloque "Diferencias entre
  las opciones". El diálogo reutiliza `<Modal />` (focus trap, Escape,
  restauración de foco, `aria-modal`).
- **Sustitución atómica** con `replaceCompareItem(currentId, next)` en
  `src/lib/store.tsx`: preserva orden de columnas, evita duplicados y
  respeta la restricción de familia única. El shape de `CompareItem` y la
  clave `banana:compare` no cambian.
- **Campos esenciales reducidos** en
  [[../src/data/productDecisionData]]: iPhone 8, Mac 8, iPad 7,
  Apple Watch 7, AirPods 6. Nueva lista `EXTENDED_FIELDS` sólo para el
  modo "Mostrar todas".
- **Agrupación semántica** con `FIELD_SECTIONS`: filas agrupadas en
  Precio, Pantalla/Diseño, Rendimiento, Cámara, Autonomía, etc. La tabla
  usa `<tr scope="colgroup">` con títulos de sección.
- **Regla del ganador único** en `buildDecisionSummary`: se declara
  ganador sólo cuando (a) todos los contextos tienen dato y (b) existe
  un extremo estricto. Un empate deja el badge sin asignar. Se retira el
  fondo amarillo global (`bg-brand-050`) de las celdas distintas.
- **Cabecera sticky real**: `<thead>` sticky, sin la copia
  `aria-hidden` que duplicaba productos.
- **Móvil 375 px**: sólo el contenedor de la tabla desplaza horizontal
  con `scroll-snap-type: x proximity` y `scroll-snap-align: start` por
  columna. Sin scroll horizontal en `<html>`/`<body>`.
- **Tests**: `tests/e2e/comparator.spec.ts` reescrito (14 escenarios,
  incluye ausencia de rejilla/resumen antiguos, sustitución en la misma
  columna, empate sin badge, sticky sin duplicados y axe del diálogo).
  Suite: 99/99 (chromium + mobile).

Sin cambios en carrito, seguro, checkout, Plan Renove, Servicio Técnico,
tienda favorita, favoritos+avisos, inventario demostrativo, precios ni
imágenes del catálogo.

## 2026-07-28 — Mejoras UX tras auditoría y cobertura axe

Rama `feature/audit-ux-improvements`.

- **Portada** con `<h1>` semántico único "Banana Computer — Apple en
  Canarias". El título rotativo del `HeroCarousel` pasa a `<h2>` para
  mantener la jerarquía.
- **`/soporte`** amplía el bloque "Servicio Técnico Autorizado" con:
  banner "Sin cita previa"; checklist de preparación (copia de
  seguridad, desactivar "Buscar", desactivar la Protección del
  dispositivo en caso de robo); opciones de entrega directa o en
  cualquier otra tienda Banana; condiciones de garantía (envío
  gratuito) y fuera de garantía (**35 €** con descuento si acepta la
  reparación o no reembolsable si la rechaza); plazos orientativos
  con mínimo de 3 días de traslado y aclaración de que ese plazo no
  incluye diagnóstico ni reparación. Sin reserva de cita, calendario,
  pago online, seguimiento real ni recogida a domicilio.
- **`/plan-renove`** incorpora una timeline oficial de cuatro pasos
  con Foxway (estimación → entrega → revisión y valoración final →
  compensación). Sin precios, sin ejemplos y sin tasador propio. El
  CTA "reservar cita previa" se sustituye por "Ver tiendas y
  horarios" para no contradecir la política sin cita.
- **`/tiendas`** deja de anidar enlaces dentro de un `div role="button"`
  (violación axe `nested-interactive`). Se sustituye por tres controles
  autónomos: "Ver detalles", "Cómo llegar" y un nuevo botón "Enfocar en
  el mapa".
- **Suite Playwright ampliada de 21 a 45 pruebas**: nuevo
  `tests/e2e/audit-ux.spec.ts` (16) verifica cada requisito literal de
  la mejora de SAT y Plan Renove, y nuevo
  `tests/e2e/accessibility.spec.ts` (7) ejecuta `@axe-core/playwright`
  con `wcag2a`, `wcag2aa` y `wcag21a` sobre portada, familia, ficha,
  tiendas, soporte, Plan Renove y checkout paso 1.
- `README.md` documenta las condiciones completas del servicio
  técnico y del Plan Renove, y `docs/03-roadmap.md` marca las cuatro
  mejoras como implementadas.
- No se modifica ni una línea del carrito, checkout, seguro ni scripts
  privados de la auditoría.

## 2026-07-28 — Auditoría UX de la web oficial de Banana Computer

Rama `chore/auditoria-web-oficial-banana`.

- Nuevos scripts locales `scripts/banana-audit/create-session.ts` y
  `scripts/banana-audit/run-audit.ts` con dos comandos npm
  (`audit:banana:login`, `audit:banana`). Ninguno se ejecuta en CI.
- `.gitignore` ampliado para bloquear sesiones, capturas privadas y
  cualquier `storageState`/`session.json` (`playwright/.auth/`,
  `.auth/`, `audit-private/`, `audit-logs-private/`, `audit-temp/`,
  `storageState*.json`, `*.session.json`).
- Nuevo informe `docs/auditorias/auditoria-web-oficial-banana.md` con
  alcance, resumen ejecutivo, análisis por sección, 15 hallazgos con
  gravedad y aplicación al prototipo, tabla comparativa con la web
  oficial y priorización.
- `docs/03-roadmap.md` amplía §6 con las cinco propuestas surgidas
  (todas pendientes de tu autorización). `docs/04-problemas-pendientes.md`
  registra UX-BANANA-001 como informativo.
- No se ha tocado la lógica del prototipo, ni el seguro, ni
  componentes ni pruebas existentes. `npm run build` y
  `npm run test:e2e` siguen en verde (21 pruebas).

## 2026-07-29 — Favoritos + avisos de disponibilidad (PR4 del bloque diferencial)

Rama `feature/favorites-availability-alerts`.

- Nuevo `src/data/demoStoreInventory.ts` con estado
  determinista por tienda × modelo (4 estados: disponible /
  pocas unidades / no disponible / bajo pedido) + overrides en
  memoria para la simulación de llegada.
- Nuevo `src/lib/favoriteAlerts.tsx` con contexto React y
  persistencia mediante `banana:favorite-alerts` y
  `banana:favorite-notifications`. Compatible con `banana:fav`
  sin migración; guardar favorito y activar aviso son acciones
  distintas.
- `src/pages/FavoritesPage.tsx` rediseñada con tres bloques:
  * **Mis productos** con estado en la tienda favorita, "Ver
    producto", "Quitar" y `<details>` "Seguir disponibilidad"
    para elegir tienda (opcionalmente también como favorita).
  * **Mis avisos** con "Simular llegada", cambio de tienda y
    "Desactivar".
  * **Notificaciones** internas con "Marcar como leído" /
    "Marcar todas como leídas".
- Nueva `NotificationsBell` en la cabecera con contador de no
  leídos, panel accesible (Escape, click-out) y enlace a
  favoritos.
- Al quitar un favorito con seguimiento activo, el alert y
  sus notificaciones se borran para no dejar huérfanos.
- Nueva `tests/e2e/favorites-alerts.spec.ts` (3): flujo
  completo con notificación + campana, huérfanos al quitar
  favorito y ausencia de PII / peticiones de red externas.
- Total suite: 90 → 93.
- Sin cambios en seguro, checkout, catálogo, Plan Renove,
  Servicio Técnico ni scripts privados.

## 2026-07-29 — Tienda favorita (PR3 del bloque diferencial)

Rama `feature/favorite-store`.

- Nuevo `src/lib/storePreference.tsx` con contexto React y
  claves `banana:favorite-store` y
  `banana:favorite-store-prompt`. Sólo se guarda el slug de
  tienda; nunca ubicación, coordenadas ni PII.
- Nuevo `src/components/layout/FavoriteStoreDialogs.tsx` con
  bottom sheet no bloqueante que se muestra en la primera
  visita (~800 ms) fuera del checkout. Confirmación discreta
  al elegir.
- Nuevo `FavoriteStoreMenu` en la barra utilitaria (Header) y
  `FavoriteStoreMobileBlock` en el menú móvil, ambos con
  radiogroup accesible para elegir/cambiar/quitar tienda.
- Personalización:
  * `/tiendas` ordena con la tienda favorita primero y muestra
    badge "Tu tienda".
  * `/tiendas/:slug` incluye CTA "Marcar como mi tienda" /
    "Esta es tu tienda" con opción "Quitar".
  * `StorePicker` prioriza la tienda favorita con badge y
    nota "Consultar en tu tienda".
- Nueva suite `tests/e2e/favorite-store.spec.ts` (7): prompt
  inicial no bloqueante, "Ahora no", elegir tienda + persistencia,
  cabecera actualizada, badge en `/tiendas`, marcar/quitar
  desde detalle, sin PII, 375 px sin scroll y prompt oculto
  en checkout. Total suite: 82 → 90.
- Sin cambios en checkout: se respeta cualquier selección
  explícita del usuario. Sin tocar seguro, catálogo, Plan
  Renove ni Servicio Técnico.

## 2026-07-29 — Asistente "Encuentra tu Apple" (PR2 del bloque diferencial)

Rama `feature/apple-finder-assistant`.

- Amplía `src/data/productDecisionData.ts`:
  * `ModelDecisionMeta` gana niveles cualitativos (1-3):
    `portabilityLevel`, `performanceLevel`, `cameraLevel`,
    `batteryLevel`, `valueLevel`, `professionalLevel` +
    banderas `supportsPencil`, `supportsKeyboard`,
    `hasNoiseCancellation`, `hasCellular`, `fitType` y
    `strengths` como orientación demostrativa.
  * `FINDER_QUESTIONS` por familia (3-4 preguntas + presupuesto),
    `GENERAL_QUESTIONS` para el flujo "No lo tengo claro" y
    `inferFamilyFromGeneral()` para mapear uso → familia.
  * `scoreModel(model, answers)` puro y determinista con
    razones positivas y posibles compromisos. Desempate
    estable: score desc → precio asc → slug asc.
  * `computeFinderResults()` produce 3 resultados etiquetados
    ("Nuestra recomendación", "Alternativa más económica",
    "Alternativa más avanzada"), sin duplicados.
- Nueva página `src/pages/AppleFinderPage.tsx` en
  `/elige-tu-apple` con estado 100 % React, radiogroups
  accesibles, "Anterior/Siguiente", "Empezar de nuevo" y
  "Cambiar respuestas".
- Accesos:
  * Nueva entrada "Encuentra tu Apple" en `utilityLinks`.
  * Franja discreta en la portada.
  * CTA activo en el estado vacío del comparador.
  * CTA secundario en el estado vacío de favoritos.
- Suite Playwright: nueva `tests/e2e/apple-finder.spec.ts` (8
  pruebas). Actualizado el test del comparador para el CTA
  activo. Total: 73 → 82 pruebas.
- Sin cambios en seguro, checkout, catálogo ni scripts privados.

## 2026-07-29 — Comparador esencial (PR1 del bloque diferencial)

Rama `feature/comparator-essential`.

- Nuevo módulo `src/data/productDecisionData.ts`: campos
  esenciales por familia (iPhone/Mac/iPad/Watch/AirPods),
  utilidades de normalización (`getEssentialValue`,
  `buildDecisionRows`, `buildDecisionSummary`,
  `parseWeightGrams`, `parseScreenInches`,
  `parseCapacityGB`). Metadata interna `usoRecomendado` por
  modelo, marcada como orientación demostrativa.
- Rediseño de `src/pages/ComparePage.tsx`:
  - Encabezado "Compara tus opciones" + descripción explicando
    el foco en diferencias.
  - Estado vacío con selector de familia y CTA "Necesito ayuda
    para elegir" (deshabilitado hasta la PR 2 del asistente).
  - Columnas con imagen, nombre, variante, capacidad, precio
    demostrativo, botones "Ver producto" / "Favorito" /
    "Comprar" / "Quitar" y `<select>` "Sustituir por" con los
    modelos restantes de la familia.
  - Cabecera sticky reducida en escritorio con las tarjetas
    activas.
  - Switch **"Solo diferencias" (por defecto)** vs "Mostrar
    todas" con `aria-live="polite"`; ambos aplican sobre la
    reducción de `buildDecisionRows`.
  - Resumen superior calculado con `buildDecisionSummary`:
    "Opción más económica", "Mayor capacidad inicial", "Mayor
    pantalla" y "Más ligero" — sólo cuando hay dos productos y
    los datos son comparables. Etiquetado como *Orientación
    demostrativa*.
- Compatibilidad total con `banana:compare` existente: no se
  cambia el shape de `CompareItem` (los datos esenciales se
  derivan al vuelo a partir del catálogo por `modelSlug`).
- Suite Playwright: nueva `tests/e2e/comparator.spec.ts` (8
  pruebas: encabezado, estado vacío, switch, resumen,
  sustitución, favoritos/carrito, persistencia, 375 px, axe) y
  actualización de `favorites-compare.spec.ts` para el nuevo
  `aria-label` "Quitar iPhone 17 Pro de la comparación" y el
  scope del `<thead>`. Total: 64 → 73 pruebas.
- Sin cambios en seguro, checkout, precios, Plan Renove,
  Servicio Técnico ni scripts privados.

## 2026-07-29 — Limpieza release candidate y mantenimiento técnico

Rama `chore/release-candidate-cleanup`.

- **Documentación alineada con la interfaz**: la fila de
  `/plan-renove` en la tabla de rutas del README ya no menciona
  al proveedor externo; la sección de axe corrige el conteo a
  "ocho rutas más la guía interactiva". `docs/03-roadmap.md`
  refleja el orden correcto de preparación (copia → antirrobo →
  Buscar), la existencia de `/servicio-tecnico` como página
  propia y la guía interactiva `DevicePreparationGuide`.
- **Node.js 24 explícito en CI y Pages**: `node-version: 20` →
  `node-version: 24` en `.github/workflows/e2e.yml` y
  `.github/workflows/deploy.yml`. Nuevo `.nvmrc` en la raíz con
  `24` para alinear el entorno local con nvm.
- **Artefactos de TypeScript fuera del repositorio**:
  `git rm tsconfig.tsbuildinfo` y nueva regla `*.tsbuildinfo` en
  `.gitignore`. El archivo sigue generándose localmente con
  `tsc -b` pero ya no se versiona. No se ha desactivado el modo
  `incremental`.
- **`npm audit` reverificado**: sigue habiendo 2 vulnerabilidades
  moderadas en `react-router@6.30.4` sin fix dentro de la línea
  6.x (`GHSA-wrjc-x8rr-h8h6` y `GHSA-337j-9hxr-rhxg`). Se
  **mantiene** `react-router-dom@6.30.4`; no se ha migrado a
  React Router 7 ni se ha ejecutado `npm audit fix`. SEG-001
  permanece abierto con la evidencia actualizada.
- **QA-001 sin contradicciones**: el pendiente residual queda
  reducido a ampliar la cobertura axe al detalle de tienda
  (`/tiendas/:slug`); ya no aparece "integrar axe" como tarea
  pendiente.
- **CI-001 cerrado en código**, pendiente de la validación del
  workflow de la propia PR.
- **ARTEFACTOS-001** documentado y cerrado.
- Sin cambios en interfaz, componentes React, `src/`, `tests/`
  ni scripts privados de auditoría. El seguro, el checkout, el
  Plan Renove y la guía interactiva permanecen intactos.

## 2026-07-29 — Portada sin H1, guía interactiva y axe sin excepciones

Rama `fix/home-sat-guide-accessibility`.

- **Portada** (`src/pages/Home.tsx`): se elimina la franja
  "Bienvenido / Banana Computer — Apple en Canarias" y el `<h1>`
  que contenía. La portada empieza directamente por `HeroCarousel`.
  Es una decisión visual consciente: no se sustituye por otro H1,
  ni visible ni `sr-only`.
- **Guía interactiva "Preparar mi dispositivo"**
  (`src/components/support/DevicePreparationGuide.tsx`): modal
  accesible con `role="dialog"`, `aria-labelledby`, `aria-describedby`,
  trampa de foco (Tab / Shift+Tab cíclicos), Escape, restauración
  del foco al activador y `inert` sobre el resto del documento
  mientras está abierto. Cuatro pasos: copia de seguridad → modo
  antirrobo → función Buscar → resumen. Cada paso de preparación
  exige una confirmación explícita antes de habilitar "Siguiente".
  **Estado local**: no toca `localStorage`, `sessionStorage`,
  cookies ni la red; al cerrar reinicia el progreso.
- El quick-link "Iniciar reparación" pasa a llamarse
  **"Preparar mi dispositivo"** (`src/data/content.ts`) y ahora
  abre la guía. Los CTAs de `/soporte` y `/servicio-tecnico` la
  activan también.
- **axe sin excepciones globales** (`tests/e2e/accessibility.spec.ts`):
  se retira `disableRules(['color-contrast','region'])`. Las
  violaciones reales se corrigen con cambios mínimos de paleta:
  `--color-muted` `#6e6e73` → `#4d4d55`; barra utilitaria
  `#3ea3c1` → `#1f6e83` (retirada la opacidad `text-white/90`);
  `--color-available` `#2e7d32` → `#2a6d2e`; y `text-ink/60`
  → `text-ink/80` en la portada y en el hero.
- **`/tiendas`** ya se había corregido previamente para `nested-interactive`.
- **Landmarks** en `SupportPage`: el contenido pasa a estar
  envuelto en `<main>`, la FAQ y las secciones de cierre en
  `<section aria-labelledby>` para que `region` pase sin trucos.
- **Suite Playwright**: 49 → **64 pruebas** (nuevos:
  `device-preparation-guide.spec.ts` con 12 pruebas y ajustes en
  `audit-ux.spec.ts`).
- **No se ha tocado** Plan Renove, ni carrito, ni checkout, ni la
  lógica del seguro.

## 2026-07-28 — Docs actualizados y E2E reales para favoritos y comparador

Rama `fix/docs-and-real-e2e`.

- README: la sección "Pruebas Playwright" indica el número real de
  suites y pruebas medido con `npm run test:e2e` (21: 20 en `chromium`
  + 1 en `mobile`), enumera cada archivo y aclara que el workflow
  instala Chromium y que el proyecto `mobile` usa `Pixel 5` para no
  requerir WebKit. Se explicita que favoritos y comparador se prueban
  ahora recorriendo la interfaz real y que no se preselecciona nada en
  `localStorage`.
- `docs/00-estado-actual.md`: retirada la PR #5 como versión desplegada
  actual y sustituida por la PR #10 y esta rama; catálogo corregido a
  21 modelos reales contados desde `src/data/products.ts`; tiendas con
  badge "Abierto ahora" / "Cerrado" (hora de Canarias) y mapa por
  `mapQuery`; modo claro fijo sin `prefers-color-scheme`; historial
  de despliegues y verificaciones marcado explícitamente como
  histórico para no confundirlo con el estado actual.
- `docs/04-problemas-pendientes.md`: QA-001 detalla la nueva
  metodología (interacción real, sin `setItem`); DOC-001, HOOKS-001 y
  A11Y-001 se mantienen cerrados; no se abren problemas sobre el
  seguro.
- Pruebas E2E: `tests/e2e/favorites-compare.spec.ts` reescrito.
  Favoritos ahora se prueba desde `/iphone` → botón corazón del
  `ProductCard` → `/favoritos` → botón "Quitar" → estado vacío.
  Comparador ahora se prueba desde `/iphone/17-pro` → dos checkboxes
  "Añadir a comparar" → `/comparar` → botones "Quitar" → vacío. Las
  pruebas del seguro (`checkout-flow.spec.ts` y `checkout.spec.ts`) se
  conservan intactas.
- Resultados: `npm run build` correcto (426 módulos); `npm run test:e2e`
  21/21 en verde; Deploy Pages y Pruebas E2E en verde tras el merge.

## 2026-07-28 — Hooks del checkout, trampa de foco del chat, docs y E2E

Rama `fix/checkout-hooks-docs-e2e`.

- `CheckoutPage`: todos los hooks se llaman antes de cualquier retorno
  condicional. Las guardas de los pasos 1, 2 y 3 se mantienen; la
  confirmación sigue sobreviviendo a recargas y el pedido demostrativo
  sigue creándose sólo al pulsar "Confirmar pedido".
- `ChatBubble`: trampa de foco completa (Tab / Shift+Tab cíclicos entre
  "Cerrar" e "Ir a soporte"), Escape cierra y devuelve el foco al botón
  flotante, y el resto del documento se marca `inert` mientras el panel
  está abierto. El botón flotante pasa a "Ocultar chat" al estar abierto
  para no colisionar con el nombre accesible del botón interno.
- README: "PNGs oficiales" → "Imágenes oficiales optimizadas en WebP",
  sección explícita de reseñas y textos comerciales demostrativos, y
  retirada la mención a `prefers-color-scheme` (la interfaz está en
  modo claro fijo).
- Suite Playwright ampliada de 9 a 21 pruebas: entrega compartida
  carrito↔checkout, seguro sin duplicar cantidad, color/capacidad con
  basename, Apple Watch tamaño y GPS/Cellular, recarga profunda,
  ausencia de errores de hooks en consola, favoritos, comparador y
  trampa de foco del chat con teclado.
- Docs actualizados: `00-estado-actual.md`,
  `04-problemas-pendientes.md` (cierra DOC-001; abre y cierra
  HOOKS-001 y A11Y-001; amplía QA-001).

## 2026-07-28 — PNGs transparentes Air+iMac, nav una sola fila, publicado

Workflow `30313993859` completado con `success`.

- MacBook Air (4 colores) e iMac 24" M4 (7 colores): sustituidas por PNGs
  transparentes 1080×1080 (RGBA) descargados directamente del CDN de Apple
  (`store.storeimages.cdn-apple.com`, `fmt=png-alpha`). Sin fondo blanco.
  iMac mantiene `imageBg` para el fondo de color característico.
- Nav strip Mac: una sola fila con `overflow-x-auto no-scrollbar`, items a
  `w-24 shrink-0`, centrados en lg+. Los 9 items son visibles sin scroll en
  escritorio y con scroll horizontal en móvil.

## 2026-07-28 — Imágenes Air/Pro corregidas y Mac mini visible, publicado

Workflows `30312650928` y `30313030912` completados con `success`.

- MacBook Air M4/M5: reemplazadas las imágenes anteriores (vista de perfil cerrado) por recortes correctos de la vista frontal abierta del compuesto oficial de Apple (y=60–400 sobre 504×876, escalado a 1080×1080 blanco). Azul cielo usa la imagen oficial de 1080×1080 de Apple Newsroom. Cuatro colores: Medianoche, Plata, Blanco estrella y Azul cielo.
- MacBook Pro M4/M5: reencuadradas las cinco imágenes de color para centrar verticalmente el portátil (recorte y=265, altura=750; relleno a 1080×1080). El portátil pasa del 28–89 % al ~20–80 % del encuadre.
- Catálogo Mac — nav strip: cambiado de desplazamiento horizontal (`overflow-x-auto`) a cuadrícula flexible (`flex-wrap justify-center`). Todos los modelos incluido Mac mini son visibles sin necesidad de scroll.
- iMac 24" M4 en nav: la miniatura aplica `imageBg` como `backgroundColor` del contenedor, igual que en las tarjetas de producto.

## 2026-07-27 — Imágenes Air abiertas, fondo iMac y Mac mini, publicado

Workflow `30283909013` completado con `success`.

- MacBook Air M4/M5: las imágenes por color (Medianoche, Plata, Blanco estrella, Azul cielo) muestran ahora el portátil abierto recortado de la imagen compuesta de Apple, rellenado a 1080×1080.
- iMac 24" M4: añadido `imageBg` por color para que el fondo del contenedor de imagen coincida con el fondo de la foto, eliminando el recuadro visible en tarjetas y ofertas.
- Página Mac: nueva sección "Catálogo completo" con `ProductCard` para todos los modelos, haciendo visible Mac mini y Mac Studio independientemente de si tienen oferta.

## 2026-07-27 — Imágenes Mac por color, publicado

Workflow `30277394128` completado con `success`.

- MacBook Neo actualizado a 4 colores reales (Plata, Cítrico, Rosa nube, Índigo) con imágenes PNG individuales de Banana Computer.
- MacBook Pro M4 y M5: imágenes por color (Negro espacial / Plata) en lugar de imagen única.
- MacBook Air M4: añadido 4.º color Azul cielo con imagen oficial.
- MacBook Air M5: añadido color Blanco estrella (4 colores totales).
- iMac 24" y Mac mini: imágenes redimensionadas de 2250×2250 a 1080×1080 para uniformidad visual.

## 2026-07-26 — Tema automático del dispositivo, pendiente de publicación

- Retirado el botón de tema de la cabecera comercial y de checkout.
- Eliminados el proveedor React, la preferencia `banana:theme` y el fundido
  asociado al cambio manual.
- El modo oscuro se activa exclusivamente mediante
  `prefers-color-scheme: dark` y responde a cambios del dispositivo.
- En modo claro se conserva la presentación blanca original.

## 2026-07-26 — Selector de tema e imágenes Mac, publicado

La PR [#5](https://github.com/luis-lop-nas/pagina-banana/pull/5) se fusionó en
`main`. El workflow
[`30214178171`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30214178171)
compiló y publicó la versión en
<https://luis-lop-nas.github.io/pagina-banana/>.

- Añadido un selector claro/oscuro en la cabecera comercial y en checkout.
- La preferencia del sistema actúa como valor inicial y la elección manual se
  conserva en `localStorage`.
- El paso entre temas usa un fundido accesible de 360 ms que respeta la
  reducción de movimiento.
- Corregidas las franjas blancas laterales de la campaña principal en modo
  oscuro.
- Sustituidas las ocho siluetas del selector Mac por fotografías oficiales
  descargadas de Apple Newsroom, documentadas y centradas en marcos uniformes.
- Compilación de producción y comprobación manual local correctas.
- En producción se verificaron la persistencia del tema, el fondo negro de la
  campaña y la carga y el centrado de las ocho imágenes.

## 2026-07-26 — Consistencia visual y tema del dispositivo, publicado

La PR [#4](https://github.com/luis-lop-nas/pagina-banana/pull/4) se fusionó en
`main`. El workflow
[`30211613240`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30211613240)
compiló y publicó la versión en
<https://luis-lop-nas.github.io/pagina-banana/>.

- Fijada la altura del carrusel de tiendas y del mega-menú de escritorio.
- El mega-menú Mac usa imagen de producto, sitúa “Nuevo” sobre la tarjeta y
  lista juntos los MacBook Air M4/M5 y los MacBook Pro M4/M5.
- Normalizadas las áreas internas de las tarjetas de producto para alinear las
  tarjetas de una misma categoría.
- La ficha muestra controles de cantidad junto al carrito una vez que la
  variante está añadida; la capacidad conserva el color seleccionado.
- La cabecera de checkout usa un amarillo pastel opaco.
- Añadido tema automático claro/oscuro según el dispositivo.

## 2026-07-26 — Catálogo y flujo de compra publicado

La PR [#3](https://github.com/luis-lop-nas/pagina-banana/pull/3) se fusionó en
`main`. El workflow
[`30210351355`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30210351355)
compiló y publicó la versión, verificada después en
<https://luis-lop-nas.github.io/pagina-banana/>.

- Nueva presentación de iPhone y Mac con franja horizontal de modelos, ofertas
  destacadas y acceso directo a variantes.
- Categoría Mac ampliada a ocho grupos actuales de producto, con imágenes
  locales y precios siempre marcados como demostrativos.
- La ficha separa “Comprar” —checkout inmediato— de “Añadir al carrito” —seguir
  comprando—.
- El seguro se vincula a cada producto y puede modificarse en su tarjeta de
  cesta y en “Pago y extras”; el resumen calcula el total por unidades
  aseguradas.
- La cabecera exclusiva del checkout adopta un amarillo suave para diferenciarse
  de la cabecera comercial.
- Añadido un globo amarillo global que reserva el acceso al futuro chat y
  comunica que todavía no está disponible.
- Verificados build, rutas principales y 375, 768, 1024 y 1440 px sin
  desbordamiento horizontal.
- Registrado el aviso no bloqueante del workflow sobre la retirada de Node 20.

## 2026-07-26 — Flujo de variantes y seguro publicado

La PR [#2](https://github.com/luis-lop-nas/pagina-banana/pull/2) se fusionó en
`main` y el workflow
[`30208520075`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30208520075)
publicó correctamente esta versión en GitHub Pages.

### Flujo de variantes y seguro

- “Comprar” en las tarjetas de color abre ahora la ficha de la capacidad y el
  color seleccionados.
- Las URLs de variante respetan el `basename` `/pagina-banana/`.
- El botón defectuoso de seguro se sustituyó por una casilla accesible.
- El seguro se persiste como opción única del pedido, añade 8,99 € sin duplicar
  productos y se comparte entre ficha, carrito y checkout.
- Verificados build y recorrido manual en escritorio y a 375 px.

## 2026-07-26 — Publicado en GitHub Pages

La PR [#1](https://github.com/luis-lop-nas/pagina-banana/pull/1) se fusionó en
`main` y el workflow
[`30206642599`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30206642599)
publicó correctamente esta versión en
<https://luis-lop-nas.github.io/pagina-banana/>.

### Presentación y accesibilidad

- Sustituida la reseña ficticia por un espacio neutro para futuras opiniones
  verificadas.
- Separado checkout del layout comercial: una cabecera simplificada y sin
  footer general en los tres pasos.
- Actualizadas las cinco tiendas con direcciones, horarios, fecha de consulta y
  fuentes oficiales; eliminado el estado “Abierto ahora”.
- El selector de recogida del checkout reutiliza los datos centrales de tiendas.
- Añadida trampa de foco, Escape, retorno del foco, ARIA modal y bloqueo de
  scroll al menú móvil.
- Convertido el footer móvil en acordeones cerrados inicialmente, con controles
  táctiles de al menos 44 px.
- Reforzada la newsletter móvil con campo y botón de 48 px, texto de 16 px y
  apilado sin desbordamiento a 375 px.
- Ajustado el breakpoint de la navegación comercial para evitar desbordamiento
  a 1024 px.

### Documentación

- Añadido `AGENTS.md` con reglas de contexto, alcance, mantenimiento documental
  y verificación.
- Creado el vault compartido `docs/` con estado, contexto, decisiones, roadmap,
  problemas pendientes y registro de cambios.
- Reservado `docs/sesiones/` para notas de continuidad.
- Ignorada la configuración local `docs/.obsidian/` y `.obsidian/`.
- Incorporados los skills locales de `.agents/` como guías reutilizables del
  repositorio.

### Verificación

- Compilación de producción correcta.
- Instalación reproducible con `npm ci`.
- Comprobación manual correcta a 375, 768, 1024 y 1440 px.
- Registrados dos avisos moderados de seguridad de React Router.

## Historial existente

### 2026-07-27

- `b1dcb2e` — Centrado imagen hero (recorte negro izquierda) y corrección de
  overflow horizontal de página (overflow-x: hidden en html/body).
- `2a12431` — Flechas bento, lupa a la izquierda del carrito, overlay de
  búsqueda con sugerencias por categoría y recorte de banda gris inferior del hero.
- Push directo a `main` en ambos casos.

### 2026-07-26

- `bdd7c85` — Fusiona las correcciones de presentación y accesibilidad.
- `e7de00b` — Añade despliegue automático a GitHub Pages.
- `76642b3` — Unifica el color de marca a amarillo Banana.
- `35fca54` — Ajustes de tiendas, comparador y cabecera.
- `a7e08e6` — Rediseño Banana: catálogo multi-familia, estética amarilla y
  nuevas secciones.

### 2026-07-25

- `aa0bb54` — Prototipo navegable de Banana Computer (Fase 2, §8.2).
- `711023f` — Initial commit.
