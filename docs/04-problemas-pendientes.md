---
tipo: problemas
actualizado: 2026-08-04
---

# Problemas pendientes

Todos los elementos siguientes se observaron directamente en el estado auditado
del repositorio. Los cerrados conservan la evidencia histórica; los abiertos
forman el backlog verificable.

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

## CHAT-UI-001 — Chat flotante visible en el checkout

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
  - Newsletter y formulario de soporte impiden el envío; no existe proveedor
    de correo ni sistema de tickets.
  - Pago, financiación, envío y cupones siguen siendo simulaciones claramente
    etiquetadas; no llaman a servicios comerciales reales.
  - Los avisos de reposición son locales y demostrativos, no suscripciones
    persistentes de una cuenta.
  - El chat sí usa Supabase cuando está configurado, pero cae a una respuesta
    local de demostración si no lo está y aún no envía el aviso por email de
    CHAT-002.
- Evolución 2026-07-28: la confirmación de checkout ya genera un pedido en
  `demoOrderRepository` con ID/fecha/productos, sobrevive a recargas dentro
  de la sesión y no se crea al abrir la URL. Sigue sin ser un pedido real:
  aparece marcado como "Pedido de demostración" y no dispara emails ni pagos.

## QA-001 — Suite E2E con Playwright + accesibilidad axe

- Estado: **cerrado como infraestructura y en ampliación continua**. La
  ejecución completa del 2026-08-04 produjo 264 aprobadas y una omitida
  deliberadamente porque solo aplica al servidor de desarrollo.
- Evidencia: 22 especificaciones en `tests/e2e/` cubren escritorio y móvil,
  catálogo, cuentas, app nativa, asistente, checkout, comparación, búsqueda,
  PWA, i18n, secretos y accesibilidad.
- `color-contrast` y `region` se ejecutan **sin excepciones
  globales** desde 2026-07-29.
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
- CI: `.github/workflows/ci.yml` encadena calidad, build y Playwright en cada
  push/PR sobre `main`. La suite completa corre en Chromium; cinco flujos
  críticos corren en Firefox, WebKit de escritorio y Safari móvil, y el
  proyecto Pixel 5 conserva los recorridos móviles específicos.
- Cobertura axe ampliada el 2026-07-30 al detalle de tienda
  (`/tiendas/castillo`, representativa de `/tiendas/:slug`). No queda
  pendiente ninguna ruta principal sin comprobación axe.
- `tests/e2e/chat.spec.ts` reparado el 2026-07-30: el rediseño de
  "Chat de Bananito" (commits `7a73335`/`ad2c8c4`) cambió los
  `aria-label` del botón flotante, el botón de cerrar y el nombre del
  diálogo, y el panel pasó de un enlace "Ir a soporte" a un input +
  botón de enviar — el test seguía buscando las etiquetas y la
  estructura antiguas y llevaba fallando en CI desde entonces sin que
  se detectara (`docs: chat en tiempo real...`, run
  [`30573485862`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30573485862)).
  Reescrito para reflejar el diálogo actual.

## SEG-001 — Avisos de seguridad en React Router

- Estado: **mitigado; seguimiento upstream abierto**. Revisado el 2026-08-04
  con `npm audit`, `npm audit --omit=dev`, `npm ls` y la suite de navegador.
- Resuelto: `react-router-dom@7.18.2 → react-router@7.18.2` cierra los dos
  avisos de la línea 6.30.4 que motivaron este punto:
  - `GHSA-wrjc-x8rr-h8h6`: React Router — Open redirect via backslash
    en `<Link>` y `useNavigate` (bypass de CVE-2025-68470).
  - `GHSA-337j-9hxr-rhxg`: React Router — Arbitrary Constructor
    Injection via `deserializeErrors()` en la hidratación SSR.
- Defensa adicional: `safeRedirect` rechaza ahora cualquier barra invertida,
  además de protocolos y rutas `//`; siete casos unitarios fijan el contrato.
- Compatibilidad: se conserva `BrowserRouter basename={import.meta.env.BASE_URL}`.
  Veinte smoke tests pasan en Chromium, Firefox, WebKit y Safari móvil e
  incluyen inicio, cambio de idioma y navegación profunda.
- Riesgo residual upstream: el registro de npm publicó
  `GHSA-qwww-vcr4-c8h2` para el procesamiento de acciones del modo RSC entre
  7.12.0 y `<8.3.0`. El aviso sólo alcanza a las **APIs RSC inestables**. Esta
  aplicación es una SPA declarativa con `BrowserRouter`: no tiene servidor de
  React Router, ni acciones RSC, ni React Server Components, ni loaders ni
  actions. El camino vulnerable no es aplicable. npm agrega igualmente el aviso
  a `react-router-dom` y lo muestra como dos entradas `high`.
- Corregido el 2026-08-06: este documento afirmaba que la 8.3.0 «aún no está
  publicada». **Es falso.** `react-router@8.3.0` salió el 2026-07-22 y es la
  versión corregida. El error vino de mirar `react-router-dom`, que se queda en
  7.18.2 porque React Router 8 retira ese paquete.
- No se actualiza aquí: React Router 8 exige Node ≥ 22.22.0 y React/React DOM
  ≥ 19.2.7, y retira `react-router-dom`. El proyecto usa React 18, Vite 6 e
  importa desde `react-router-dom`. Es una migración con su propia suite, no un
  salto de versión; queda registrada en
  [[03-roadmap#Migración a React Router 8]].
- Bajar a 7.11.0 sigue descartado: reabre múltiples XSS, redirects y DoS ya
  corregidos. Se mantiene la última 7.x estable hasta la migración.

## CI-001 — Actions fuerza Node 24 por obsolescencia de Node 20

- Estado: **cerrado**. Los workflows actuales se han ejecutado con Node 24.
- Cambio aplicado: `node-version: 20` → `node-version: 24` en
  el workflow unificado `.github/workflows/ci.yml`.
  Añadido `.nvmrc` con `24` en la raíz para que el entorno local
  con nvm coincida con CI.
- Verificación: el workflow unificado de CI y Pages usa Node 24 de forma
  explícita y `.nvmrc` mantiene el entorno local alineado.

## ARTEFACTOS-001 — `tsconfig.tsbuildinfo` versionado

- Estado: **cerrado el 2026-07-29**.
- Evidencia previa: `tsconfig.tsbuildinfo` (caché incremental de
  TypeScript) estaba trackeado en el índice y aparecía en el diff
  de casi todas las ramas con cambios de código.
- Resolución: `git rm tsconfig.tsbuildinfo` y regla nueva
  `*.tsbuildinfo` en `.gitignore`. El archivo se regenera
  localmente con `tsc -b` en el paso `npm run build` y ya no
  ensucia Git. No se ha desactivado el modo `incremental` de
  TypeScript.
- Comprobación: `git ls-files | grep -E '\.tsbuildinfo$'` → vacío;
  `git check-ignore -v tsconfig.tsbuildinfo` → apunta a la nueva
  regla del `.gitignore`.

## UX-BANANA-001 — Hallazgos de la auditoría de la web oficial

- Estado: informativo, sin implementación pendiente en esta iteración.
- Origen: [[auditorias/auditoria-web-oficial-banana]] (2026-07-28).
- Motivo: la auditoría se realizó sólo con lectura, sin modificar el
  prototipo. Las propuestas quedan como backlog en el §6 del roadmap.
- Notas:
  - No se implementa nada relacionado con el seguro.
  - No se propone tasador propio ni sistema de citas.
  - La cuenta de prueba y las capturas privadas viven en
    `audit-private/` y `playwright/.auth/`, ambas ignoradas por Git.

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

## ENTORNO-002 — Caché npm propiedad de root

- Estado: pendiente en la máquina local de Oscar.
- Impacto: bajo (rompe `npm install` global sin `--cache` alternativa).
- Evidencia: `stat -f "%Su:%Sg" ~/.npm` devuelve `root:staff`. Un
  `sudo npm ...` antiguo dejó la caché con dueño incorrecto. También
  bloquea el auto-update de Claude Code cuando está instalado por npm.
- Resolución sugerida (ejecutar por el usuario):
  ```
  sudo chown -R $(whoami):staff ~/.npm
  ```
- Workaround temporal: `npm install --cache /tmp/npm-cache-osk ...`.

## CHAT-SEC-001 — Acceso anónimo incondicional a los datos del chat

- Estado en código: **cerrado el 2026-08-02**. `/agente` ya exigía una
  cuenta dada de alta, pero todavía quedaba lectura `anon` incondicional.
  La migración final da al visitante una sesión anónima firmada y relaciona
  sus filas con `auth.uid()`; ya no existe `using (true)` ni escritura directa
  en conversaciones o mensajes.
- Estado desplegado: **pendiente**. La migración no se ha aplicado y las PR
  #33/#34 siguen fuera de `main`. Ver SEC-RLS-001.

## CHAT-SEC-001-HIST — Estado anterior de CHAT-SEC-001 (Fase 1)

- Estado: histórico, resuelto. Se conserva para no perder el contexto.
- Impacto: medio en producción (`https://luis-lop-nas.github.io/pagina-banana/agente`).
- Evidencia: `src/pages/AgentPage.tsx` no protege la ruta; las políticas
  RLS en `supabase/schema.sql` permiten a `anon` leer y escribir en las
  tres tablas.
- Riesgo: cualquiera que descubra la URL puede leer conversaciones de
  visitantes y responder como agente. En Fase 1 el proyecto es un
  prototipo interno desconocido por Banana; el riesgo se acepta con
  vigilancia.
- Resolución planificada: ver
  [[03-roadmap#7. Chat de Bananito — Fase 2 y siguientes]].
- Mitigación intermedia: añadido `Disallow: /pagina-banana/agente` a
  `public/robots.txt` el 2026-07-30. No protege frente a quien ya
  tiene el enlace directo; sólo evita indexación y enlazado desde
  buscadores. La protección real sigue pendiente de Fase 2 (auth).

## QA-002 — Las pruebas E2E escribían en el Supabase real

- Estado: **cerrado el 2026-07-31**.
- Evidencia: ejecutar `npx playwright test` en local levantaba Vite con
  `.env.local`, así que `supabaseEnabled` era true y las pruebas del chat
  creaban visitantes y conversaciones de mentira ("Elena R.") en la base
  de datos de verdad del proyecto, mezclados con los reales. Se detectó
  al revisar por qué el panel mostraba visitantes sin nombre.
- Resolución: el `webServer` de `playwright.config.ts` pasa
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` vacías por `env`. Vite da
  máxima prioridad a las variables ya presentes en el entorno, así que un
  `.env.local` con credenciales no puede volver a colarse. Se añade
  también `.env.test` (versionado, sin secretos) para dejar constancia.
- Comprobación: contando filas de `visitantes` antes y después de la
  suite completa — 34 → 34.
- Nota: quedan en la base de datos las filas creadas antes del arreglo
  (nombre "Elena R.", email `elena@example.test`). Se pueden borrar sin
  consecuencias.

## CHAT-002 — El aviso por email al visitante no existe

- Estado: **abierto**. Es la razón por la que se pide el email, así que
  conviene no perderlo de vista.
- Evidencia: el chat pide nombre y email a quien escribe sin cuenta
  (ver [[02-decisiones#D-035 — El chat anónimo pide nombre y email antes de empezar]])
  y los guarda en `visitantes`, pero **no se envía ningún correo**. El
  formulario lo advierte para no prometer algo que no ocurre.
- Qué haría falta: un proveedor de email (Resend, Postmark, el SMTP de
  Supabase…) y una Edge Function disparada al insertarse un mensaje de
  agente en una conversación cuyo visitante no está mirando. Además,
  decidir qué cuenta lo firma y añadir baja de la notificación.

## CUENTAS-004 — Segunda tanda de SQL pendiente de ejecutar

- Estado: **cerrado el 2026-07-31**. Oscar ejecutó el archivo completo.
  Verificado contra la base de datos real por la API REST:
  `visitantes.cliente_id`, `visitantes.telefono`, `mensajes.agente_id` y
  las cinco columnas de valoración de `conversaciones` existen y
  responden; la función `enviar_valoracion()` está publicada y rechaza
  con su mensaje propio ("No hay ninguna valoración pendiente para esta
  conversación") cuando no procede; un anónimo sigue sin poder escribir
  como agente (`42501`) ni borrar conversaciones.
- Comprobación de punta a punta: una conversación real del panel
  (`2f2ebf4e`) quedó con `nombre`, `email`, `telefono` y `cliente_id`
  rellenos, que es exactamente lo que la bandeja necesita para mostrar
  el nombre en vez del UUID.
- Historial de lo que faltaba por aplicar en ese momento:
  - `visitantes.cliente_id` y `visitantes.telefono` — enlazan el chat con
    la cuenta del cliente, para que el agente vea nombre y teléfono en
    vez de un UUID.
  - `mensajes.agente_id` — sin esto no se puede saber qué agente escribió
    cada respuesta cuando hay más de uno.
  - `visitantes` publicada en `supabase_realtime`, para que la bandeja
    refresque el nombre en cuanto el visitante se identifica.
  - Columnas de valoración en `conversaciones`
    (`valoracion_solicitada`, `valoracion_estrellas`,
    `valoracion_observacion`, `valoracion_at`, `cerrada_at`), la función
    `enviar_valoracion()` y la política de borrado para agentes.
- Nota de método: el archivo es idempotente, así que la forma de aplicar
  cambios posteriores es volver a ejecutarlo entero, no ir escribiendo
  `alter table` sueltos.
- Queda un resto **de datos, no de esquema**: el agente de la demo sigue
  llamándose "Ana (demo)". Se cambia con
  `update public.agentes set nombre = 'Oscar' where email = 'ana.demo@banana.example';`.
  No se puede verificar desde fuera porque la RLS oculta `agentes` al
  rol anónimo.

## CUENTAS-001 — El esquema SQL no se ha ejecutado todavía

- Estado: **cerrado el 2026-07-31**. Oscar ejecutó el script y se
  verificó por API que las tablas `agentes`, `clientes`, `pedidos` y
  `reservas` existen, que las funciones responden, que un anónimo no
  puede escribir como agente ni aprobar descuentos, y que el bucket de
  Storage es privado. Continúa en CUENTAS-004 para lo añadido después.
- Evidencia: `supabase/schema.sql` incluye las tablas `agentes`,
  `clientes`, `pedidos` y `reservas`, el bucket de Storage y las nuevas
  políticas, pero no hay Postgres ni Docker en el entorno de desarrollo
  local, así que **el script no se ha llegado a ejecutar ni a validar
  contra una base de datos**. Está escrito y revisado a mano, nada más.
- Qué hace falta: pegar el archivo entero en el SQL Editor de Supabase y
  ejecutarlo, dar de alta 2-3 agentes ficticios siguiendo el comentario
  del propio archivo, y desactivar "Confirm email" en Authentication →
  Providers → Email.
- Riesgo: hasta entonces `/agente` no deja entrar a nadie (no existe la
  tabla `agentes`) y el registro de clientes fallará al crear la ficha.
- ⚠️ El script cambia la política de `mensajes` para exigir agente
  autenticado. Aplicarlo **antes** de desplegar esta versión dejaría el
  panel de agentes sin poder responder.

## SEG-GRANT-001 — Las migraciones no concedían ningún permiso de tabla

- Estado: **cerrado y verificado el 2026-08-05**. CI informa 27/27 en el
  trabajo `Integración Supabase local`.
- Evidencia: reproducción sobre PostgreSQL real (PGlite) imitando el proyecto
  de Supabase —roles creados, sin conceder nada a mano— tras aplicar las
  migraciones:
  `authenticated → insert en public.clientes: permission denied for table clientes`,
  `service_role → insert en public.agentes: permission denied for table agentes`,
  y las siete tablas sin un solo permiso concedido.
- Causa: las migraciones se apoyaban en las *default privileges* de Supabase,
  que las fijó otro rol antes y no alcanzan a las tablas que ellas crean. RLS
  filtra filas después del permiso de tabla, así que ninguna política llegaba a
  evaluarse. `service_role` salta RLS pero no los GRANT.
- Por qué no se vio antes: el síntoma engañaba. Las pruebas negativas seguían
  pasando —un permiso denegado también es un error—, así que sólo caían los
  recorridos legítimos: 10 aprobadas y 17 fallidas. Y `tests/schema/andamio.ts`
  se concedía los permisos a sí mismo antes de aplicar las migraciones, con lo
  que el arnés de esquema respondía en verde.
- Resolución: `supabase/migrations/20260805000300_permisos_de_tabla.sql`
  concede el mínimo que refleja cada política; el andamio deja de conceder nada
  sobre `public`; `tests/schema/permisos.test.ts` vigila el cuadro completo,
  incluido lo que no debe poder hacerse. Ver [[02-decisiones#D-056]] y
  [[02-decisiones#D-057]].
- Además, `clienteRegistrado()` en `tests/rls/politicas.spec.ts` insertaba la
  ficha sin mirar el error: el fallo se tragaba allí y reaparecía disfrazado en
  cada prueba que la necesita. Ahora se comprueba donde ocurre.
- Verificado: la primera ejecución con la migración pasó de 10/27 a 26/27. El
  caso restante, «un cliente no puede leer los pedidos de otro», resultó ser un
  defecto distinto que el fallo anterior tapaba: el pedido de prueba no traía
  `delivery` ni `payment_method`, que son NOT NULL sin valor por defecto, y
  tampoco se miraba el error del insert. Corregido, CI informa 27/27.

## QA-CHAT-003 — El diálogo del chat no se desmontaba al cerrar

- Estado: **cerrado el 2026-08-05**.
- Evidencia: dos fallos en CI, WebKit y Safari móvil, en «chat abre, recibe
  foco y cierra con Escape». Al cerrar, el panel quedaba con `opacity-0` y
  `pointer-events-none` pero seguía en el DOM anunciándose como
  `role="dialog" aria-modal="true"`.
- Causa: el desmontaje colgaba sólo de `onTransitionEnd`. Si el navegador no
  entrega el `requestAnimationFrame` que activa la clase visible —ventana
  ocluida o *throttled*, lo normal en CI—, al cerrar no hay cambio de estilo,
  ni transición, ni evento. No es un fallo de WebKit: reproducido en Chromium
  anulando `requestAnimationFrame`.
- Resolución: un temporizador de la misma duración que la animación garantiza
  el desmontaje; `transitionend` sólo lo adelanta cuando llega.
- Regresión: `tests/e2e/chat.spec.ts` provoca la causa y exige que el diálogo
  salga del DOM, no que se vuelva transparente.

## SEC-RLS-001 — Falta validar y desplegar la migración segura

- Estado: **las 27 pruebas ya pasan en CI (2026-08-05)**. Queda el despliegue,
  que sigue siendo responsabilidad de una sesión con acceso a la demostración.
- Comprobado el 2026-08-05 en el trabajo `Integración Supabase local`: GoTrue,
  PostgREST y Storage reales, **27/27 aprobadas**, más el cierre de sesión PWA.
  Llegar ahí exigió conceder los permisos de tabla que faltaban; ver
  [[04-problemas-pendientes#SEG-GRANT-001 — Las migraciones no concedían ningún permiso de tabla]].
- Ya comprobado además: las pruebas de esquema sobre PostgreSQL/PGlite cubren
  instalación desde cero, actualización desde el estado desplegado, RLS, RPC
  y permisos, dentro de las 159 pruebas Vitest del proyecto.
- La auditoría clasifica cada función por firma exacta, detecta `PUBLIC` aunque
  `aclexplode` lo represente como `grantee = 0`, y se repite tras instalación,
  actualización e idempotencia. El verificador CI exige exactamente 27 casos.
- El job genera `rls.json` ejecutando Playwright directamente, conserva su
  código de salida y rechaza un archivo ausente, vacío, malformado o precedido
  por texto de `npm run`. La simulación local confirma que solo 27 aprobadas
  con código 0 producen salida cero.
- `revisar_descuento_educativo()` rechaza `NULL` y estados textuales no
  permitidos antes del `UPDATE`; PGlite comprueba que estado, nota, fecha y
  revisor no cambian tras ambos errores.
- Hecho el 2026-08-05: los 27 casos de `tests/rls/politicas.spec.ts` se
  ejecutan contra GoTrue, PostgREST y Storage reales en Supabase local. El
  arnés se actualizó el 2026-08-04 porque la versión anterior seguía usando
  INSERT directos que el esquema final ya no permite y no limpiaba los chats
  huérfanos creados durante la prueba.
- Infraestructura versionada el 2026-08-04: CLI 2.111.0, configuración local,
  seed sin credenciales, lanzador de pruebas y workflow reutilizable. CI ya no
  depende de `RLS_TEST_*` ni puede caer sobre la demostración.
- Bloqueo local: esta máquina sigue sin Docker, así que la suite no puede
  ejecutarse aquí. La ejecuta CI, que es donde se obtuvo el 27/27.
- Regla: nunca ejecutar esta suite contra la demostración. Crea y borra
  usuarios, objetos y filas a propósito.
- Cierre restante: activar Anonymous sign-ins en la demostración, aplicar las
  **tres** migraciones —la de permisos incluida, sin ella la web queda sin
  acceso a sus propias tablas—, desplegar `main` y verificar web + chat.

## QA-CUENTA-001 — Cerrar sesión devolvía al login en vez de a la portada

- Estado: **cerrado el 2026-08-05**.
- Evidencia: `tests/integration/pwa-auth.spec.ts` esperaba `/pagina-banana/`
  tras pulsar «Cerrar sesión» y recibía `/login?redirect=%2Fcuenta`.
- Causa: `signOut()` dejaba `session` a null mientras `/cuenta` seguía montada,
  así que el guardia de la propia página disparaba
  `<Navigate to="/login?redirect=%2Fcuenta">` y ganaba la carrera al
  `navigate('/')` posterior. Quien acababa de cerrar sesión aterrizaba en un
  formulario pidiéndole volver a entrar en la cuenta que acababa de dejar.
- Resolución: se sale de la página antes de cerrar la sesión, con `replace`
  para que el botón Atrás tampoco devuelva a `/cuenta`.
- Por qué no se había visto: esta prueba nunca llegaba a ejecutarse. Vive en el
  mismo trabajo que las RLS y el paso anterior fallaba antes.

## CUENTAS-003 — Favoritos y tienda favorita siguen fuera de la cuenta

- Estado: abierto, decisión consciente.
- Evidencia: `ProfilePage` muestra favoritos y tienda habitual, pero los
  lee de `localStorage` vía `useStore()`/`useStorePreference()`, no de
  la cuenta. Cambiar de navegador los pierde aunque haya sesión.
- Motivo: migrarlos a Supabase obliga a resolver la fusión entre lo que
  ya hay en el navegador y lo que haya en la cuenta al iniciar sesión,
  que no es trivial y no aporta a la demostración.
- La página lo dice explícitamente para no prometer algo que no hace.

## A11Y-002 — Foco perdido al abrir el chat si Supabase tarda en cargar

- Estado: cerrado el 2026-07-30.
- Evidencia: el efecto de foco inicial de `ChatBubble` enfocaba
  `inputRef` incondicionalmente al abrir el panel. Con credenciales de
  Supabase configuradas (como en producción, vía `deploy.yml`), el
  input queda `disabled` mientras `status === 'loading'`; enfocar un
  elemento deshabilitado no hace nada, así que el foco de teclado se
  quedaba fuera del diálogo hasta que el input se habilitaba, sin que
  nada lo recuperara.
- Resolución: el foco inicial va ahora al botón "Cerrar chat"
  (`closeRef`), que está disponible de inmediato independientemente
  del estado de carga.

## A11Y-003 — El aviso de "tienda favorita" robaba el foco a los diálogos abiertos

- Estado: detectado el 2026-07-30, **cerrado el 2026-08-01**.
- Impacto real, mayor de lo que se estimó al detectarlo: se anotó como
  "bajo/raro, requiere que ambos widgets coincidan en el tiempo". Ocurría
  lo bastante como para tumbar el CI de forma intermitente durante tres
  días (ver QA-003, más abajo).
- Evidencia: `FavoriteStorePrompt`
  (`src/components/layout/FavoriteStoreDialogs.tsx`) aparecía 800 ms
  después de montar `Layout` y enfocaba su propio botón de cerrar. Si en
  ese instante había un diálogo abierto —la guía de preparación, el chat de
  Bananito o cualquier `Modal`, los tres `aria-modal="true"`— le robaba el
  foco a algo que la persona estaba usando.
- Resolución: el aviso ya no se muestra mientras haya un
  `[role="dialog"][aria-modal="true"]` en el documento. No se descarta, se
  **reintenta**: en cuanto se cierra el diálogo, aparece. Sigue siendo
  `aria-modal="false"`, que es lo correcto para una notificación.
- Regresión cubierta en `tests/e2e/favorite-store.spec.ts`: con la guía
  abierta el aviso no aparece y la guía conserva el foco; al cerrarla, el
  aviso sale.

## APP-001 — La app nativa: compilada y ejecutada en iOS y Android

- Estado: **cerrado el 2026-08-01**.
- **Android**: JDK 21 y herramientas de línea de comandos del SDK por
  Homebrew, sin Android Studio y sin `sudo`. `./gradlew assembleDebug`
  produce `app-debug.apk` (12 MB, `com.bananacomputer.tienda`,
  `targetSdk` 36). Verificado en un emulador Pixel arm64 con Android 36:
  arranca, la tienda renderiza dentro del WebView, la navegación profunda
  funciona y el chat se abre desde el menú. Sin errores en `logcat`.
- **iOS**: Oscar instaló Xcode 26.6; el runtime del simulador se bajó
  aparte (`xcodebuild -downloadPlatform iOS`, 8,5 GB — Xcode 26 ya no lo
  incluye). `xcodebuild -scheme App -sdk iphonesimulator` compila, y la app
  instalada en un simulador de iPhone 17 Pro arranca y se ve bien.
- Hizo falta versionar el **esquema compartido** de Xcode: lo genera al
  abrir el proyecto pero lo deja en `xcuserdata/`, fuera de git, así que
  `xcodebuild -scheme App` fallaba y solo se podía compilar desde el GUI.
- **Dos fallos que solo aparecieron al ejecutarlo en un dispositivo**, no en
  el navegador ni en las pruebas: la cabecera quedaba bajo la Dynamic
  Island (faltaba `env(safe-area-inset-top)`) y el aviso de tienda favorita
  tapaba la barra de navegación inferior. Los dos arreglados y comprobados
  con capturas del simulador y del emulador.
- Lo que sigue pendiente **no es técnico**: autorización de Banana, cuentas
  de desarrollador de pago y datos reales en vez de demostrativos. Ver
  [[06-app-nativa]].

## PWA-001 — El service worker no lo cubren las pruebas E2E

- Estado: **cerrado el 2026-08-02 y reforzado el 2026-08-04**.
- Impacto: bajo.
- Evidencia: la suite corre contra el dev server de Vite, y ahí el
  service worker no se registra a propósito (`src/lib/pwa.ts` comprueba
  `import.meta.env.PROD`). `tests/e2e/pwa.spec.ts` cubre el manifest, los
  iconos, la inyección y limpieza de las etiquetas por ruta, y que en
  desarrollo **no** haya ningún registro —regresión deliberada, por lo
  ocurrido en [[04-problemas-pendientes#QA-002 — Las pruebas E2E escribían en el Supabase real]]—
  pero no el precache ni el arranque sin conexión.
- Resolución: `npm run test:pwa` compila sin backend, sirve `dist` con
  `vite preview` y comprueba de forma automática control, manifest, iconos,
  precache, arranque de `/agente/login` sin red y exclusión de Supabase y
  rutas privadas de Cache Storage. La prueba contraria se conserva y se omite
  contra build porque solo tiene sentido en desarrollo.
- Hallazgo de la nueva prueba: el HTML offline cargaba, pero JS/CSS intentaban
  ir a red desde una ruta profunda. `cacheFirst` resuelve ahora la entrada por
  pathname dentro de la caché versionada. Verificación local: 9 aprobadas y la
  prueba exclusiva de desarrollo omitida con motivo explícito.
- Cierre de sesión real: `tests/integration/pwa-auth.spec.ts` crea una cuenta
  ficticia en Supabase local, cierra sesión, corta red y exige que email y
  perfil no reaparezcan. Está integrada después de las 27 RLS; en esta máquina
  se descubre correctamente pero no se ha ejecutado por falta de Docker.

## QA-003 — La trampa de foco de la guía escapaba con Shift+Tab

- Estado: **cerrado el 2026-08-01**.
- Síntoma: `tests/e2e/device-preparation-guide.spec.ts` fallaba de forma
  intermitente en el runner de Linux, siempre en el bucle de **Shift+Tab**,
  y nunca en local. Falló en `687126a` y en `2503327` —este último tocaba
  solo documentación— y pasó en `2f79d9f`.
- **Primer diagnóstico, equivocado**: se atribuyó al diseño de la trampa de
  foco, que solo interceptaba los extremos y en medio dejaba tabular al
  navegador. Se reescribió para gobernar el recorrido completo (`2f79d9f`)
  y el fallo **volvió a aparecer** en el commit siguiente. Esa reescritura
  sigue siendo una mejora real de robustez, pero no era la causa.
- **Causa real**: el aviso de tienda favorita, es decir
  [[04-problemas-pendientes#A11Y-003 — El aviso de "tienda favorita" robaba el foco a los diálogos abiertos]],
  que llevaba abierto desde el 2026-07-30. Su temporizador de 800 ms caía,
  en el runner de Linux, dentro del recorrido de tabulación del test.
- **Lo que permitió verlo**: se cambió el test para que informase de **qué
  elemento** recibía el foco, en vez de un `true`/`false`. El primer fallo
  posterior lo dijo sin ambigüedad: `<button> Cerrar aviso de tienda
  favorita`. Sin ese dato el diagnóstico habría seguido siendo a ciegas.
- Resolución: se arregló A11Y-003 y, además, `openGuide` descarta el aviso,
  porque esa suite mide la guía y solo la guía.
- Validación: 220 en verde en local, incluida la suite completa con `CI=1`.
- Nota: el patrón de "interceptar solo los extremos" existe también en
  `src/components/ui/Modal.tsx` y en el chat. No se han tocado y no han
  dado fallos, pero comparten la fragilidad.

## UI-001 — La cabecera no usaba todo el ancho y el menú se solapaba

- Estado: **cerrado el 2026-08-01**.
- Síntoma tal como lo describió Oscar: al añadir el selector de idioma, el
  bloque de accesos "se juntó con los del centro del menú", y el selector
  "no está a la derecha del todo".
- Dos causas, y la segunda es la de fondo:
  1. El menú de dispositivos iba **absolutamente centrado**, así que no
     participaba del reparto de espacio: todo lo que creciera por la derecha
     se le echaba encima. Llegó a haber un **solape real de 9px**, medido.
  2. La barra estaba limitada a `max-w-7xl` (1280px) y centrada. En una
     pantalla ancha eso deja el selector al borde del **contenedor**, con una
     franja amarilla vacía a su derecha, mientras la barra utilitaria de
     arriba sí llegaba al borde de la ventana.
- Resolución (forma final, decidida con Oscar):
  - La barra usa **todo el ancho**, como la de arriba.
  - El logo lleva un margen izquierdo de **52px**, la mitad de sus 101px de
    ancho.
  - El menú vuelve a estar **centrado respecto a la ventana**, con desvío 0
    respecto al eje de la barra utilitaria.
  - Los accesos van **pegados entre sí** en su propio contenedor con
    `-space-x-2`. `gap-0` no bastaba: los botones miden 40px con un dibujo
    de 24 dentro, así que aun sin separación quedaban 20px de aire. Ahora
    quedan 12px entre dibujos y 49px hasta la bandera.
  - La única separación del grupo es la del selector de idioma, con su línea
    a media altura y el mismo aire a cada lado.
- Para que el centrado quepa a 1280px, los enlaces del menú van algo menos
  holgados en ese tramo y recuperan su holgura a partir de 1536px.
- **Lo medido**: 12px entre dibujos de los accesos, 49px del último al
  selector de idioma, y hueco entre el menú y los accesos de 57px a 1280px y
  167px a 1500px.
- Nota de método: medir las **cajas** de los botones despistaba, porque son
  bastante mayores que el dibujo que contienen. Lo que se ve —y lo que hay
  que medir— es la distancia entre los `svg`. Si
  alguna vez queda corto, la salida es quitar un acceso de la derecha —al
  comparador se llega igual desde la ficha y desde favoritos—, no volver a
  mover márgenes.
- Lección para la próxima: dos intentos previos fueron a base de mover
  márgenes y solo movieron el hueco de 43 a 51px, que no se aprecia. El
  problema era de estructura, y hasta que no se midieron las tres opciones no
  se vio cuál era.


## A11Y-004 — `/soporte` tiene dos `<main>` anidados

- Estado: **cerrado en código el 2026-08-04; pendiente de despliegue**.
- Impacto: bajo, pero es HTML inválido.
- Evidencia: `SupportPage` monta su propio `<main>` dentro del `<main
  id="contenido">` de `Layout`. Se vio al intentar seleccionar `main` desde
  una comprobación y obtener dos elementos.
- Riesgo: un lector de pantalla puede anunciar dos regiones principales.
  La suite de axe no lo detecta porque `landmark-no-duplicate-main` es una
  regla de buenas prácticas, no de WCAG, y la suite solo ejecuta las
  etiquetas `wcag2a`, `wcag2aa` y `wcag21a`.
- Resolución: `SupportPage` deja el único `<main>` al layout. Una regresión
  recorre 19 rutas públicas, exige exactamente una región principal y activa
  de forma explícita `landmark-no-duplicate-main`.
- Cierre relacionado: `Modal`, `MobileMenu`, la guía de preparación y el chat
  comparten aislamiento de fondo hasta `#root`; conservan cualquier `inert`
  previo y restauran foco, scroll y teclado al cerrar. El modal deja de fundir
  su contenido para no degradar temporalmente el contraste durante la entrada.
- Verificación: 19/19 casos de `accessibility.spec.ts` sobre build en Chromium,
  sin reglas axe desactivadas; TypeScript, build y 124/124 Vitest correctos.

## I18N-001 — La cobertura pública no estaba completa

- Estado: **en corrección desde el 2026-08-04**.
- Hallazgos cerrados: `/soporte` ya traduce búsqueda, CTAs y estado vacío; el
  selector de modelos traduce título, ayuda, búsqueda, vacío, badges, nombres
  accesibles y precio, y filtra por el nombre traducido visible.
- Panel: decisión explícita de mantenerlo en español con `lang="es"` por ruta.
- Regresión: 11 pruebas de idioma en Chromium, incluido el recorrido
  interactivo por los cinco idiomas y la restauración del idioma al salir del
  panel.
- Pendiente real: el barrido estático aún localiza literales públicos en
  `DevicePreparationGuide`, `ChatBubble` fuera de sus nombres accesibles,
  `SearchPage`, `ProfilePage`,
  `CartPage`, `CheckoutPage`, el comparador base y varios nombres accesibles
  genéricos. Hasta cerrarlos y recorrer todos los estados no se vuelve a usar
  la frase «traducción completa».

## SEG-CHAT-002 — El chat recopilaba un user-agent sin finalidad

- Estado: **cerrado en código el 2026-08-04; pendiente de despliegue**.
- Evidencia histórica: `chatSession.ts` enviaba `navigator.userAgent` y
  `abrir_conversacion()` lo persistía en cada ficha de visitante, aunque ni la
  tienda ni el panel lo mostraban o utilizaban.
- Resolución: el navegador envía `NULL`; la firma RPC queda compatible pero
  ignora el parámetro, y la segunda migración limpia los valores históricos.
- Regresión: `tests/schema/politicas.test.ts` llama deliberadamente con
  `jsdom` y exige que `user_agent` permanezca nulo.

## SEG-STORAGE-001 — Los límites del justificante solo vivían en React

- Estado: **cerrado en código el 2026-08-04; integración real pendiente**.
- Evidencia histórica: el frontend limitaba MIME y tamaño, pero quien llamase
  directamente a Storage con la anon key no dependía de esa validación.
- Resolución: el bucket impone 5 MB y la lista PDF/JPEG/PNG; las políticas de
  escritura exigen el nombre canónico dentro de la carpeta propia. Las URLs
  firmadas pasan de cinco minutos a un minuto.
- Regresión local: instalación y políticas pasan en PostgreSQL/PGlite.
  Regresión de integración: el caso Storage de `tests/rls/politicas.spec.ts`
  intenta además subir `text/plain` y una ruta anidada.
- Pendiente: ejecutar el caso contra Supabase local o dedicado. Sigue dentro
  del bloqueo general SEC-RLS-001.
