---
tipo: sesion
fecha: 2026-07-28
tema: implementación de las mejoras UX aprobadas tras la auditoría
---

# Mejoras UX post-auditoría

## Objetivo

Implementar cuatro mejoras aprobadas después de la auditoría de la web
oficial (PR #12 · [[auditorias/auditoria-web-oficial-banana]]):

1. `<h1>` semántico en la portada.
2. Información operativa completa del Servicio Técnico Autorizado.
3. Timeline oficial de 4 pasos del Plan Renove con Foxway (sin
   precios).
4. Cobertura `@axe-core/playwright` dentro de la suite Playwright.

**Fuera de alcance** (deliberadamente pospuesto): barra sticky del
checkout móvil, cualquier cambio del seguro, checkout, precios y
componentes fuera de las cuatro pantallas listadas.

## Mejoras implementadas

- **Portada** (`src/pages/Home.tsx` + `src/components/home/HeroCarousel.tsx`):
  se añade un único `<h1>` visible "Banana Computer — Apple en
  Canarias" en un bloque discreto justo antes del hero. El hero
  anterior usaba `<h1>` por slide (varios H1 en la misma vista), se
  convierte a `<h2>` — mejora la jerarquía y el SEO sin cambiar el
  aspecto visual del carrusel.
- **`/soporte`** (`src/pages/SupportPage.tsx`): reescrito para
  incorporar toda la información operativa real facilitada para el
  proyecto, en el orden pedido en el brief (banner sin cita →
  checklist → entrega → garantía → fuera de garantía → plazos →
  CTAs). Se retiran los botones "Abrir chat" y "Formulario de
  contacto" no operativos y el `<button>` flotante local duplicado
  (el chat global sigue disponible desde el layout). Se cambian los
  quick-links a anclas (SAT y FAQ). Ningún componente añade
  reserva, calendario, campo de contraseña ni credenciales.
- **`/plan-renove`** (`src/pages/PlanRenovePage.tsx`): nueva sección
  "Cómo funciona con Foxway" con la timeline de cuatro pasos como
  `<ol>` accesible etiquetada `aria-label="Pasos del Plan Renove con
  Foxway"`. La sección antigua "¿Cómo funciona?" pasa a "Antes de
  empezar" para no duplicar el mensaje. Se retira el copy "reserva
  cita previa" del CTA final.
- **`/tiendas`** (`src/pages/StoresPage.tsx`): se elimina el
  `div role="button" tabIndex={0}` que envolvía cada tarjeta (violación
  `nested-interactive` detectada por axe). La interacción "enfocar en
  el mapa" pasa a un botón visible autónomo dentro de las acciones,
  junto a "Ver detalles" y "Cómo llegar".
- **`tests/e2e/audit-ux.spec.ts`** (nuevo, 16 pruebas): comprueba
  cada requisito literal:
  - H1 único y visible en portada + sin scroll horizontal a 375 px.
  - Banner "No necesitas cita previa" con texto exacto.
  - Checklist con copia de seguridad, "Buscar" y modo antirrobo.
  - Se explica que se puede dejar el dispositivo en otras tiendas
    Banana.
  - En garantía: envío gratuito; fuera de garantía: **35 €** con
    descuento si acepta y no reembolsable si rechaza.
  - Plazos: mínimo 3 días de traslado + aclaración + diagnóstico +
    reparación cuando corresponda.
  - No aparecen controles prohibidos (reserva/cita/calendario/
    input password/date/time) ni frases con "plazo garantizado".
  - CTAs a tiendas funcionan.
  - Plan Renove: 4 pasos, Foxway mencionado, la estimación puede
    cambiar, no hay precios ni tasador ni iframes.
- **`tests/e2e/accessibility.spec.ts`** (nuevo, 7 pruebas):
  `@axe-core/playwright` sobre `/`, `/iphone`,
  `/iphone/17-pro/256gb-plata`, `/tiendas`, `/soporte`, `/plan-renove`
  y `/checkout/1` (con carrito sembrado). Se usan las etiquetas
  `wcag2a`, `wcag2aa`, `wcag21a`.

## Decisiones

- Se ha promovido a `<h3>` las subsecciones del bloque SAT ("Entrega
  directa", "Dejarlo en cualquier tienda Banana", "Dispositivo en
  garantía", "Dispositivo fuera de garantía") para mejorar la
  jerarquía y facilitar los selectores accesibles de las pruebas.
- El chat flotante local que estaba en `SupportPage` se retira porque
  el `ChatBubble` global ya cubre esa función en todo el sitio.
- El fix de `/tiendas` responde a una violación real de axe
  (`nested-interactive`) detectada en la primera ejecución de la
  suite; entra dentro del alcance de la Fase 5.

## Restricciones respetadas

- **No** se modifica lógica del seguro, precios, carrito ni checkout
  (`src/pages/CartPage.tsx`, `src/lib/checkoutState.tsx`,
  `src/lib/demoOrderRepository.ts`, `insurancePrice`,
  `cartInsuranceTotal`, `setLineInsurance`, ni las pruebas
  `checkout-flow.spec.ts` / `checkout.spec.ts`).
- **No** se implementa la barra sticky de checkout móvil (queda como
  única propuesta pendiente en `docs/03-roadmap.md` §6).
- **No** se crean citas, calendarios, tasador, seguimiento real de
  reparaciones ni pagos.
- **No** se añaden los scripts de auditoría al CI ni se toca
  `playwright/.auth/` ni `audit-private/`.

## Información operativa del servicio técnico (texto usado)

- Banner: "No necesitas cita previa. Puedes acudir directamente
  durante el horario de apertura. Antes de entregar tu dispositivo,
  asegúrate de haber realizado una copia de seguridad y de haber
  desactivado las funciones de seguridad necesarias."
- Preparación: "Realiza una copia de seguridad" · "Desactiva la
  función 'Buscar' (Buscar mi iPhone, Buscar mi iPad, Buscar mi Mac
  o la opción equivalente según el dispositivo)" · "Desactiva la
  Protección del dispositivo en caso de robo (modo antirrobo o
  función equivalente), cuando esté activada o disponible."
- Entrega en otras tiendas: "También puedes dejar el dispositivo en
  el resto de tiendas Banana. El equipo será recogido y enviado al
  servicio técnico para su revisión."
- Garantía: "el envío al servicio técnico es gratuito".
- Fuera de garantía: "un coste de **35 €**" · "esos 35 € se
  descontarán del precio final" · "el importe de 35 € no será
  reembolsable".
- Plazos: "el traslado suele tardar un mínimo de **3 días**" ·
  "Los 3 días corresponden únicamente al traslado orientativo al
  servicio técnico, no al plazo total de diagnóstico y reparación".

## Tests

- `npx playwright test tests/e2e/audit-ux.spec.ts --project=chromium`:
  16 pruebas en verde (2,x s).
- `npx playwright test tests/e2e/accessibility.spec.ts --project=chromium`:
  7 pruebas en verde (4,8 s).
- `npm run test:e2e`: **45/45** en verde (~10 s), 44 chromium + 1
  mobile.

## Resultado de axe

- 7 rutas con `wcag2a`, `wcag2aa`, `wcag21a`.
- Excepciones: `color-contrast` (paleta de marca a revisar en el
  rediseño) y `region` (bloques decorativos del hero sin landmark).
- Violación real detectada y corregida: `nested-interactive` en
  `/tiendas`.

## Archivos modificados

- `src/pages/Home.tsx`
- `src/components/home/HeroCarousel.tsx`
- `src/pages/SupportPage.tsx`
- `src/pages/PlanRenovePage.tsx`
- `src/pages/StoresPage.tsx`
- `tests/e2e/audit-ux.spec.ts` (nuevo)
- `tests/e2e/accessibility.spec.ts` (nuevo)
- `package.json` (+ `@axe-core/playwright`)
- `package-lock.json`
- `README.md`
- `docs/03-roadmap.md`
- `docs/04-problemas-pendientes.md`
- `docs/05-registro-de-cambios.md`
- `docs/sesiones/2026-07-28--mejoras-ux-post-auditoria.md` (este
  archivo)

No modificados: `src/pages/CartPage.tsx`, `src/pages/CheckoutPage.tsx`
(salvo por lectura), `src/lib/checkoutState.tsx`,
`src/lib/demoOrderRepository.ts`, `tests/e2e/checkout*.spec.ts`,
`scripts/banana-audit/`, `playwright/.auth/`, `audit-private/`.

## Pendientes

- Barra sticky "Total — Continuar" en el checkout móvil.
- axe sobre detalle de tienda.
- Decisiones pendientes con Banana / Foxway para integraciones
  reales.

## Commit, PR, workflows y despliegue

Se completan al final de esta sesión — se documentan los SHA e IDs
en `docs/05-registro-de-cambios.md` una vez fusionada la PR.
