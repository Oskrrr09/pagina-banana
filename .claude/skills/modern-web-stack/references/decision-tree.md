# Árbol de decisión rápido

## ¿Qué framework?
- ¿Necesito rutas con datos de servidor, auth o SSR real? → **Next.js**
- ¿Es contenido/marketing con poco JS (blog, docs)? → **Astro**
- Todo lo demás (landing, portfolio, web muy visual) → **Vite + React**

## ¿Qué librería de animación para esta cosa concreta?
- Aparece/desaparece un componente, modal, menú → **Motion** (`AnimatePresence`)
- Hover, tap, drag, arrastrar → **Motion** (gestos)
- El layout cambia y quiero que "fluya" (reordenar grid) → **Motion** (`layout`)
- Se dispara al hacer scroll a una sección → **GSAP ScrollTrigger** (ver `scroll-motion`)
- Timeline con 10 pasos coreografiados → **GSAP timeline**
- Solo quiero smooth scroll con inercia → **Lenis** (y nada más)
- Fade-in simple al entrar en viewport → CSS nativo `animation-timeline: view()` o Motion `whileInView`

## ¿Necesito de verdad GSAP?
Si tus animaciones de scroll son solo "aparecer al hacer scroll", Motion
`whileInView` o CSS scroll-driven animations bastan y ahorras una dependencia.
Añade GSAP cuando necesites **pin** (fijar una sección mientras scrolleas),
**scrub** (progreso ligado a la posición exacta del scroll) o secuencias largas.

## ¿WebGL / Three.js?
Solo si el sitio ES la experiencia 3D (portfolio de motion, producto hero
interactivo, visualización espacial). Coste: bundle grande, complejidad de
rendimiento, más superficie de bugs. Para un shader de fondo sutil, considera
antes un `<canvas>` 2D o un gradiente animado en CSS.
