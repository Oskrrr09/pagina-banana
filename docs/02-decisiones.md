---
tipo: decisiones
actualizado: 2026-07-26
---

# Decisiones

Este registro recoge decisiones demostrables en el código o en la configuración.
No atribuye motivaciones que el repositorio no documenta.

## D-001 — SPA con Vite, React y TypeScript

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: implementar el prototipo como SPA de React 18 compilada con Vite y
  TypeScript estricto.
- Evidencia: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`.

## D-002 — Tailwind v4 y Motion como capas de presentación

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: usar Tailwind CSS v4 con configuración CSS-first y Motion para las
  transiciones de componentes y entradas en viewport.
- Evidencia: `src/index.css`, imports desde `motion/react` y skills versionados
  en `.claude/skills/`.
- Límite actual: GSAP y Lenis están descritos en los skills, pero no son
  dependencias ni se usan en la aplicación.

## D-003 — Catálogo y contenido locales

- Fecha constatada: 2026-07-25.
- Estado: vigente mientras el proyecto sea prototipo.
- Decisión: modelar catálogo, tiendas y contenido editorial como módulos
  TypeScript estáticos.
- Evidencia: `src/data/products.ts`, `src/data/stores.ts`,
  `src/data/content.ts`.
- Consecuencia: la web no consulta stock, precios, tiendas ni contenido a un
  sistema externo.

## D-004 — Datos comerciales explícitamente demostrativos

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: etiquetar información no validada como “Contenido provisional”,
  “Precio demostrativo”, “Condiciones pendientes de validación” o “Stock de
  ejemplo”.
- Evidencia: `README.md`, `src/data/types.ts` y los badges visibles de la UI.

## D-005 — Estado funcional persistido en localStorage

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: mantener carrito, favoritos y comparador en un contexto React y
  persistirlos en el navegador, sin backend.
- Evidencia: `src/lib/store.tsx`.

## D-006 — Catálogo multi-familia con accesorios aún no desarrollados

- Fecha constatada: 2026-07-26.
- Estado: vigente.
- Decisión: ofrecer catálogo para iPhone, Mac, iPad, Apple Watch y AirPods; la
  entrada Accesorios se conserva como demostración y dirige a iPhone.
- Evidencia: `src/data/products.ts`, `src/data/nav.ts`.

## D-007 — Identidad amarilla Banana

- Fecha constatada: 2026-07-26.
- Estado: vigente.
- Decisión: unificar identidad y acción en el amarillo `#ffce1f`, con texto
  oscuro sobre amarillo.
- Evidencia: commit `76642b3` e `src/index.css`.

## D-008 — Publicación bajo una subruta de GitHub Pages

- Fecha constatada: 2026-07-26.
- Estado: vigente.
- Decisión: servir la SPA bajo `/pagina-banana/`, desplegarla con GitHub Actions
  al hacer push a `main` y usar un fallback 404 para rutas profundas.
- Evidencia: `vite.config.ts`, `src/main.tsx`, `public/404.html`,
  `index.html`, `.github/workflows/deploy.yml`.

## D-009 — Documentación persistente en un vault aislado

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: usar `docs/` como documentación compartida y vault de Obsidian,
  manteniendo `docs/.obsidian/` y la configuración `.obsidian/` de la raíz fuera
  de Git.
- Evidencia: solicitud del usuario, `AGENTS.md` y `.gitignore`.
- Consecuencia: se versiona el conocimiento del proyecto, no las preferencias
  locales de Obsidian.

## D-010 — Layout exclusivo para checkout

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: mantener `/checkout/:step` fuera del layout comercial y envolverlo
  en `CheckoutLayout`, con una sola cabecera simplificada y sin footer general.
- Evidencia: `src/App.tsx`, `src/components/layout/CheckoutLayout.tsx` y
  `src/pages/CheckoutPage.tsx`.
- Consecuencia: los tres pasos conservan el flujo funcional sin duplicar la
  navegación de la tienda.

## D-011 — Horarios con fuente, sin estado en tiempo real

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: conservar en `src/data/stores.ts` las direcciones y horarios
  publicados por Banana Computer, la fecha de consulta y la URL oficial, pero
  no inferir ni mostrar “Abierto ahora”.
- Motivo: un horario regular no garantiza aperturas en festivos o incidencias.
- Consecuencia: la interfaz muestra el horario correspondiente al día en
  Canarias como orientación y pide confirmación antes del desplazamiento.

## D-012 — Navegación modal accesible en móvil

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: tratar el menú móvil como diálogo modal, confinar el foco, cerrarlo
  con Escape, devolver el foco al disparador y bloquear el scroll de fondo.
- Evidencia: `src/components/layout/Header.tsx` y
  `src/components/layout/MobileMenu.tsx`.

## D-013 — Seguro como opción única del pedido

- Fecha: 2026-07-26.
- Estado: reemplazada por D-014.
- Decisión: tratar el seguro a todo riesgo de 8,99 € como una opción del pedido,
  no como una línea ni una unidad de producto.
- Evidencia: `src/lib/store.tsx`, `src/pages/VariantPage.tsx`,
  `src/pages/CartPage.tsx` y `src/pages/CheckoutPage.tsx`.
- Consecuencia: la ficha selecciona el seguro antes de comprar y carrito y
  checkout comparten el mismo estado e importe.

## D-014 — Seguro asociado a cada línea del carrito

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: almacenar el seguro en la línea exacta de familia, modelo, color y
  capacidad, con un coste demostrativo de 8,99 € por unidad.
- Evidencia: `src/lib/store.tsx`, `src/pages/VariantPage.tsx`,
  `src/pages/CartPage.tsx` y `src/pages/CheckoutPage.tsx`.
- Consecuencia: el usuario puede identificar, activar o retirar el seguro para
  cada producto desde la cesta y el checkout sin duplicar unidades.

## D-015 — Acceso directo a variantes desde iPhone y Mac

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: mostrar una franja de modelos y ofertas en las familias iPhone y
  Mac, y enlazar sus modelos directamente a la primera variante configurable.
- Evidencia: `src/pages/FamilyPage.tsx`, `src/components/product/ProductCard.tsx`,
  `src/data/nav.ts` y `src/data/products.ts`.
- Consecuencia: la ruta intermedia de modelo sigue siendo válida, pero deja de
  ser un paso obligatorio en estos escaparates.

## D-016 — Entrada global al chat sin simular un servicio activo

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: mantener un botón flotante amarillo en todas las rutas que abre un
  aviso accesible de “próximamente” y enlaza al soporte existente.
- Evidencia: `src/components/layout/ChatBubble.tsx` y `src/App.tsx`.
- Consecuencia: queda reservado el punto de entrada visual sin afirmar que
  exista todavía atención por chat.

## Cómo añadir una decisión

Añade una sección con identificador, fecha, estado, decisión, evidencia y
consecuencias. Si una decisión cambia, no borres su historia: márcala como
reemplazada e indica el nuevo identificador.
