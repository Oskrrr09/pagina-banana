---
name: micro-interactions
description: >-
  Detalles de interacción que hacen que una web se sienta pulida y "cara":
  estados hover/focus/active, botones magnéticos, cursor personalizado, ripples,
  transiciones de tema, feedback de carga, spring physics y stagger. Úsalo cuando
  el usuario pida que algo "se sienta premium/vivo", pida efectos de hover,
  "botón magnético", "cursor custom", micro-animaciones, o cuando una UI funcione
  pero se sienta plana/estática. Da el código con Motion y CSS, con foco en que
  sea sutil, accesible y rápido — no un circo.
---

# Micro-interactions

La diferencia entre una web que funciona y una que se siente premium está casi
siempre en las micro-interacciones: el feedback de 200ms cuando pasas el ratón,
el botón que "cede" al pulsarlo, el estado de carga que no te deja en el vacío.
Son baratas de añadir y es lo que la gente percibe como "calidad", aunque no sepa
nombrarlo.

Regla que gobierna todo esto: **sutil y rápido gana a llamativo y lento.** Una
micro-interacción que se nota demasiado o dura demasiado molesta al segundo uso.

## Timing: los números que importan

- **Hover/estado:** 150-250ms. Menos se pierde, más se siente lento.
- **Enter/exit de elementos:** 200-400ms.
- **Easing:** casi nunca `linear`. Para entradas usa ease-out (arranca rápido,
  frena suave): `cubic-bezier(0.22, 1, 0.36, 1)`. Para cosas que "rebotan" usa
  spring, no una curva.
- **Feedback de pulsación (active):** inmediato, <100ms, sin delay.

## 1. Hover states que no son perezosos

El hover por defecto (cambiar color de fondo) es el mínimo. Un paso más:

```css
.btn {
  transition: transform var(--duration-fast) var(--ease-out-expo),
              background-color var(--duration-fast) ease;
}
.btn:hover { transform: translateY(-2px); }
.btn:active { transform: translateY(0); }   /* "cede" al pulsar */
```

Para enlaces, el subrayado que crece desde un lado se ve mucho mejor que
`text-decoration`:

```css
.link {
  background: linear-gradient(currentColor 0 0) no-repeat left bottom / 0% 1px;
  transition: background-size var(--duration-base) var(--ease-out-expo);
}
.link:hover { background-size: 100% 1px; }
```

## 2. Botón magnético (Motion)

El botón que se acerca sutilmente al cursor. Emblema de las webs Awwwards. Clave:
mantenerlo **sutil** (el elemento se mueve poco) y con spring para que vuelva:

```tsx
import { motion, useMotionValue, useSpring } from 'motion/react'

export function MagneticButton({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 300, damping: 20 })
  const sy = useSpring(y, { stiffness: 300, damping: 20 })

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3)   // 0.3 = fuerza; no subas de 0.4
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3)
  }
  function reset() { x.set(0); y.set(0) }

  return (
    <motion.button style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={reset}>
      {children}
    </motion.button>
  )
}
```

Desactívalo en touch (no hay cursor) y con `prefers-reduced-motion`.

## 3. Stagger — revelar en cascada

Cuando aparecen varios elementos (lista, grid, nav), que salgan escalonados se ve
infinitamente mejor que todos a la vez:

```tsx
import { motion } from 'motion/react'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export function StaggerList({ items }: { items: string[] }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map((t) => <motion.li key={t} variants={item}>{t}</motion.li>)}
    </motion.ul>
  )
}
```

## 4. Spring physics en vez de duración

Para cosas que se agarran/sueltan (drag, toggles, elementos que siguen al cursor),
un spring se siente natural donde una curva de duración fija se siente robótica:

```tsx
<motion.div animate={{ scale: open ? 1 : 0.9 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
```

Más `stiffness` = más rápido/tenso; más `damping` = menos rebote. Punto de partida
sano: 300-400 / 20-30.

## 5. Estados de carga con sentido

Nunca dejes al usuario mirando la nada. Para contenido, **skeletons** con un shimmer
sutil se sienten más rápidos que un spinner:

```css
.skeleton {
  background: linear-gradient(90deg, var(--color-line) 25%,
    #f0f0f0 50%, var(--color-line) 75%) 0 0 / 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }
```

Para acciones (enviar formulario), el botón pasa a estado loading (spinner inline
+ deshabilitado), no un overlay que bloquea toda la página.

## 6. Cursor personalizado (con cabeza)

Un cursor custom que sigue al ratón con lag puede quedar precioso en una web de
marca/portfolio, pero es fácil que estorbe. Reglas: que NO oculte el cursor nativo
en elementos interactivos donde el usuario necesita precisión, desactívalo en touch,
y que crezca/cambie sobre enlaces para dar feedback en vez de ser mera decoración.

## Accesibilidad — no negociable

- **`:focus-visible`** siempre visible y claro. Mucha web bonita elimina el outline
  y deja a los usuarios de teclado ciegos. Estiliza el foco, no lo borres.
- **`prefers-reduced-motion`:** envuelve las animaciones grandes; en móvil/touch
  desactiva magnético y cursor custom.
- **No dependas solo del hover** para revelar info importante — en touch no existe.
- **Área de toque mínima 44×44px** en controles.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

El objetivo de todo esto es que la web se sienta viva y responda, no que haga
malabares. Si una micro-interacción llama la atención sobre sí misma en vez de
sobre el contenido, quítala.
