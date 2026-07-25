import { motion } from 'motion/react'
import type { ReactNode } from 'react'

// Reveal al entrar en viewport (skill scroll-motion). once: no se re-anima
// al volver a subir. Se respeta reduce-motion vía la regla global de index.css
// y el propio Motion, que desactiva la animación bajo esa preferencia.

export function Reveal({
  children,
  delay = 0,
  y = 20,
  className = '',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Contenedor con hijos escalonados (stagger) — skill micro-interactions.
export function StaggerGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8% 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
