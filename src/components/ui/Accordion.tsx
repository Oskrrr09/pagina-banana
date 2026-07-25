import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { Icon } from './Icon'

// Acordeón (§5.5 / §6): flecha que rota al abrir, transición de altura suave.
// aria-expanded para lectores de pantalla (§9.4).

interface AccordionItem {
  q: string
  a: string
  note?: string
}

export function Accordion({ items, defaultOpen = -1 }: { items: AccordionItem[]; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen)
  const baseId = useId()

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i
        const panelId = `${baseId}-panel-${i}`
        const btnId = `${baseId}-btn-${i}`
        return (
          <div key={i}>
            <h3 className="m-0">
              <button
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold text-ink"
              >
                <span>{item.q}</span>
                <Icon
                  name="chevron-down"
                  className={`shrink-0 text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 pr-8 text-[15px] leading-relaxed text-muted">
                    {item.a}
                    {item.note && (
                      <span className="mt-2 block text-xs italic text-muted/80">Nota: {item.note}</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
