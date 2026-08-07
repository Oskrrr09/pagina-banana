import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Icon } from '../ui/Icon'
import { euro } from '../../lib/format'
import { useIdioma } from '../../lib/i18n'
import {
  FILTROS_VACIOS,
  TRAMOS_PRECIO,
  cuentaFiltrosActivos,
  type Disponibilidad,
  type FiltrosCatalogo,
  type Orden,
} from '../../lib/catalogFilters'

// Controles de «Filtrar» y «Ordenar» del catálogo de una familia.
//
// El panel reutiliza `Modal`, que en móvil ya se abre como hoja desde abajo y
// se encarga de atrapar el foco, cerrar con Escape y devolver el foco al botón
// que lo abrió. Escribir otra hoja aquí habría significado repetir —y con
// suerte acertar— toda esa parte de accesibilidad.
//
// Los filtros que se ofrecen son los que el catálogo puede sostener; el porqué
// de los que faltan está en `lib/catalogFilters.ts`.

// Se reutilizan las etiquetas de disponibilidad que ya usa la ficha de
// producto: el mismo estado debe llamarse igual en toda la tienda.
const DISPONIBILIDADES: {
  valor: Disponibilidad
  clave: 'availability.inStock' | 'availability.backorder' | 'availability.soldOut'
}[] = [
  { valor: 'disponible', clave: 'availability.inStock' },
  { valor: 'bajo-pedido', clave: 'availability.backorder' },
  { valor: 'agotado', clave: 'availability.soldOut' },
]

const ORDENES: { valor: Orden; clave: 'catalog.sort.default' | 'catalog.sort.priceAsc' | 'catalog.sort.priceDesc' }[] =
  [
    { valor: 'catalogo', clave: 'catalog.sort.default' },
    { valor: 'precio-asc', clave: 'catalog.sort.priceAsc' },
    { valor: 'precio-desc', clave: 'catalog.sort.priceDesc' },
  ]

export function CatalogFilters({
  filtros,
  onCambiar,
  totalVisible,
  totalSin,
}: {
  filtros: FiltrosCatalogo
  onCambiar: (siguiente: FiltrosCatalogo) => void
  totalVisible: number
  totalSin: number
}) {
  const { t, intl } = useIdioma()
  const [abierto, setAbierto] = useState(false)
  const activos = cuentaFiltrosActivos(filtros)

  const alternarDisponibilidad = (valor: Disponibilidad) => {
    const ya = filtros.disponibilidad.includes(valor)
    onCambiar({
      ...filtros,
      disponibilidad: ya ? filtros.disponibilidad.filter((v) => v !== valor) : [...filtros.disponibilidad, valor],
    })
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setAbierto(true)}>
          <Icon name="filter" size={16} />
          {t('catalog.filter')}
          {activos > 0 && (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">
              {activos}
            </span>
          )}
        </Button>

        {/* El orden no se esconde tras el panel: se cambia de un toque. */}
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>{t('catalog.sort')}</span>
          <select
            value={filtros.orden}
            onChange={(e) => onCambiar({ ...filtros, orden: e.target.value as Orden })}
            className="h-9 rounded-[10px] border border-line bg-surface px-2 text-sm font-semibold text-ink"
          >
            {ORDENES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {t(o.clave)}
              </option>
            ))}
          </select>
        </label>

        {/* `aria-live`: al filtrar, el recuento cambia sin mover el foco, así
            que hay que anunciarlo o quien use lector de pantalla no se entera. */}
        <p aria-live="polite" className="text-sm text-muted">
          {t('catalog.showing', { visibles: totalVisible, total: totalSin })}
        </p>

        {activos > 0 && (
          <Button variant="tertiary" size="sm" onClick={() => onCambiar({ ...FILTROS_VACIOS, orden: filtros.orden })}>
            {t('catalog.clearFilters')}
          </Button>
        )}
      </div>

      <Modal open={abierto} onClose={() => setAbierto(false)} title={t('catalog.filter')}>
        <fieldset className="border-0 p-0">
          <legend className="text-sm font-bold text-ink">{t('catalog.maxPrice')}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip selected={filtros.precioMax == null} onClick={() => onCambiar({ ...filtros, precioMax: null })}>
              {t('catalog.anyPrice')}
            </Chip>
            {TRAMOS_PRECIO.map((tope) => (
              <Chip
                key={tope}
                selected={filtros.precioMax === tope}
                onClick={() => onCambiar({ ...filtros, precioMax: tope })}
              >
                {t('catalog.upTo', { precio: euro(tope, intl) })}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6 border-0 p-0">
          <legend className="text-sm font-bold text-ink">{t('catalog.availability')}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DISPONIBILIDADES.map((d) => (
              <Chip
                key={d.valor}
                selected={filtros.disponibilidad.includes(d.valor)}
                onClick={() => alternarDisponibilidad(d.valor)}
              >
                {t(d.clave)}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 flex gap-3">
          <Button variant="secondary" onClick={() => onCambiar({ ...FILTROS_VACIOS, orden: filtros.orden })}>
            {t('catalog.clearFilters')}
          </Button>
          <Button className="flex-1" onClick={() => setAbierto(false)}>
            {t('catalog.showResults', { total: totalVisible })}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
