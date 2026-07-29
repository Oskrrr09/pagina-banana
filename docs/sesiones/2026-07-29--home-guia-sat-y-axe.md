---
tipo: sesion
fecha: 2026-07-29
tema: portada sin H1, guía interactiva de preparación y axe sin excepciones
---

# Portada sin H1, guía interactiva y axe sin excepciones globales

## Objetivo

Cuatro correcciones concretas:

1. Eliminar por completo la franja "Bienvenido / Banana Computer —
   Apple en Canarias" y su `<h1>`. La portada empieza directamente
   por el `HeroCarousel` sin sustituir ese H1 por otro.
2. Convertir "Preparar mi dispositivo" en una guía emergente
   interactiva de 4 pasos.
3. Sustituir la denominación "Iniciar reparación" por
   "Preparar mi dispositivo".
4. Corregir la cobertura axe eliminando las excepciones globales
   `color-contrast` y `region`.

## Estado inicial

- Rama base `main` = `e2d03cc` (PR #13 + ajustes de contenido SAT
  y Plan Renove).
- La portada mostraba una franja previa con un `<h1>` decorativo.
- `SupportPage` incluía "Iniciar reparación" que sólo enlazaba a
  `/servicio-tecnico`.
- `tests/e2e/accessibility.spec.ts` desactivaba globalmente
  `color-contrast` y `region`.

## Cambios realizados

### Portada

- `src/pages/Home.tsx`: retirada la franja `<Container>` con el
  eyebrow "Bienvenido" y el `<h1>` "Banana Computer — Apple en
  Canarias". Se documenta como decisión visual consciente; no se
  añade ningún H1 sustituto.
- `src/components/home/HeroCarousel.tsx`: los títulos rotativos ya
  eran `<h2>` y así se mantienen.

### Guía interactiva

- Nuevo componente `src/components/support/DevicePreparationGuide.tsx`:
  - `role="dialog"` + `aria-modal="true"` +
    `aria-labelledby` + `aria-describedby`.
  - Foco inicial en el botón "Cerrar" (icónico con `sr-only`
    "Cerrar").
  - Trampa de foco Tab/Shift+Tab cíclica dentro del panel.
  - Escape cierra y devuelve el foco al elemento que abrió el
    diálogo.
  - Bloqueo de scroll de fondo y `inert` sobre los hermanos del
    portal mientras está abierto.
  - Cuatro pasos con `<h3>` propio, checkbox de confirmación por
    paso y botón "Siguiente" que se activa sólo cuando la
    confirmación está marcada. "Anterior" desde el paso 2.
  - Paso 4 con resumen ordenado (copia → modo antirrobo → Buscar),
    aviso de no compartir credenciales, resumen breve de entrega
    (35 €, 3 días, etc.) y CTAs "Consultar tiendas y horarios"
    (`/tiendas`) + "Cerrar guía".
  - Progreso "Paso N de 4" + barra visual + `aria-live="polite"`.
  - Estado 100 % local. No usa `localStorage`, `sessionStorage`,
    cookies, ni parámetros URL. Al cerrar reinicia los checkboxes
    y vuelve al paso 1.
- `src/pages/SupportPage.tsx`: el quick-link "Preparar mi
  dispositivo" pasa a ser un `<button>` que abre la guía; se
  añade un botón secundario "Preparar mi dispositivo" también en
  el callout SAT; el resto de la página se envuelve en `<main>` y
  las subsecciones en `<section aria-labelledby>` para que axe
  `region` pase.
- `src/pages/ServiceTechnicalPage.tsx`: el CTA principal pasa a
  ser un `<button>` "Preparar mi dispositivo" que abre la misma
  guía; el enlace a `/tiendas` queda como secundario.
- `src/data/content.ts`: `supportQuickLinks` ahora expone
  "Preparar mi dispositivo" con descripción "Guía paso a paso
  antes de entregar tu equipo."

### Renombrado "Iniciar reparación"

- Retirado del código (`src/data/content.ts`) y del comentario
  interno de `SupportPage`.
- Sigue mencionado únicamente en el test que verifica su
  ausencia (`device-preparation-guide.spec.ts`).

### axe sin excepciones globales

- `tests/e2e/accessibility.spec.ts`: retiradas las claves
  `disableRules(['color-contrast', 'region'])`. Se añade un test
  específico que ejecuta axe sobre la guía interactiva abierta.
- Ocho rutas cubiertas: `/`, `/iphone`,
  `/iphone/17-pro/256gb-plata`, `/tiendas`, `/soporte`,
  `/servicio-tecnico`, `/plan-renove` y `/checkout/1` (con
  carrito sembrado).

### Correcciones reales de contraste y landmarks

- `src/index.css`:
  - `--color-muted`: `#6e6e73` → `#4d4d55` (AA sobre blanco,
    neutro, amarillo claro y cabecera amarilla del checkout).
  - `--color-available`: `#2e7d32` → `#2a6d2e` (AA sobre
    `bg-available-050`).
- `src/components/layout/Header.tsx`: barra utilitaria superior
  `bg-[#3ea3c1]` → `bg-[#1f6e83]`; enlaces `text-white/90` →
  `text-white` (elimina la opacidad y sube el ratio a AA).
- `src/pages/Home.tsx` y `HeroCarousel.tsx`: `text-ink/60` →
  `text-ink/80` para textos secundarios sobre el amarillo.
- `src/pages/SupportPage.tsx`: sustituido el `<div id="faq">` por
  `<section id="faq" aria-labelledby="faq-heading">` y equivalentes
  para las otras dos regiones; contenido dentro de `<main>`.

## Comprobaciones

- `npm run build`: correcto (428 módulos, `dist/assets/index-*.js`
  ~482 kB, gzip ~140 kB).
- `npx playwright test tests/e2e/accessibility.spec.ts --project=chromium`:
  **9/9** en verde (7 rutas públicas + `/checkout/1` + guía).
- `npx playwright test tests/e2e/device-preparation-guide.spec.ts --project=chromium`:
  **12/12** en verde.
- `npm run test:e2e`: **64/64** en verde (62 chromium + 2 mobile).
- Búsqueda `grep -Rni "Iniciar reparación"` en `src` y `README`:
  ninguna ocurrencia como comportamiento actual.
- Búsqueda `grep -Rni "Banana Computer — Apple en Canarias"` en
  `src` y en pruebas que exijan H1: sólo aparece en el test que
  comprueba su ausencia.

## Archivos afectados

- `src/pages/Home.tsx`
- `src/pages/SupportPage.tsx`
- `src/pages/ServiceTechnicalPage.tsx`
- `src/components/layout/Header.tsx`
- `src/components/home/HeroCarousel.tsx`
- `src/components/support/DevicePreparationGuide.tsx` (nuevo)
- `src/data/content.ts`
- `src/index.css`
- `tests/e2e/audit-ux.spec.ts`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/device-preparation-guide.spec.ts` (nuevo)
- `README.md`
- `docs/03-roadmap.md`
- `docs/04-problemas-pendientes.md`
- `docs/05-registro-de-cambios.md`
- `docs/sesiones/2026-07-29--home-guia-sat-y-axe.md` (este archivo)

Ficheros **no** modificados (deliberadamente): `src/pages/PlanRenovePage.tsx`,
`src/pages/CartPage.tsx`, `src/pages/CheckoutPage.tsx`,
`src/lib/checkoutState.tsx`, `src/lib/demoOrderRepository.ts`,
`scripts/banana-audit/`, `playwright/.auth/`, `audit-private/`,
`tests/e2e/checkout-flow.spec.ts`, `tests/e2e/checkout.spec.ts`.

## Pendientes

- Barra sticky "Total — Continuar" en checkout móvil.
- axe sobre `/tiendas/:slug` (detalle de tienda).
- Node 22/24 explícito en Actions.
- SEG-001 (aviso moderado en `react-router-dom`).

## Commit, PR, workflows y despliegue

Se documentan al final de esta sesión.
