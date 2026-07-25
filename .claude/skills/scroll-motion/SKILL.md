---
name: scroll-motion
description: >-
  Recetas listas para animaciones ligadas al scroll en webs modernas: reveals al
  entrar en viewport, parallax, secciones que se fijan (pin/sticky), progreso de
  scroll (scrub), scrollytelling y transiciones entre secciones. Úsalo cuando el
  usuario pida "que aparezca al hacer scroll", "efecto parallax", "que se quede
  fija esta sección", "scroll suave con animaciones", "tipo storytelling" o
  cualquier movimiento disparado por el scroll. Da el código concreto con GSAP
  ScrollTrigger, Motion o CSS scroll-driven, y dice cuál usar en cada caso.
---

# Scroll Motion

El scroll-driven UI es de las señas de identidad de las webs de 2025-2026: el
contenido se revela progresivamente y las animaciones responden a la posición del
scroll. La clave es elegir la herramienta más ligera que resuelva el efecto.

Prerrequisito: el stack y la integración Lenis+GSAP están en la skill
`modern-web-stack`. Aquí van los efectos concretos.

## Elegir herramienta por efecto

| Efecto | Herramienta más simple |
|--------|------------------------|
| Fade/slide-in al entrar en viewport | CSS scroll-driven **o** Motion `whileInView` |
| Parallax suave de un elemento | Motion `useScroll` + `useTransform` |
| Fijar (pin) una sección mientras scrolleas | **GSAP ScrollTrigger** (`pin: true`) |
| Progreso exacto ligado al scroll (scrub) | **GSAP ScrollTrigger** (`scrub: true`) |
| Barra de progreso de lectura | Motion `useScroll` (`scrollYProgress`) |
| Scrollytelling (texto + visual sincronizados) | GSAP timeline + ScrollTrigger |

Principio: **CSS nativo si puedes, Motion si es React puro, GSAP si necesitas pin
o scrub.** No metas GSAP para un simple fade-in.

## Receta 1 — Reveal al entrar en viewport (Motion)

Lo más común. `whileInView` con `once` para que no se re-anime al volver a subir:

```tsx
import { motion } from 'motion/react'

export function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
```

El `ease: [0.22, 1, 0.36, 1]` (easeOutExpo aprox.) es lo que hace que se sienta
"caro": arranca rápido y frena suave. Evita `ease: 'linear'` para reveals.

## Receta 1b — Reveal solo con CSS (cero JS)

Si no quieres dependencia, la API nativa de scroll-driven animations:

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}
@media (prefers-reduced-motion: reduce) {
  .reveal { animation: none; }
}
```

## Receta 2 — Parallax (Motion)

```tsx
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

export function Parallax({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.img src={src} style={{ y }} className="w-full will-change-transform" />
    </div>
  )
}
```

Mantén el desplazamiento sutil (±10-20%). Parallax exagerado marea y se ve barato.

## Receta 3 — Pin + scrub (GSAP): la sección que se queda fija

El efecto de "sección que se congela mientras el contenido de dentro avanza".
Requiere GSAP (Motion no fija el scroll de forma nativa):

```tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function PinnedSection() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const panels = gsap.utils.toArray<HTMLElement>('.panel')
    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: root.current,
        pin: true,
        scrub: 1,          // liga la animación a la posición del scroll (con inercia)
        end: () => '+=' + root.current!.offsetWidth,
      },
    })
  }, { scope: root })

  return (
    <div ref={root} className="overflow-hidden">
      <div className="flex">
        <section className="panel min-w-screen h-screen">1</section>
        <section className="panel min-w-screen h-screen">2</section>
        <section className="panel min-w-screen h-screen">3</section>
      </div>
    </div>
  )
}
```

`scrub: 1` da un segundo de "catch-up" suave; `scrub: true` lo liga 1:1.
`useGSAP` limpia automáticamente todos los ScrollTriggers al desmontar — usarlo
en lugar de `useEffect` evita el bug #1 de fugas de memoria en React.

## Receta 4 — Barra de progreso de lectura (Motion)

```tsx
import { motion, useScroll } from 'motion/react'

export function ProgressBar() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className="fixed top-0 left-0 right-0 h-1 bg-ink origin-left z-50"
    />
  )
}
```

## Higiene (repetido porque importa)

- **`prefers-reduced-motion`:** para reveals, degrada a mostrar el contenido ya
  visible; para parallax/pin, desactiva el efecto. Un usuario con vestibular
  disorder no debería sufrir tu web.
- **`will-change: transform`** solo en elementos que de verdad se animan, y quítalo
  después si es posible — abusar de él consume memoria de GPU.
- **`ScrollTrigger.refresh()`** tras cargar fuentes/imágenes que cambian la altura,
  o los triggers se calculan sobre un layout viejo.
- No animes más de lo que se ve. Si tienes 50 reveals, usa `once: true` y `margin`
  para no tener 50 observers activos calculando a la vez.

Más patrones (scrollytelling, horizontal galleries, text splitting) en
`references/patterns.md`.
