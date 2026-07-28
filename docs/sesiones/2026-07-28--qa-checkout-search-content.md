---
tipo: sesion
fecha: 2026-07-28
tema: QA de checkout, buscador, accesorios, chat y Playwright
---

# QA de checkout, buscador, accesorios, chat y Playwright

## Objetivo

Estabilizar el prototipo antes de introducir una base de datos ficticia y un
chat real. Se pidió expresamente: no añadir Supabase, autenticación, OpenAI,
pagos ni credenciales; solo dejar el flujo blindado y con tests.

## Trabajo realizado

### Checkout (P1)

- Nuevo `src/lib/demoOrderRepository.ts` con `createFromCart(...)`, `get(id)`,
  `getLast()` y `hasAny()`. Persiste en `sessionStorage` bajo
  `banana:demo-orders` y `banana:demo-last-order-id`. El pedido guarda ID,
  fecha, entrega, tienda o dirección + isla, método de pago, meses de
  financiación si aplica, líneas con precio/cantidad/color/capacidad/seguro,
  totales y `status: 'demo'`.
- Nuevo `src/lib/checkoutState.tsx` (Context) con `delivery`, `form`,
  `setDelivery`, `setForm`, `step1Valid` y `validateStep1`. Persiste en
  `sessionStorage` bajo `banana:checkout-state`.
- `CheckoutProvider` envuelve a la app en `src/main.tsx`.
- `CheckoutPage` reescrito con guardas:
  - `/checkout/3` sin pedido → `Navigate` a `/carrito` (o `/iphone` si
    vacío).
  - `/checkout/2` con `step1Valid === false` → `Navigate` a `/checkout/1`.
  - Al confirmar en el paso 2 se crea el pedido, se limpia el carrito y se
    navega al paso 3. Recargar la confirmación conserva el resumen leyendo
    desde `demoOrderRepository`.
- `CartPage` usa `useCheckoutState()` para la entrega, así la selección se
  propaga al paso 1 del checkout.

### Contenido comercial (P2)

- `src/data/commercialClaims.ts` con `id`, `title`, `text`, `icon`,
  `status: 'demo'|'verified'|'pending'`, `source`, `verifiedAt`,
  `disclaimer`. Ejemplos: `envio24`, `financiacion0`, `soporteOficial`,
  `tiendasCanarias` (verified), `planRenove400`, `formacion`,
  `seguroMensual`, `stockDemo`, `precioDemo`.
- Franja de confianza del home lee desde `claim(...)` y muestra un aviso
  discreto de condición demostrativa.
- Enlaces "Complementa tu equipo" ahora van a
  `/buscar?q={fundas|magsafe|correas|teclados|audio}`.

### Buscador (P3)

- `SearchPage` sincroniza el input con el parámetro `q` vía `useEffect`.
- `Header.tsx` genera `SEARCH_SUGGESTIONS` en runtime desde `families` +
  `modelsByFamily` (`buildSearchSuggestions`), usando `variantPath` para las
  URLs. El input del SearchPage recibe `data-testid="search-input"` y
  `aria-label="Buscar en el catálogo"` para diferenciarlo del input del
  overlay del Header.

### Chat (P4)

- `ChatBubble` usa `useLocation()` y devuelve `null` cuando
  `pathname.startsWith('/checkout')`.
- Panel accesible: `role="dialog"`, `aria-modal="true"`, `aria-haspopup="dialog"`,
  `aria-labelledby="chat-banana-title"`. Al abrir, `closeRef.current?.focus()`
  con `requestAnimationFrame`. Escape cierra y devuelve foco al botón. Al
  desmontar el panel también se devuelve el foco.

### Playwright (P6)

- Instalado `@playwright/test`.
- `playwright.config.ts` con `baseURL: http://127.0.0.1:5173/pagina-banana/`,
  proyectos chromium y mobile (iPhone 12), `webServer` con `npm run dev`,
  `trace: retain-on-failure`, screenshots y vídeos on failure.
- `tests/e2e/`:
  - `home.spec.ts`: carga de la portada, `/buscar?q=fundas` en accesorios y
    ancho móvil 375 px sin scroll horizontal.
  - `checkout.spec.ts`: `/checkout/3` sin pedido redirige, `/checkout/2` sin
    paso 1 redirige a `/checkout/1`, flujo demostrativo completo que crea un
    ID `BC-\d{6}`, y ausencia del chat en checkout.
  - `search.spec.ts`: input sincronizado con `q` al navegar entre búsquedas y
    validación de destinos de accesorios.
- Scripts `test:e2e`, `test:e2e:ui`, `test:e2e:headed`.
- Workflow `.github/workflows/e2e.yml`: `npm ci` → `npm run build` → install
  chromium con deps → `npm run test:e2e`, sube `playwright-report` como
  artefacto en caso de fallo.
- `.gitignore` ignora `playwright-report/`, `test-results/`, `blob-report/`.

### Documentación (P5)

- `docs/00-estado-actual.md`: sección "Cambios recientes (2026-07-28)" y
  actualización de "Qué no existe" (accesorios sin catálogo, sólo E2E).
- `docs/04-problemas-pendientes.md`: FLUJO-001, LINKS-001, CLAIMS-001,
  CHAT-001 marcados como cerrados; FUNC-002 con evolución del checkout;
  QA-001 parcialmente resuelto con Playwright; DOC-001 nota sobre README.
- Esta nota de sesión.

## Comprobaciones

- `npm run build`: correcto tras cada bloque (425 módulos transformados).
- `npx playwright test --project=chromium`: 9/9 pruebas en verde
  localmente.
- Manual: `/checkout/3` en pestaña nueva → redirige a `/iphone`; con
  carrito → redirige a `/carrito`. `/checkout/2` sin datos → vuelve al
  paso 1. Flujo completo crea ID y sobrevive a recarga.
- Chat oculto al entrar en `/checkout/1` y visible al volver a la home.
- Buscar "iPhone" y luego "Mac" desde la propia página de resultados
  actualiza input y resultados.

## Archivos afectados

- `src/lib/demoOrderRepository.ts` (nuevo).
- `src/lib/checkoutState.tsx` (nuevo).
- `src/main.tsx` — envuelve `CheckoutProvider`.
- `src/pages/CheckoutPage.tsx` — reescrito.
- `src/pages/CartPage.tsx` — usa `useCheckoutState`.
- `src/pages/SearchPage.tsx` — sync + `data-testid`.
- `src/pages/Home.tsx` — accesorios a `/buscar` y franja usando claims.
- `src/data/commercialClaims.ts` (nuevo).
- `src/components/layout/Header.tsx` — `buildSearchSuggestions`.
- `src/components/layout/ChatBubble.tsx` — oculto en checkout, a11y.
- `playwright.config.ts` (nuevo), `tests/e2e/*.spec.ts` (nuevos).
- `.github/workflows/e2e.yml` (nuevo).
- `.gitignore` — artefactos Playwright.
- `package.json` — scripts + `@playwright/test`.
- `docs/00-estado-actual.md`, `docs/04-problemas-pendientes.md`.

## Siguiente paso

- Reescribir README para reflejar catálogo actual (Mac 8, iPad 4, Watch 3,
  AirPods 2), `demoOrderRepository`, `commercialClaims` y Playwright.
- Ampliar E2E con favoritos, comparador y cambios de color/capacidad.
- Cuando exista un catálogo de accesorios, los enlaces `/buscar?q=…` ya
  producirán resultados; hoy caen en el estado vacío del buscador.
