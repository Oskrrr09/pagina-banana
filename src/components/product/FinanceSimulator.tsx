import { useState } from 'react'
import { euro, monthlyQuote } from '../../lib/format'
import { Modal } from '../ui/Modal'
import { Chip } from '../ui/Chip'
import { ProvisionalBadge } from '../ui/Tag'

// Simulador de financiación (§6): cuota orientativa. La etiqueta "orientativo"
// es siempre legible, no solo en letra pequeña. Sin conexión a financiera real.
const MONTH_OPTIONS = [12, 24, 36]

export function FinanceSimulator({
  open,
  onClose,
  price,
  productName,
}: {
  open: boolean
  onClose: () => void
  price: number
  productName: string
}) {
  const [months, setMonths] = useState(24)
  const quote = monthlyQuote(price, months)

  return (
    <Modal open={open} onClose={onClose} title="Simulador de financiación" dismissable={false}>
      <p className="text-sm text-muted">
        {productName} · {euro(price)}
      </p>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-ink">Número de meses</p>
        <div className="flex flex-wrap gap-2">
          {MONTH_OPTIONS.map((m) => (
            <Chip key={m} selected={months === m} onClick={() => setMonths(m)}>
              {m} meses
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[12px] bg-neutral p-5 text-center">
        <p className="text-sm text-muted">Cuota mensual aproximada</p>
        <p className="mt-1 text-4xl font-bold text-ink">
          {euro(quote)}
          <span className="text-lg font-medium text-muted">/mes</span>
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <ProvisionalBadge label="Precio demostrativo" />
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Cuota <strong>orientativa</strong>. TIN/TAE y comisión de apertura pendientes de validación con Banana
        Computer. La contratación de la financiación se completa hoy de forma <strong>presencial</strong> en
        tienda.
      </p>
    </Modal>
  )
}
