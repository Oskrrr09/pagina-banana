---
name: modern-web-stack
description: >-
  Elige y monta el stack técnico de una web moderna, dinámica y elegante:
  bundler/framework, Tailwind CSS v4, Motion (antes Framer Motion), GSAP +
  ScrollTrigger y Lenis para smooth scroll. Úsalo SIEMPRE al iniciar un proyecto
  web nuevo, al añadir animaciones/scroll a un sitio existente, o cuando el
  usuario pida "una web moderna", "minimalista", "con animaciones", "que se
  sienta premium" o "tipo Awwwards" — incluso si no nombra las librerías. Define
  qué instalar, cuándo usar cada librería y cómo integrarlas sin que peleen entre sí.
---

# Modern Web Stack

Montar una web moderna es sobre todo elegir bien las piezas y evitar que se pisen.
La mayoría de sitios "premium" de 2025-2026 usan una combinación muy repetida:
un framework ligero, utilidades CSS, una capa de animación declarativa, una capa
de animación imperativa para el scroll, y una capa de smooth scroll por debajo.

## Decisión 1 — Framework / bundler

No metas Next.js por defecto. Elige según lo que realmente necesita el sitio:

- **Vite + React** → landing pages, portfolios, sitios de una o pocas páginas,
  experiencias muy animadas. Arranque instantáneo, cero fricción, control total.
  **Es la opción por defecto para una web "bonita" sin backend.**
- **Astro** → sitios de contenido/marketing con poco JS (blog, docs, landing
  estática). Envía casi nada de JavaScript; islas interactivas solo donde hacen falta.
- **Next.js** → solo si hay rutas dinámicas de verdad, auth, SSR/SEO crítico con
  datos de servidor, o un backend acoplado. Es más peso y más ceremonia.

Regla práctica: si dudas entre Vite y Next para una web principalmente visual,
elige **Vite**.

## Decisión 2 — Las capas de estilo y animación

| Capa | Librería | Para qué |
|------|----------|----------|
| Estilos | **Tailwind CSS v4** | Todo el layout, spacing, color, tipografía |
| Animación de UI | **Motion** (`motion/react`) | Enter/exit, hover, tap, drag, layout, transiciones de estado React |
| Animación de scroll | **GSAP + ScrollTrigger** | Timelines complejas, pin, parallax, secuencias coreografiadas |
| Smooth scroll | **Lenis** | Scroll con inercia por debajo de todo (~3KB) |

Por qué dos librerías de animación: Motion es declarativo y entiende el ciclo de
vida de React (ideal para componentes que aparecen/desaparecen y gestos). GSAP es
imperativo y milimétrico (ideal para coreografiar el scroll). Usar cada una en su
terreno da menos código y menos bugs que forzar una para todo. Para animaciones
de scroll, mira la skill `scroll-motion`.

**Aviso de naming:** Framer Motion se renombró a **Motion** en 2024. El import es
`motion/react`, NO `framer-motion`. Si ves tutoriales con `framer-motion`, son
antiguos pero la API es casi idéntica.

## Instalación

```bash
# Base (Vite + React + TS)
npm create vite@latest mi-web -- --template react-ts
cd mi-web && npm install

# Tailwind v4 (plugin oficial de Vite, NO el flujo antiguo de postcss)
npm install tailwindcss @tailwindcss/vite

# Animación
npm install motion gsap lenis
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

En Tailwind v4 el CSS se importa con una sola línea (sin `tailwind.config.js`
obligatorio; la config es CSS-first con `@theme`):

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --font-display: "Inter", sans-serif;
  --color-ink: #0a0a0a;
  --color-paper: #fafafa;
}
```

## Integrar Lenis con GSAP (el paso que todo el mundo hace mal)

Si usas Lenis y GSAP ScrollTrigger a la vez, tienen que compartir el mismo
"reloj". Si no, el scroll y las animaciones se desincronizan. Este es el patrón
canónico — mételo una vez en el arranque de la app:

```ts
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

Con esto, Lenis conduce el rAF y ScrollTrigger se actualiza en el mismo frame.

## Reglas de higiene

- **Respeta `prefers-reduced-motion`.** No es opcional: hay usuarios que se marean.
  Envuelve las animaciones grandes en un check y, si está activo, salta a estado final.
- **No animes `top`/`left`/`width`/`height`.** Usa `transform` y `opacity` — son
  las únicas propiedades que el navegador anima en la GPU sin recalcular layout.
- **Limpia siempre.** En React, cada efecto que crea un ScrollTrigger o listener
  debe devolverlo en el cleanup del `useEffect` (usa `gsap.context()` o
  `ScrollTrigger.getAll().forEach(t => t.kill())`).
- **Mide antes de meter WebGL/3D.** Three.js/R3F son geniales para portfolios y
  experiencias, pero pesan y complican. No los añadas "por si acaso".

## Cuándo NO complicarse

Para muchas webs elegantes basta con Tailwind + un puñado de transiciones CSS y
`scroll` nativo con `scroll-behavior: smooth` + animaciones de entrada con la API
nativa de scroll-driven animations o AOS. Si el sitio no vive de la animación,
empieza minimalista y añade Motion/GSAP solo donde aporte. Ver `references/decision-tree.md`.
