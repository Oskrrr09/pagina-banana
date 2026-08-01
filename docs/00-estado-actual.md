---
tipo: estado
actualizado: 2026-08-01
---

# Estado actual

> [!summary]
> Prototipo SPA navegable y compilable de una tienda Apple para Banana Computer.
> La experiencia cubre catálogo, búsqueda, favoritos, comparación, carrito,
> checkout simulado, servicios, Plan Renove, tiendas, soporte y **chat en
> tiempo real con Supabase + panel de agentes** (Fase 1 desplegada el
> 2026-07-30). No hay integración comercial real ni motor de pago.

## Fase 2 — cuentas, reservas y panel con auth (2026-07-31)

> [!check] Esquema aplicado y verificado el 2026-07-31
> Oscar ejecutó `supabase/schema.sql` completo (las dos tandas). Se
> comprobó contra la base de datos real, vía la API REST, que existen las
> tablas y columnas nuevas, que las funciones responden, y que un
> anónimo **no** puede escribir como agente (`42501`), aprobar descuentos
> ni borrar conversaciones. El bucket de justificantes es privado. Ver
> [[04-problemas-pendientes#CUENTAS-004 — Segunda tanda de SQL pendiente de ejecutar]].

Todo lo de esta sección es **demostrativo, con cuentas ficticias**: no
hay agentes ni clientes reales de Banana, ni cobros. Ver
[[02-decisiones#D-027 — Fase 2 con cuentas ficticias]].

- **Cuenta de cliente**: `/login`, `/registro` y `/cuenta` con Supabase
  Auth por email y contraseña. `/cuenta` reúne datos personales,
  direcciones de envío y facturación, historial de pedidos, reservas,
  descuento educativo y accesos a favoritos y tienda habitual.
- **Reservas por lista de espera**: las variantes `agotado` y
  `bajo-pedido` ya no se compran, se reservan. Cada unidad ocupa un
  puesto en la cola fijado por el momento del pago; la posición se
  calcula al vuelo, no se guarda. Exige sesión iniciada. Ver
  [[02-decisiones#D-030 — Reservas por orden de pago, sin guardar la posición]].
- **Descuento educativo**: el cliente sube un justificante a un bucket
  privado de Storage y queda pendiente; un agente lo aprueba o rechaza
  desde `/agente`. Validación manual a propósito.
- **Panel de agentes con auth**: `/agente/login`, guard de sesión,
  selector de estado (disponible/ocupado/ausente), asignación de
  conversaciones, ficha del visitante y pestaña de descuentos.
- **Dos clientes de Supabase** (`supabase` y `supabaseAgent`) para que la
  sesión de cliente y la de agente convivan en el mismo navegador. Ver
  [[02-decisiones#D-028 — Dos clientes de Supabase, uno por rol]].
- **El invitado no cambia**: sin sesión, el checkout sigue funcionando
  exactamente como antes, contra `sessionStorage`. El espejo en Supabase
  solo ocurre con sesión iniciada, y si falla no rompe la compra.

## Chat — identidad, valoración y archivo (2026-07-31)

Segunda mitad de la sesión de Fase 2, ya con el esquema aplicado:

- **El chat anónimo pide nombre y email** antes de empezar. El motivo es
  poder avisar por correo de la respuesta si la persona cierra la
  ventana; el aviso por email **todavía no existe**
  ([[04-problemas-pendientes#CHAT-002 — El aviso por email al visitante no existe]]),
  y el formulario lo dice para no prometerlo. Con sesión iniciada no se
  pregunta nada: se toman los datos de la cuenta.
- **El panel muestra el nombre, no el UUID.** `visitorDisplayName()`
  centraliza la regla (nombre con inicial en mayúscula → email → como
  último recurso `Visitante xxxxxxxx`) y la usan los cinco sitios que
  antes lo resolvían cada uno por su cuenta.
- **Cierre con valoración opcional.** Al cerrar, el agente elige entre
  cerrar sin más o pedir una valoración de 1 a 5 estrellas con
  observación. Si no la pide, el cliente solo ve que el chat se cerró.
- **Borrado permanente** de conversaciones archivadas, con confirmación
  previa. Reservado a agentes por RLS.
- **El cliente puede volver a escribir sin recargar** cuando su
  conversación se cierra
  ([[02-decisiones#D-038 — El visitante puede abrir otra conversación sin recargar]]).
- **Mensajes por lado**: cliente a la izquierda; agente a la derecha en
  el azul del nav; Bananito también a la derecha pero en azul pastel con
  texto oscuro, para distinguir el bot de la persona sin perder
  contraste.
- El perfil de cliente pasa a **menú lateral** con las secciones en el
  orden que pidió Oscar, cada dirección puede copiarse de la otra, y el
  checkout se rellena solo con los datos de la cuenta.

Pasos manuales que quedan por hacer en el panel de Supabase: dar de alta
los agentes ficticios que falten y desactivar "Confirm email".

## Aplicaciones — tienda nativa y panel instalable (2026-07-31)

Dos aplicaciones distintas, por públicos distintos. Ver
[[02-decisiones#D-039 — Dos aplicaciones distintas: la tienda nativa, el panel como PWA]].

**Panel de agentes como PWA — entregado y publicado.**

- `/agente` y `/agente/login` se instalan como aplicación desde el
  navegador (Dock en Mac y Windows, pantalla de inicio en móvil), con
  nombre e icono propios: negro con el plátano amarillo, para no
  confundirlo con la tienda.
- **Contador de conversaciones sin leer** en la pestaña del panel y sobre
  el icono del Dock (Badging API), y **notificación del sistema** al
  llegar un mensaje con la ventana de fondo. Cierra los dos puntos que la
  Fase 2 había aplazado. El permiso se pide con un clic del agente, nunca
  al cargar.
- Sin leer se calcula en el navegador del agente, no en la base de datos.
  Ver [[02-decisiones#D-041 — Las conversaciones sin leer se cuentan en el dispositivo]].
- **Service worker** generado en el build (`scripts/generate-sw.mjs`) con
  la lista de precache real, hashes incluidos. Navegación a red primero
  —una demostración nunca debe servir contenido viejo—, assets con hash a
  caché primero, y Supabase **siempre** a la red. Sin conexión la app
  sigue navegando el catálogo y avisa con una barra.
- El manifest **solo existe mientras se está en `/agente`**: se inyecta al
  entrar y se retira al salir, para que ninguna página pública de la
  tienda ofrezca instalar el panel interno. Cubierto por
  `tests/e2e/pwa.spec.ts`.

**Tienda como app nativa (Capacitor) — compilada y ejecutada en iOS y
Android (2026-08-01).**

- `capacitor.config.ts`, `npm run build:app` (mismo código, `--base=/`),
  proyectos `ios/` y `android/` generados, e iconos y pantallas de carga
  en todos los tamaños.
- **Interfaz propia de app** dentro del binario: barra de navegación
  inferior con cinco destinos y sin pie de página, y el chat dentro de
  "Contacta con nosotros" en el menú, sin burbuja flotante. La web no
  cambia. Ver [[02-decisiones#D-042 — La app nativa usa la navegación de una app, no la de la web]]
  y [[02-decisiones#D-043 — En la app, el chat vive en "Contacta con nosotros"]].
- **Android**: `app-debug.apk` (12 MB, `targetSdk` 36) instalado en un
  emulador Pixel arm64. Arranca, navega a rutas profundas y el chat se abre
  desde el menú, todo comprobado a mano.
- **iOS**: compilado con Xcode 26.6 contra el SDK 26.5 e instalado en un
  simulador de iPhone 17 Pro, donde arranca y se ve correctamente.
- Ver [[04-problemas-pendientes#APP-001 — La app nativa: compilada y ejecutada en iOS y Android]].
- Publicarla de verdad no depende del código: exige autorización de
  Banana, cuentas de desarrollador de pago y sustituir los datos
  demostrativos. Todo detallado en [[06-app-nativa]].

## Referencia actual

- Rama de producción: `main`.
- Último merge relevante: PR
  [#14](https://github.com/luis-lop-nas/pagina-banana/pull/14) —
  "Corrige portada, guía de preparación y accesibilidad",
  merge en `78c38894` el 2026-07-29. Rama en curso
  `chore/release-candidate-cleanup` para limpieza de release
  candidate y mantenimiento técnico (Node 24, `.tsbuildinfo`
  ignorado, `.nvmrc`).
- URL pública verificada el 2026-07-29:
  <https://luis-lop-nas.github.io/pagina-banana/> (HTTP 200).
- **Node.js 24** en ambos workflows (`e2e.yml` y `deploy.yml`)
  desde 2026-07-29. `.nvmrc` en la raíz para alinear el entorno
  local con CI.
- **Estado de dependencias (2026-07-29)**: `npm audit` reporta 2
  vulnerabilidades moderadas en `react-router@6.30.4` sin fix
  dentro de la línea 6.x (requerirían migración mayor a React
  Router 7, fuera de alcance). Ver
  [[04-problemas-pendientes#SEG-001 — Avisos de seguridad en React Router]].
- **axe** cubre 8 rutas más la guía interactiva, con `color-contrast`
  y `region` activos y sin excepciones globales.
- Artefacto `tsconfig.tsbuildinfo` retirado del repositorio;
  `*.tsbuildinfo` en `.gitignore`.
- Ya existían dos carpetas locales no versionadas: `.agents/` y
  `.obsidian/`. `.agents/` replica los skills versionados en
  `.claude/skills/` y se incorpora al repositorio como guía de trabajo
  para agentes. `.obsidian/` permanece como configuración local ignorada.

## Qué funciona hoy

- Navegación cliente con React Router y página 404.
- Home con campaña, bento, categorías, lanzamientos, ofertas, servicios,
  tiendas, FAQ y newsletter de demostración.
- La portada muestra reseñas demostrativas visibles intencionadamente para
  enseñar el diseño; están claramente etiquetadas como contenido de
  demostración y se sustituirán por reseñas reales cuando Banana Computer las
  autorice.
- Catálogo desarrollado para cinco familias, con **21 modelos** totales
  contados sobre `src/data/products.ts`: iPhone (4: 17 Pro Max, 17 Pro,
  Air, 17), Mac (8: MacBook Neo, MacBook Air M4, MacBook Air M5,
  MacBook Pro M4, MacBook Pro M5, iMac 24" M4, Mac Studio, Mac mini M4),
  iPad (4: Pro, Air, mini, A16), Apple Watch (3: Ultra 3, Series 11,
  SE 3) y AirPods (2: Pro 3, Max). Accesorios no tiene catálogo propio:
  los cinco tiles de la home enlazan a `/buscar?q=<término>`.
- Cada modelo cuenta con variantes de color/capacidad, imágenes locales
  en WebP, precios y disponibilidad de ejemplo.
- Las familias iPhone y Mac presentan un selector horizontal de modelos y una
  zona de ofertas; cada modelo abre directamente su variante configurable.
- La categoría Mac incluye MacBook Neo, MacBook Air M4/M5, MacBook Pro M4/M5,
  iMac 24" M4, Mac Studio y Mac mini M4.
- Búsqueda sobre modelos, categorías, servicios y contenido de ayuda.
- Favoritos, comparador de hasta tres productos de la misma familia y carrito.
- Persistencia local en las claves `banana:cart`, `banana:fav` y
  `banana:compare` de `localStorage`.
- La ficha conserva color y capacidad en la URL. “Comprar” añade la variante y
  abre el checkout; “Añadir al carrito” la guarda sin abandonar la ficha.
- El seguro a todo riesgo se asocia a cada línea del carrito: no añade unidades,
  suma 8,99 € por unidad asegurada y se puede activar o retirar tanto en la
  tarjeta de cesta como en “Pago y extras”.
- Checkout de tres pasos con layout propio, una única cabecera simplificada y
  amarilla suave, sin navegación o footer comerciales.
- **Chat de Bananito** con mascota propia (silueta procesada desde imagen
  de Gemini), burbuja circular en azul del nav utilitario, panel con
  cabecera amarilla y patrón de plátanos en el fondo. Conectado a
  Supabase: los mensajes persisten y llegan en tiempo real al panel de
  agentes `/agente`. Cae al modo canned reply cuando no hay
  credenciales configuradas.
- **Panel de agentes** en `/agente`, **protegido con sesión** desde la
  Fase 2: exige cuenta de Supabase dada de alta en `agentes`. Layout
  full-screen con bandeja filtrable por estado (abiertas / archivadas),
  ventana de chat con el mismo fondo de plátanos que el widget web,
  ficha del visitante y pestaña de descuentos educativos. Suscripción
  realtime a `mensajes`, `conversaciones` y `visitantes` sin recargar.
- **Backend Supabase** en región EU (Postgres 17 estándar).
  Esquema versionado en `supabase/schema.sql`: `visitantes`,
  `conversaciones`, `mensajes`, `agentes`, `clientes`, `pedidos` y
  `reservas`, todas con RLS activa. Escribir como agente, asignarse
  conversaciones, aprobar descuentos y borrar exigen `auth.uid()`
  presente en `agentes`; la **lectura** de las tres tablas del chat
  sigue abierta al rol `anon` porque el widget del visitante no tiene
  login. Ver [[02-decisiones#D-023 — Backend en Supabase (Fase 1)]] y
  [[04-problemas-pendientes#CHAT-001 — /agente accesible por URL sin autenticación]].
- Las tarjetas de producto reservan las mismas áreas para imagen, nombre y
  descripción, de modo que mantienen una altura alineada dentro de cada rejilla.
- El carrusel de tiendas y el mega-menú de escritorio mantienen una altura fija
  al cambiar de contenido; el menú Mac muestra una imagen del destacado y
  ordena juntos los MacBook Air y los MacBook Pro.
- La ficha permite aumentar o quitar unidades de una variante ya añadida sin
  abandonar la página; cambiar capacidad conserva el color elegido.
- La interfaz utiliza un modo claro fijo. No hay selector de tema, no se
  guarda preferencia visual y `prefers-color-scheme` no cambia la apariencia
  — sólo se respeta `prefers-reduced-motion` en reveals y transiciones.
- La franja de modelos Mac usa fotografías oficiales de producto almacenadas
  localmente, centradas dentro de marcos de tamaño constante; su procedencia se
  registra en `public/img/products/SOURCES.md`.
- Las imágenes del MacBook Air M4/M5 muestran el portátil abierto (pantalla y
  teclado visibles) en los cuatro colores: Medianoche, Plata, Blanco estrella y
  Azul cielo.
- Las tarjetas del iMac 24" M4 usan el campo `imageBg` de cada color para que
  el contenedor de imagen adopte el mismo tono de fondo que la foto, eliminando
  el recuadro visible sobre el fondo neutro.
- La página de Mac incluye una sección "Catálogo completo" que muestra todos los
  modelos, incluidos Mac mini y Mac Studio, con acceso a compra directo.
- Directorio de cinco tiendas con direcciones y horarios contrastados
  con las fichas oficiales el 2026-07-26. Las tarjetas muestran un
  badge "Abierto ahora" en verde o "Cerrado" en rojo calculado en
  tiempo real con la hora de Canarias (`Atlantic/Canary`) mediante
  `isOpenNow` en `src/data/stores.ts`; debajo se muestra también el
  horario del día correspondiente. El mapa embebido usa el campo
  `mapQuery` de cada tienda para no depender del nombre visible, y
  no existe reserva de cita.
- El menú móvil mueve y confina el foco, cierra con Escape, devuelve el foco al
  disparador y bloquea/restaura el scroll de fondo.
- En móvil, los bloques del footer comienzan cerrados como acordeones; la
  newsletter mantiene controles de al menos 48 px y texto de 16 px.
- Motion para transiciones/reveals y reglas globales para reducir movimiento.

## Cambios recientes (2026-07-28)

- **Checkout blindado**: `/checkout/2` exige paso 1 válido y `/checkout/3`
  exige un pedido demostrativo real. El ID se genera únicamente al pulsar
  "Confirmar pedido"; abrir la URL directamente redirige a `/carrito` o
  `/iphone`. La confirmación sobrevive a recargas dentro de la sesión.
- **Nuevo `demoOrderRepository`** (`src/lib/demoOrderRepository.ts`):
  guarda pedidos en `sessionStorage` con ID, fecha, líneas, entrega, tienda,
  método de pago (demostrativo), totales, unidades aseguradas y `status:
  'demo'`. Preparado para reemplazarse por un servicio real más adelante.
- **Estado de checkout compartido** (`src/lib/checkoutState.tsx`): la
  selección de entrega y los datos del paso 1 viven en un `Context` con
  persistencia por sesión, evitando duplicar estado entre `CartPage` y
  `CheckoutPage`.
- **Accesorios enlazan a `/buscar?q=…`** en vez de a `/iphone`. Cinco tiles
  (fundas, MagSafe, correas, teclados, audio) reutilizan el buscador.
- **Afirmaciones comerciales centralizadas**
  (`src/data/commercialClaims.ts`) con `status: demo|verified|pending`,
  `source`, `verifiedAt` y `disclaimer`. La franja de confianza del home y
  otros bloques leen desde ahí.
- **Buscador sincronizado con la URL**: `SearchPage` usa un `useEffect` sobre
  el parámetro `q`, así el input siempre refleja el término actual (nuevas
  búsquedas desde la lupa del Header, adelante/atrás del navegador…).
- **Sugerencias del Header derivadas del catálogo**: se generan a partir de
  `families` + `modelsByFamily`; los modelos añadidos o retirados aparecen
  o desaparecen automáticamente sin tocar el Header.
- **Chat oculto en checkout**: `ChatBubble` devuelve `null` cuando el
  pathname empieza por `/checkout/`. El panel gana `aria-modal`,
  `aria-haspopup`, foco al botón de cerrar al abrir y retorno de foco al
  botón flotante al cerrar.
- **Suite E2E con Playwright**: `playwright.config.ts` + `tests/e2e/`
  (home, checkout, search) con 9 pruebas iniciales. Scripts
  `test:e2e`/`test:e2e:ui`/`test:e2e:headed` en `package.json`. Workflow
  `.github/workflows/e2e.yml` ejecuta build + install + tests en cada push
  y PR sobre `main` y sube el reporte HTML como artefacto si falla.

## Cambios recientes (rama `fix/checkout-hooks-docs-e2e`)

- **`CheckoutPage`: hooks siempre en el mismo orden.** Reordenado el
  componente para que todos los `useState`/`useEffect`/`useMemo` se
  ejecuten antes de cualquier retorno condicional. Las guardas de los
  pasos 1, 2 y 3 se mantienen y siguen bloqueando accesos indebidos; la
  confirmación sigue sobreviviendo a recargas.
- **`ChatBubble`: trampa de foco completa.** Al abrir, el foco entra en
  el botón "Cerrar"; Tab y Shift+Tab quedan confinados entre "Cerrar" y
  "Ir a soporte"; Escape cierra y devuelve el foco al botón flotante;
  el resto del documento se marca `inert` mientras el panel está
  abierto. El botón flotante usa "Ocultar chat" al estar abierto para
  no colisionar con el nombre accesible del botón interno de cierre.
- **Suite Playwright ampliada a 21 pruebas** (11 nuevas): entrega
  compartida entre carrito y checkout, seguro sin duplicar cantidad,
  color/capacidad con basename, Apple Watch tamaño y GPS/Cellular
  preservados, recarga de ruta profunda, ausencia de errores de hooks
  en consola durante navegación, y trampa de foco del chat con teclado.
  (En esa primera versión los tests de favoritos/comparador insertaban
  el estado en `localStorage`; se rehacen en la rama siguiente.)
- **README** con "PNGs oficiales" ⇒ "Imágenes oficiales optimizadas en
  WebP" y bloque explícito de reseñas / textos comerciales
  demostrativos; retirada la mención a `prefers-color-scheme` como
  cambio de tema.

## Cambios recientes (rama `fix/docs-and-real-e2e`)

- **Pruebas de favoritos y comparador rehechas por interacción real.**
  `tests/e2e/favorites-compare.spec.ts` ya no siembra `banana:fav` ni
  `banana:compare`. En su lugar navega a `/iphone`, pulsa el corazón
  del `ProductCard` de "iPhone 17 Pro" (`aria-pressed` cambia a
  `true`), va a `/favoritos`, verifica que aparece la tarjeta, la
  quita desde el mismo botón y comprueba el estado vacío. El
  comparador entra a `/iphone/17-pro`, marca dos checkboxes "Añadir a
  comparar" en el `ModelPage`, va a `/comparar`, comprueba que
  aparecen dos tarjetas del modelo y las elimina una a una con los
  botones "Quitar", quedando vacío el comparador.
- **README** actualizado con el número real de pruebas (21) y las
  suites reales, la aclaración de que el workflow instala Chromium
  (por eso el proyecto `mobile` usa Pixel 5) y la nota de que
  favoritos y comparador se prueban ahora recorriendo la interfaz.
- **`docs/00-estado-actual.md`** limpiado: se elimina la referencia a
  la PR #5 como versión desplegada, se separa el historial de
  despliegues del estado actual, se corrige el catálogo a 21 modelos
  reales contados desde `src/data/products.ts`, se describe el badge
  "Abierto ahora/Cerrado" con hora de Canarias y `mapQuery`, y se
  fija el modo claro sin `prefers-color-scheme`.
- **`docs/04-problemas-pendientes.md`**: QA-001 actualizado con el
  detalle de la nueva metodología (interacción real, sin `setItem`).
- **No se ha modificado ninguna lógica, cálculo, componente ni prueba
  relacionada con el seguro** (`insurancePrice`,
  `cartInsuranceTotal`, `setLineInsurance`, tarjetas de cesta y de
  checkout, resumen). La prueba
  "activar el seguro no cambia la cantidad…" se conserva intacta.

## Qué no existe

- Pago real: no hay pasarela ni cargo. El "pago" que fija el puesto en
  una lista de espera es igual de demostrativo que el resto del checkout.
- Stock real: la disponibilidad del catálogo es fija y escrita a mano, no
  se consulta ningún inventario. Una reserva no descuenta unidades ni
  cambia el estado de la variante para nadie más.
- Pedidos reales, emails, cupones, newsletter, formulario de contacto,
  financiación o Plan Renove reales.
- Clientes y agentes reales: las cuentas son ficticias (D-027).
- Aviso al cliente cuando su descuento educativo se resuelve o cuando le
  toca el turno en una reserva: el estado cambia en la base de datos,
  pero no se le notifica por ningún canal.
- Catálogo desarrollado para accesorios (siguen enlazando al buscador con
  un término que puede no tener resultados aún).
- Tests unitarios ni lint automáticos (solo E2E con Playwright).

## Stack efectivo

Las versiones instaladas desde `package-lock.json` durante la auditoría fueron:

| Pieza | Versión |
| --- | --- |
| React / React DOM | 18.3.1 |
| React Router DOM | 6.30.4 |
| Motion | 11.18.2 |
| Vite | 6.4.3 |
| TypeScript | 5.9.3 |
| Tailwind CSS / plugin de Vite | 4.3.3 |

El workflow de GitHub Actions usa Node 20, ejecuta `npm ci` y `npm run build`, y
publica `dist/` en GitHub Pages en cada push a `main`.

### Historial de despliegues verificados

> Los párrafos siguientes describen versiones antiguas del prototipo
> y **no representan el estado actual**. Se conservan como bitácora.
> El estado vigente está descrito en "Referencia actual" al principio
> del documento.

El despliegue de la PR #1 finalizó correctamente el 2026-07-26 en el workflow
[`30206642599`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30206642599).

El despliegue de la PR #4 finalizó correctamente el 2026-07-26 en el workflow
[`30211613240`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30211613240).
La URL pública devolvió HTTP 200, cargó los recursos desde
`/pagina-banana/assets/` y mostró el bloque neutro de opiniones que existía en
esa versión antigua (hoy la portada muestra reseñas demostrativas visibles a
propósito).

El despliegue de la PR #5 finalizó correctamente el 2026-07-26 en el workflow
[`30214178171`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30214178171).
La versión pública de aquel momento conservaba el tema oscuro tras navegar
(la interfaz **actual** utiliza un modo claro fijo), mantuvo el fondo negro
continuo de la campaña y cargó las ocho fotografías Mac centradas.

El despliegue de la PR #2 finalizó correctamente en el workflow
[`30208520075`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30208520075).
La versión pública abrió `512gb-naranja` desde el configurador, conservó el
`basename` y mostró el seguro como casilla.

## Verificación realizada (histórico por rama)

> Estos bloques recogen verificaciones locales anteriores realizadas en
> ramas ya fusionadas. Se conservan como bitácora y **no describen el
> estado actual**. La verificación vigente se resume en "Referencia
> actual" y en la sección "Cambios recientes".

El 2026-07-26, en la rama `fix/product-variant-flow`:

- `npm run build`: correcto; 420 módulos transformados.
- Recorrido manual correcto desde modelo hasta variante, carrito y “Pago y
  extras”.
- La variante `512gb-naranja` conserva `/pagina-banana/` en la URL al cambiar
  de color o capacidad.
- Con seguro seleccionado, el carrito mantiene una unidad, muestra 8,99 € y un
  total de 1.487,99 € para el iPhone 17 Pro 512GB de ejemplo.
- La casilla llega marcada al checkout y conserva el mismo importe.
- A 375 px no existe scroll horizontal y el control del seguro mide 62 px de
  alto.

El 2026-07-26, en la rama `fix/presentation-polish`:

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-polish`: correcto.
- `npm run build`: correcto; 420 módulos transformados.
- Salida principal: CSS `44.95 kB` (`8.55 kB` gzip) y JavaScript `401.15 kB`
  (`121.86 kB` gzip).
- No existen scripts de test ni lint.
- Comprobación manual correcta a 375, 768, 1024 y 1440 px, sin scroll
  horizontal.
- Comprobados portada, newsletter, menú móvil con teclado, footer, tiendas,
  carrito y los tres pasos del checkout.
- El menú cierra con Escape, conserva el foco dentro mientras está abierto y lo
  devuelve al botón disparador.
- Checkout mantiene una sola cabecera y no renderiza el footer comercial.
- `npm audit`: dos vulnerabilidades moderadas, ambas en la cadena de
  `react-router-dom@6.30.4`; hay corrección disponible. Véase
  [[04-problemas-pendientes#SEG-001 — Avisos de seguridad en React Router]].

El 2026-07-26, en la rama `feature/catalog-and-purchase-flow`:

- `npm run build`: correcto; 421 módulos transformados.
- Recorrido manual correcto desde las portadas de iPhone y Mac hasta una
  variante, cesta y “Pago y extras”.
- Verificados los dos destinos de compra: checkout inmediato y añadido sin
  abandonar la ficha.
- El seguro se comprobó por línea de producto en ficha, cesta, resumen y
  checkout.
- Comprobación responsive a 375, 768, 1024 y 1440 px sin scroll horizontal.
- El acceso al chat abre un aviso de disponibilidad futura, cierra con Escape y
  devuelve el foco a su botón.
- La PR #3 se fusionó en `main`; el workflow
  [`30210351355`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30210351355)
  compiló y desplegó correctamente.
- La URL pública mostró el catálogo Mac, la ruta profunda de MacBook Neo, las
  dos acciones de compra, el seguro por producto, la cabecera amarilla suave y
  el globo del chat.

El 2026-07-26, en la rama `fix/layout-consistency`:

- `npm run build`: correcto; 421 módulos transformados.
- La tarjeta de tiendas midió 340 px antes y después de cambiar entre Banana
  Castillo y Banana La Laguna.
- Al cambiar MacBook Neo de `8 GB · 256 GB` a `16 GB · 512 GB`, el color
  Cítrico y el sufijo `-citrico` de la URL se conservaron.
- Revisado el modo oscuro del dispositivo en portada y ficha: contraste correcto
  en superficies, texto, tarjetas, cabecera amarilla y controles de compra.

El 2026-07-26, en la rama `fix/theme-and-mac-images`:

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-theme`: correcto.
- `npm run build`: correcto; 423 módulos transformados.
- Salida principal: CSS `49.93 kB` (`9.42 kB` gzip) y JavaScript `419.54 kB`
  (`126.08 kB` gzip).
- No existen scripts de test ni lint.
- El selector cambia de claro a oscuro y de oscuro a claro con un fundido de
  360 ms; la clase temporal se retira al terminar.
- La preferencia manual se conserva al recargar y, mientras no exista, se sigue
  el modo del dispositivo.
- La imagen principal de portada mantiene fondo negro en todo su ancho en ambos
  temas, sin franjas blancas laterales.
- Los ocho modelos Mac cargan fotografías locales procedentes de Apple Newsroom
  y sus centros visuales coinciden con los centros de sus marcos.

El 2026-07-26, en la rama `codex/system-theme-detection`:

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-system-theme`: correcto.
- `npm run build`: correcto; 421 módulos transformados.
- Salida principal: CSS `49.37 kB` (`9.33 kB` gzip) y JavaScript `417.44 kB`
  (`125.37 kB` gzip).
- No existen scripts de test ni lint.
- La detección queda implementada exclusivamente mediante
  `@media (prefers-color-scheme: dark)`.
- Eliminados el selector de tema, su proveedor React y la lectura/escritura de
  `banana:theme`.
- En modo claro del dispositivo, la portada usa superficie blanca y texto
  oscuro; no se renderiza ningún control de tema.
- El bundle de producción no contiene `data-theme`, `banana:theme` ni la
  etiqueta accesible del antiguo botón.

## Navegación de la documentación

- [[01-contexto-del-proyecto]]
- [[02-decisiones]]
- [[03-roadmap]]
- [[04-problemas-pendientes]]
- [[05-registro-de-cambios]]
