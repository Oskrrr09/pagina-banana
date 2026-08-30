---
tipo: estado
actualizado: 2026-08-23
---

# Estado actual

> [!summary]
> Prototipo SPA navegable y compilable de una tienda Apple para Banana Computer.
> La experiencia cubre catálogo, búsqueda, favoritos, comparación, carrito,
> checkout simulado, servicios, Plan Renove, tiendas, soporte y **chat en
> tiempo real con Supabase + panel de agentes** (Fase 1 desplegada el
> 2026-07-30). No hay integración comercial real ni motor de pago.

## Foto de `main` (2026-08-23)

> [!info] Cómo leer este documento
> **Foto del producto hoy**: esta sección, «Referencia actual», «Qué funciona
> hoy», «Qué no existe» y «Stack efectivo». Describen `main` tal y como está, no
> cómo llegó a estarlo.
>
> **Archivo histórico**, con su fecha en el título y que **no debe leerse como
> presente**: «Auditoría de seguridad», «Fase 2», «Chat», «Aplicaciones», los
> tres bloques de «Cambios recientes», «Historial de despliegues» y
> «Verificación realizada». Se conservan porque explican cómo se llegó aquí.
>
> La historia completa —qué PR trajo cada cosa— vive en
> [[05-registro-de-cambios]]; el porqué, en [[02-decisiones]].

| | |
| --- | --- |
| `main` = `origin/main` | `e04f0e6f681e30b6fb493f6f312a0d61bbbb7dde` |
| Último merge | **PR #74** — Tienda nativa v2 |
| URL pública | <https://oskrrr09.github.io/pagina-banana/> |
| `main` protegida | sí, ruleset sin bypass. Ver [[02-decisiones#D-063]] |
| Node en CI y `.nvmrc` | **24** |

### Dos productos, un repositorio

La misma SPA se sirve como **web** y como **aplicación nativa** iOS/Android
mediante Capacitor. La rama que decide es `isNativeApp`, que lee
`window.Capacitor`. No hay dos bases de código: hay dos armazones.

- **Web** — monta `Header` y el pie comercial. No lleva barra de pestañas ni
  control «Volver».
- **Nativa** — monta `AppTopBar` y `AppTabBar`. El área desplazable es
  `#contenido`, no el documento.

### Las cuatro pestañas de la app

`Inicio · Tienda · Compras · Cuenta` ([[02-decisiones#D-068]]). El rótulo de la
tercera es «Compras»; su ruta sigue siendo `/mis-productos`
([[02-decisiones#D-084]]).

- **Inicio** (`/`) abre por **lo que requiere atención**: saludo breve, avisos,
  el buscador de producto, lo que se estaba mirando y un teaser de cuatro
  ofertas. Ver [[02-decisiones#D-076]].
- **Tienda** (`/tienda`) es **la puerta al catálogo**: «Explorar» lleva a las
  seis familias desde el contenido, «Oportunidades» enseña **todas** las ofertas
  reales sin «Ver todas», y los servicios quedan en tres filas comerciales. No se
  personaliza: no lee sesión, historial ni tienda favorita. Ver
  [[02-decisiones#D-077]].
- **Compras** (`/mis-productos`) es superficie de cuenta orientada a la
  postventa, no un catálogo.
- **Cuenta** (`/cuenta`, `/cuenta/:apartado`) navega por **subrutas**: cada
  apartado es una dirección propia, con lista vertical de ajustes. Ver
  [[02-decisiones#D-075]].

### Armazón nativo

- **Cabecera amarilla Banana en todas las rutas**; barra de pestañas azul. Lo
  que cambia por contexto es la composición de la cabecera —buscador prominente
  y chips en comercial, búsqueda compacta en cliente—, no su color. Ver
  [[02-decisiones#D-078]].
- **«Volver»** en las pantallas secundarias: con historial propio retrocede de
  verdad; sin él usa un destino semántico con `replace`. Las raíces —`/`,
  `/tienda`, `/mis-productos`, `/cuenta` y `/login`— no lo llevan. Fuera del
  armazón, y por tanto sin control: `/checkout/:step`, `/agente` y
  `/agente/login`. Ver [[02-decisiones#D-073]].
- **El arranque no atraviesa ninguna superficie que no sea de marca** y muestra
  el logotipo hasta que la Home está pintada. Ver [[02-decisiones#D-079]].
- Las **tipografías viajan con la aplicación** vía `@fontsource`; no hay
  peticiones a Google Fonts. Ver [[02-decisiones#D-080]].

**Páginas con dos composiciones.** `Home` y `FamilyPage` montan estructuras
distintas según la plataforma:

```text
FamilyPage
  ├── WebFamilyPage   modelos → oportunidades (si las hay) → catálogo completo
  └── AppFamilyPage   encabezado compacto → catálogo (Fase A)
```

Datos, tipos, precios, ofertas, rutas y el estado de los filtros son los mismos;
la presentación no. La plataforma se decide una sola vez en la frontera de la
página. Ver [[02-decisiones#D-085]].

**La tarjeta de rejilla también está separada**: `ProductCardWeb` y
`ProductCardApp`, hoy visualmente idénticas, con el comportamiento compartido en
`useTarjetaDeProducto`. Cada superficie importa la suya, y `/buscar` —la única
página de catálogo que montan las dos plataformas— elige una sola vez.
`ProductCardCompact` es aparte: sólo la usan los carriles de la app.
**Quedan sin frontera `VariantPage` y `ModelPage`.**

**Fase C — C1 cerrada, C2 implementada y sin fusionar.** En la app, el carrito
ancla su «Finalizar compra» en una barra sobre la navegación, apoyada en
`ALTURA_TAB_BAR`, y «Entrega o recogida» pierde la tarjeta que envolvía a otras
dos. `CartPage` sigue siendo una sola página compartida y la web conserva su
composición (D-089).

El **checkout** (C2) pierde en la app la tarjeta que envolvía el paso entero y
ancla su CTA a ancho útil en el borde inferior. Para poder anclarlo sin heredar
el defecto de WKWebView, el checkout adopta el **modelo de scroll** del armazón
nativo —raíz a `100dvh` y un único contenedor que se desplaza— pero **sigue
fuera del armazón general**, con su cabecera y su marca propia
`data-checkout-shell` (D-090). `CheckoutPage` sigue siendo una sola página
compartida.

**C2 está pendiente de validación física en iPhone; hasta que se valide y se
fusione, la Fase C no está cerrada.**

**Fase B completa (B1 + B2).** La **ficha** nativa también respira: la galería
pierde el marco y toma el radio del sistema, el favorito deja de separar el
nombre del precio —se compacta a icono de 44 px— y los accesorios sugeridos
reutilizan la tarjeta del catálogo. `VariantPage` **sigue siendo una sola página
compartida**: divergen tres nodos, no la página (D-087). `ModelPage`, fuera.

**Fase B iniciada (B1).** La tarjeta del catálogo **nativo** ya no repite marcos:
una sola superficie —la imagen—, nombre y precio juntos debajo, y favorito y
comparar como iconos encima de la foto. Medido a 320 px: la tarjeta pasa de 510 a
281 y **el precio entra en el primer viewport por primera vez**. **La web no
cambia** (D-086). **B2 —la ficha— no ha empezado.**

**Deuda conocida del armazón**: los chips de familia de `AppTopBar` ocupan 474 px,
de modo que a 320 px sólo se ven cuatro de los seis y miden 32 px de alto. Tienda
la rodea con «Explorar»; no está resuelta.

### Catálogo

**23 modelos** en cinco familias desarrolladas, contados sobre
`src/data/products/`:

| Familia | Modelos |
| --- | --- |
| iPhone | 4 — 17 Pro Max, 17 Pro, Air, 17 |
| Mac | 8 — MacBook Neo, Air M4, Air M5, Pro M4, Pro M5, iMac 24" M4, Mac Studio, Mac mini M4 |
| iPad | 4 — Pro, Air, mini, A16 |
| Apple Watch | 3 — Ultra 3, Series 11, SE 3 |
| AirPods | 4 — Pro 3, 4 con cancelación, 4, Max |

**Accesorios** es la sexta familia de navegación y tiene catálogo y fichas
propias bajo `/accesorios`, pero **no aporta modelos a `allModels`**. De los 23,
seis están en oferta hoy —dos iPhone y cuatro Mac—; esa cifra la derivan las
pruebas del propio catálogo, no está escrita en ningún sitio.

### Pruebas y CI

Verificado en la ejecución posterior a la PR #74 (`32638338391`, nº 144,
intento 1, `push` sobre `main` en el SHA de arriba), **verde en los cinco
trabajos**:

| | |
| --- | --- |
| E2E | **503 totales · 502 aprobadas · 1 omitida esperada** · 0 fallos, 0 reintentos, 0 inestables |
| Unitarias | **358/358** en 23 ficheros |
| Panel de agentes | **24/24** |
| Preferencias | **37/37** |
| Supabase local | 36 + 71 + 5 |
| ESLint | **0 errores**, 25 avisos |
| GitHub Pages | desplegado sobre el merge SHA |

La omitida esperada es `tests/e2e/pwa.spec.ts:109`, el caso exclusivo de
desarrollo. La suite completa corre en Chromium y móvil; cinco flujos críticos
pasan además como *smoke* en Firefox, WebKit y Safari móvil.

**Criterio de calidad vigente**: una prueba debe demostrarse capaz de fallar, y
la forma de demostrarlo es la contraprueba. Ver [[02-decisiones#D-081]].

### Cuentas, compra y chat

- El **checkout no exige sesión**. Una compra hecha sin cuenta se guarda en
  `banana:pending-guest-orders` y se escribe en `pedidos` en cuanto aparece una
  cuenta permanente. Ver [[02-decisiones#D-083]].
- El **pedido guarda la identidad del producto** —familia y modelo incluidos—,
  no sólo su nombre. Ver [[02-decisiones#D-067]].
- La **identidad del chat sin cuenta es efímera**: no sobrevive a un reinicio.
  Ver [[02-decisiones#D-082]].
- El **historial de vistos es del dispositivo**, no de la cuenta. Ver
  [[02-decisiones#D-064]].

## Auditoría de seguridad en curso (2026-08-02 a 2026-08-06)

Las PR [#33](https://github.com/Oskrrr09/pagina-banana/pull/33) y
[#34](https://github.com/Oskrrr09/pagina-banana/pull/34) cierran la lectura
anónima incondicional del chat y las escrituras directas sobre conversaciones,
mensajes, agentes, clientes y reservas. El visitante usa ahora una sesión
anónima firmada; propietario, autor, agente, estado y fechas sensibles los
deduce el servidor mediante RPC.

La fuente SQL se consolidó en `supabase/migrations/`, con la migración de
estado seguro, el cierre incremental de privacidad/Storage y —desde el
2026-08-05— los permisos de tabla explícitos. Una auditoría común por
firma PostgreSQL exacta se ejecuta tras instalación limpia, actualización desde
PR #33 y segunda aplicación idempotente. La suite local pasa con 159 pruebas
Vitest entre esquema y unitarias, además de 296 E2E aprobadas, una
omisión esperada del caso exclusivo de desarrollo y 6 E2E aisladas
del panel de agentes. `revisar_descuento_educativo()` rechaza también estados
`NULL` sin tocar la revisión.

La primera ejecución real contra Supabase local destapó que las migraciones no
concedían **ningún** permiso de tabla: se apoyaban en unas *default privileges*
que no alcanzan a las tablas que crean, así que RLS no llegaba a evaluarse y
`service_role` no podía dar de alta un agente. El arnés de PGlite lo ocultaba
porque se concedía esos permisos a sí mismo. Corregido y vigilado por
`tests/schema/permisos.test.ts`; ver
[[04-problemas-pendientes#SEG-GRANT-001 — Las migraciones no concedían ningún permiso de tabla]].

La CLI, configuración y workflow de Supabase local ya están versionados y no
usan secretos remotos. Las pruebas contra GoTrue, PostgREST y Storage reales
pasan en CI desde el 2026-08-05, junto con el cierre de sesión PWA y la
conversión de sesión anónima con confirmación de email.

**El 2026-08-06 las cuatro migraciones se aplicaron en el proyecto real.**
`supabase migration list` muestra los cuatro identificadores iguales en Local y
Remote, y `db push --dry-run` responde `Remote database is up to date`. Una
comprobación por API pública de sólo lectura confirma el efecto: el rol anónimo
pasó de leer **36 filas de `visitantes`** —con nombre, email y teléfono— a no
leer ninguna.

Queda publicar el frontend. Hasta que la PR #35 se fusione, GitHub Pages sirve
el frontend anterior, que escribe directamente en las tablas y ya no puede: **el
chat de la web pública no funciona ahora mismo**. El resto de la tienda sí,
porque no depende de Supabase. El detalle y el orden restante están en
[[08-predespliegue-supabase]].

## Fase 2 — cuentas, reservas y panel con auth (2026-07-31)

> [!check] Esquema de Fase 2 aplicado y verificado el 2026-07-31
> Oscar ejecutó el esquema que existía entonces. Se
> comprobó contra la base de datos real, vía la API REST, que existen las
> tablas y columnas nuevas, que las funciones responden, y que un
> anónimo **no** puede escribir como agente (`42501`), aprobar descuentos
> ni borrar conversaciones. El bucket de justificantes es privado. Ese estado
> es anterior a la migración segura de agosto, que aún no se ha aplicado. Ver
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
- **Archivo sin borrado físico.** Cerrar saca la conversación de la bandeja y
  conserva el historial. El esquema final retira el DELETE de la aplicación;
  un borrado administrativo requeriría `service_role` fuera del navegador.
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

Antes de aplicar la migración final hay que activar Anonymous sign-ins y
validarla en el proyecto dedicado descrito en `tests/rls/README.md`.

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
- `npm run test:pwa` valida el build real: control del service worker,
  manifest, precache, ruta profunda offline y ausencia de respuestas Supabase
  o rutas privadas en Cache Storage. El matching de assets usa el pathname de
  la caché versionada para que una ruta profunda funcione también sin red.
- El manifest **solo existe mientras se está en `/agente`**: se inyecta al
  entrar y se retira al salir, para que ninguna página pública de la
  tienda ofrezca instalar el panel interno. Cubierto por
  `tests/e2e/pwa.spec.ts`.

**Tienda como app nativa (Capacitor) — compilada y ejecutada en iOS y
Android (2026-08-01).**

- `capacitor.config.ts`, `npm run build:app` (mismo código, `--base=/`),
  proyectos `ios/` y `android/` generados, e iconos y pantallas de carga
  en todos los tamaños.
- **Interfaz propia de app** dentro del binario: arriba, un buscador con
  filtros rápidos por familia en vez de cabecera; abajo, barra de
  navegación con Inicio, Favoritos, Explorar, Carrito y Cuenta; sin pie de
  página; y el chat dentro de "Contacta con nosotros", sin burbuja
  flotante. La web no cambia. Ver [[02-decisiones#D-042 — La app nativa usa la navegación de una app, no la de la web]]
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

- Rama de producción: `main`, en
  `e04f0e6f681e30b6fb493f6f312a0d61bbbb7dde` (PR #74). Sin ramas de
  consolidación abiertas.
- Base multidioma a cinco idiomas; la afirmación de cobertura completa quedó
  retirada por I18N-001.
- **Repositorio**: `Oskrrr09/pagina-banana`. Transferido el 2026-08-07 desde
  `luis-lop-nas`; con la transferencia cambió la URL pública, porque GitHub
  Pages no redirige entre cuentas y la dirección anterior devuelve 404.
- URL pública: <https://oskrrr09.github.io/pagina-banana/>.
- **`main` está protegida** por el ruleset «Protección de main» (`20547777`):
  exige pull request y los cuatro checks de CI en verde, bloquea force push y
  borrado, y no admite bypass ni para el propietario. Ver
  [[02-decisiones#D-063]].
- **Node.js 24** en el workflow unificado `ci.yml`; `.nvmrc` alinea local y CI.
- **Estado de dependencias (actualizado el 2026-08-06)**: React Router se migró
  de 6.30.4 a 7.18.2 y se probó en cuatro motores. Esa versión cierra los dos
  avisos que motivaron la migración. `npm audit` informa **una**
  vulnerabilidad `high`, por el aviso del modo RSC (`GHSA-qwww-vcr4-c8h2`), que sólo alcanza a
  las APIs RSC inestables: esta SPA declarativa con `BrowserRouter` no tiene
  servidor de React Router, ni acciones RSC, ni React Server Components, así
  que el camino vulnerable no es aplicable. La versión corregida
  `react-router@8.3.0` **sí existe** desde el 2026-07-22 —lo que se quedó en
  7.18.2 es `react-router-dom`, retirado en la 8—, pero adoptarla exige Node
  ≥ 22.22.0, React/React DOM ≥ 19.2.7 y dejar de usar `react-router-dom`, con
  React 18 y Vite 6 en el proyecto. Va como tarea propia:
  [[03-roadmap#Migración a React Router 8]] y
  [[04-problemas-pendientes#SEG-001 — Avisos de seguridad en React Router]].
- La auditoría de secretos no encuentra claves privadas, `service_role`,
  JWT extensos ni ficheros de sesión versionados. `.env`, credenciales de
  firma y configuración privada nativa quedan ignorados; solo se versionan
  `.env.example` y `.env.test`, ambos sin secretos.
- El chat ya no recopila `user_agent`; el bucket educativo impone 5 MB y
  PDF/JPEG/PNG en servidor. Ver [[07-modelo-seguridad]].
- **axe** cubre 14 estados de ruta, la guía interactiva, el selector de
  modelos, el menú móvil y el chat, con `color-contrast` y `region` activos y
  sin excepciones globales. Un barrido adicional exige exactamente un
  `<main>` en 19 rutas públicas.
- **Navegadores**: la suite completa queda en Chromium; 5 flujos críticos
  pasan como smoke en Chromium, Firefox, WebKit de escritorio y Safari móvil
  (20/20). El móvil Chromium conserva sus recorridos específicos.
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
- Catálogo desarrollado para cinco familias, con **23 modelos** totales
  contados sobre `src/data/products/`. El desglose está en la tabla de «Foto de
  `main`». Accesorios tiene catálogo y fichas propias bajo `/accesorios` y
  `/accesorios/:slug`, pero no aporta modelos a `allModels`.
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
  Esquema final versionado en `supabase/migrations/`: `visitantes`,
  `conversaciones`, `mensajes`, `agentes`, `clientes`, `pedidos` y
  `reservas`, todas con RLS activa. Escribir como agente, asignarse
  conversaciones y aprobar descuentos exigen `auth.uid()` presente en
  `agentes`; el visitante solo ve las filas ligadas a su sesión anónima. No
  hay DELETE de conversaciones desde la aplicación. La migración segura
  **se aplicó en producción el 2026-08-06**; ver SEC-RLS-001 y
  [[08-predespliegue-supabase]].
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
- **Suite E2E con Playwright**: nació con 9 pruebas de home, checkout y
  búsqueda; hoy reúne 265 casos descubiertos (264 aprobados y 1 omitido en la
  ejecución del 2026-08-04). Los scripts viven en `package.json` y el workflow
  unificado `.github/workflows/ci.yml` ejecuta build + navegador + pruebas.

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
- Catálogo comercial real de accesorios: existe un catálogo demostrativo con
  fotografías y compatibilidad, pero no stock ni compra real.
- Validación autenticada contra Supabase real: el arnés existe, pero sigue sin
  proyecto dedicado y sus 27 casos se omiten.

## Stack efectivo

Las versiones instaladas desde `package-lock.json` durante la auditoría fueron:

| Pieza | Versión |
| --- | --- |
| React / React DOM | 18.3.1 |
| React Router DOM | 7.18.2 |
| Motion | 11.18.2 |
| Vite | 6.4.3 |
| TypeScript | 5.9.3 |
| Tailwind CSS / plugin de Vite | 4.3.3 |

El workflow unificado usa Node 24 y encadena Prettier, tipos, lint,
Vitest/esquema, build, E2E, RLS y Pages. Solo publica `dist/` en pushes a `main`, y debe
bloquear el despliegue si falta la validación RLS dedicada.

### Historial de despliegues verificados

> Los párrafos siguientes describen versiones antiguas del prototipo
> y **no representan el estado actual**. Se conservan como bitácora.
> El estado vigente está descrito en "Referencia actual" al principio
> del documento.

El despliegue de la PR #1 finalizó correctamente el 2026-07-26 en el workflow
[`30206642599`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30206642599).

El despliegue de la PR #4 finalizó correctamente el 2026-07-26 en el workflow
[`30211613240`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30211613240).
La URL pública devolvió HTTP 200, cargó los recursos desde
`/pagina-banana/assets/` y mostró el bloque neutro de opiniones que existía en
esa versión antigua (hoy la portada muestra reseñas demostrativas visibles a
propósito).

El despliegue de la PR #5 finalizó correctamente el 2026-07-26 en el workflow
[`30214178171`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30214178171).
La versión pública de aquel momento conservaba el tema oscuro tras navegar
(la interfaz **actual** utiliza un modo claro fijo), mantuvo el fondo negro
continuo de la campaña y cargó las ocho fotografías Mac centradas.

El despliegue de la PR #2 finalizó correctamente en el workflow
[`30208520075`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30208520075).
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
  [`30210351355`](https://github.com/Oskrrr09/pagina-banana/actions/runs/30210351355)
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
