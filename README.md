# Banana Computer — Prototipo navegable (Fase 2)

Prototipo de demostración de la nueva web de Banana Computer, construido a partir de
_"Banana Computer — Arquitectura, flujos y wireframes (Fase 2)"_.

> ⚠️ **Demostración conceptual.** Todos los datos son de ejemplo y aparecen etiquetados
> como tales (_Contenido provisional_, _Precio demostrativo_, _Condiciones pendientes de
> validación_, _Stock de ejemplo_). Ningún precio, condición, stock o sistema es real.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v4** — tokens del sistema visual (§5) en `src/index.css` (`@theme`)
- **Motion** (`motion/react`) — reveals, acordeones, barra de compra, modales
- **React Router** — rutas del §9.1

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción
```

## Estructura

```
src/
  data/          Contenido de ejemplo (§7): catálogo iPhone, tiendas, servicios, FAQ, nav
  lib/           store.tsx (carrito/favoritos/comparador con localStorage), format.ts
  components/
    ui/          Botón, Chip, Modal, Accordion, Reveal, Icon, Placeholder, Tag, StockIndicator…
    layout/      Header + MegaMenu + MobileMenu, Footer, Layout
    product/     ProductCard, FinanceSimulator, StorePicker
  pages/         Una página por pantalla del §8 (15 en total, incluida 404 y favoritos)
```

## Pantallas y su origen en la especificación

| Ruta | Pantalla | Doc |
|------|----------|-----|
| `/` | Inicio (14 bloques) | §4.1 |
| `/iphone` | Familia iPhone | §4.5 |
| `/iphone/:model` | Modelo (pestañas + color/capacidad) | §4.6 |
| `/iphone/:model/:variant` | Ficha de variante (+ barra móvil fija) | §4.7 |
| `/buscar` | Resultados del buscador | §4.4 |
| `/comparar` | Comparador | §4.8 |
| `/carrito` | Carrito | §4.9 |
| `/checkout/1..3` | Checkout 3 pasos | §4.10 |
| `/servicios` | Servicios | §4.11 |
| `/plan-renove` | Plan Renove | §4.12 |
| `/tiendas` · `/tiendas/:slug` | Tiendas + ficha | §4.13 / §4.14 |
| `/soporte` | Centro de soporte | §4.15 |

## Decisiones y notas

- **Mega-menú y menú móvil**: sólo la familia **iPhone** está desarrollada a fondo (§8);
  el resto de familias muestran un aviso y enlazan a iPhone. El catálogo es editable en
  `src/data/products.ts`, no fijo en el código de negocio.
- **Imágenes**: marcadores de posición claramente identificados (§10), nunca fotos reales
  de Apple. Cada muestra lleva el color de la variante como tinte.
- **Accesibilidad (§9.4)**: foco visible siempre, `prefers-reduced-motion`, contraste,
  áreas táctiles ≥44px, etiquetas de formulario asociadas, foco atrapado en modales.
- **Sin backend**: carrito, favoritos y comparador funcionan de verdad (localStorage);
  pago, stock real, financiación real, cuenta y chat están simulados (§8.3 / §9.6).

## Pendiente de validar con Banana (§10)

Manual de marca real, condiciones reales de financiación/envío/Plan Renove, reseñas
reales (ahora hay una de ejemplo), y confirmación de que el Plan Renove sigue siendo
presencial.
