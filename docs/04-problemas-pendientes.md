---
tipo: problemas
actualizado: 2026-08-01
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

## QA-001 — Suite E2E con Playwright + accesibilidad axe

- Estado: ampliado el 2026-07-29. Pendiente completar cobertura del
  detalle de tienda.
- Evidencia: 64 pruebas en `tests/e2e/` (62 en `chromium` + 2 en
  `mobile` etiquetadas `@mobile`), distribuidas en `home.spec.ts`,
  `checkout.spec.ts`, `checkout-flow.spec.ts`, `chat.spec.ts`,
  `product.spec.ts`, `favorites-compare.spec.ts`, `search.spec.ts`,
  `audit-ux.spec.ts` (mejoras post-auditoría),
  `device-preparation-guide.spec.ts` (guía interactiva) y
  `accessibility.spec.ts` (axe-core sobre 8 rutas + la guía).
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
- CI: `.github/workflows/e2e.yml` ejecuta `npm ci`, `npm run build`,
  `npx playwright install --with-deps chromium` y `npm run test:e2e`
  en cada push/PR sobre `main`, con el proyecto móvil corriendo sobre
  Chromium (`Pixel 5`) para no requerir WebKit.
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

- Estado: **abierto**. Reverificado el 2026-07-29 con el lockfile
  actual (`npm ci` + `npm audit` + `npm audit --omit=dev` + `npm ls`).
- Impacto: moderado según `npm audit`.
- Evidencia (2026-07-29): `npm ls react-router react-router-dom` →
  `react-router-dom@6.30.4 → react-router@6.30.4`. `npm audit` reporta
  **2 vulnerabilidades moderadas** con **"No fix available"** dentro
  de la línea 6.x:
  - `GHSA-wrjc-x8rr-h8h6`: React Router — Open redirect via backslash
    en `<Link>` y `useNavigate` (bypass de CVE-2025-68470).
  - `GHSA-337j-9hxr-rhxg`: React Router — Arbitrary Constructor
    Injection via `deserializeErrors()` en la hidratación SSR.
- Matiz: este prototipo es una SPA sin SSR, por lo que
  `deserializeErrors` no se ejecuta; el aviso de open redirect vía
  `<Link>` sí aplica en teoría, pero la URL de destino se compone en
  cliente a partir de datos del propio catálogo (no se pasa input de
  usuario a `<Link to>` en ninguna ruta).
- Corrección disponible: **no** dentro de 6.x. La corrección oficial
  requiere migrar a **React Router 7** (mayor, con `data routers` y
  cambios de API). Esta migración queda fuera del alcance de la
  presente PR y se evaluará por separado.
- Acción tomada en esta PR: se mantiene `react-router-dom@6.30.4`
  intacto. No se ha ejecutado `npm audit fix` ni `--force`.

## CI-001 — Actions fuerza Node 24 por obsolescencia de Node 20

- Estado: **resuelto en código el 2026-07-29**, pendiente de
  validación del workflow de la PR.
- Cambio aplicado: `node-version: 20` → `node-version: 24` en
  `.github/workflows/e2e.yml` y `.github/workflows/deploy.yml`.
  Añadido `.nvmrc` con `24` en la raíz para que el entorno local
  con nvm coincida con CI.
- Verificación final: se marcará cerrado en cuanto los workflows
  E2E y Pages de esta PR terminen en verde utilizando Node 24
  explícito (sin el aviso de deprecación).

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

## CHAT-001 — `/agente` accesible por URL sin autenticación

- Estado: **cerrado el 2026-07-31**. `/agente` exige ahora sesión de
  Supabase y que la cuenta esté dada de alta en la tabla `agentes`
  (`src/pages/AgentPage.tsx` + `src/lib/agentAuth.tsx`). Responder como
  agente, asignarse conversaciones y revisar descuentos requieren
  `auth.uid()` presente en `agentes`, comprobado en la RLS. El
  `Disallow` de `robots.txt` se mantiene.
- **Queda abierto un resto**: la LECTURA de `visitantes`,
  `conversaciones` y `mensajes` sigue permitida al rol `anon`, porque el
  widget de chat del visitante no tiene login y la necesita. Es decir,
  quien conozca la URL del proyecto Supabase y la anon key (que viaja en
  el bundle, como es normal) podría leer conversaciones aunque ya no
  pueda responder como agente. Se cierra cuando el visitante tenga
  también cuenta; hasta entonces sigue siendo un prototipo con datos
  ficticios. Ver [[02-decisiones#D-027 — Fase 2 con cuentas ficticias]].

## CHAT-001-HIST — Estado anterior de CHAT-001 (Fase 1)

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

## CUENTAS-002 — Sin pruebas E2E del flujo autenticado

- Estado: abierto, asumido por ahora.
- Evidencia: `tests/e2e/accounts.spec.ts` cubre el cableado (rutas,
  redirecciones, CTA de reserva, que `/cuenta` no filtra datos sin
  sesión) y pasa **con y sin** credenciales de Supabase, que es el
  requisito para que CI siga en verde. Lo que no cubre es el camino
  autenticado: registro, login, reserva de punta a punta, revisión de
  descuentos.
- Motivo: el workflow `e2e.yml` no tiene los secretos de Supabase, así
  que en CI `supabaseEnabled` es false y no hay backend contra el que
  probar.
- Opciones cuando interese cerrarlo: añadir los secretos al workflow y
  usar un proyecto Supabase de pruebas aparte del de la demo, o levantar
  Supabase local con Docker en CI.

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

- Estado: detectado el 2026-07-31, asumido.
- Impacto: bajo.
- Evidencia: la suite corre contra el dev server de Vite, y ahí el
  service worker no se registra a propósito (`src/lib/pwa.ts` comprueba
  `import.meta.env.PROD`). `tests/e2e/pwa.spec.ts` cubre el manifest, los
  iconos, la inyección y limpieza de las etiquetas por ruta, y que en
  desarrollo **no** haya ningún registro —regresión deliberada, por lo
  ocurrido en [[04-problemas-pendientes#QA-002 — Las pruebas E2E escribían en el Supabase real]]—
  pero no el precache ni el arranque sin conexión.
- Verificación que sí se hizo, a mano y contra un build servido: el
  service worker toma el control, deja una sola caché con 10 ficheros en
  precache, y con la red cortada una ruta profunda (`/iphone`) sigue
  cargando la web y no el error del navegador.
- Riesgo: una regresión en las estrategias de caché no la detectaría el
  CI.
- Resolución posible: un proyecto de Playwright aparte que sirva `dist/`
  con `vite preview` en vez del dev server. No se hace ahora para no
  duplicar el arranque de la suite por una superficie pequeña.

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

## UI-001 — El menú de dispositivos va centrado respecto al contenedor, no al hueco

- Estado: detectado el 2026-08-01, mitigado.
- Evidencia: el `<nav>` principal de la cabecera se posiciona con
  `absolute left-1/2 -translate-x-1/2`, es decir centrado respecto al
  contenedor, para compartir eje vertical con la barra utilitaria de arriba.
  El bloque de accesos de la derecha, en cambio, va en flujo con `ml-auto`.
- Riesgo: los dos son independientes, así que **si el bloque derecho crece,
  se echa encima del menú**. Al añadir el selector de idioma se midió un
  solape real de 9px, no un simple apretón visual.
- Mitigación aplicada: selector compacto (bandera y flecha, sin el código de
  idioma), enlaces del menú algo menos holgados, y el selector pegado al
  borde derecho asomando sobre el relleno del contenedor, lo que arrastra al
  resto de accesos algo más a la derecha. El hueco queda en **51px a
  1280px**, medido.
- Queda la asimetría de fondo: del logo al menú sobran 271px y del menú a los
  iconos hay 43px. Es consecuencia de centrar respecto al contenedor.
  Arreglarlo de verdad exige centrar el menú respecto al hueco entre logo e
  iconos, lo que **rompería la alineación con la barra utilitaria**, que es
  la razón por la que está así. Es una decisión de diseño, no un bug.
- Cualquier acceso nuevo en la derecha vuelve a comerse ese hueco: conviene
  medirlo antes de añadir nada.
