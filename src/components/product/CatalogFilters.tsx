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

  const etiquetaOrden = ORDENES.find((o) => o.valor === filtros.orden) ?? ORDENES[0]

  return (
    <div className="mb-3">
      {/* UNA FILA, NO TRES.
          Antes esto ocupaba «Filtrar», una etiqueta con un `<select>` y el
          recuento, cada uno con su alto: ~130 px sumando separaciones, justo
          por delante del primer producto. En 320 px eso bastaba para que no
          entrara ni una tarjeta.

          La funcionalidad no cambia: los mismos filtros, los mismos tres
          órdenes y el mismo estado en la URL. Lo que cambia es que ahora son
          dos controles táctiles del mismo alto y el catálogo empieza justo
          debajo. */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setAbierto(true)}>
          <Icon name="filter" size={16} />
          {t('catalog.filter')}
          {activos > 0 && (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">
              {activos}
            </span>
          )}
        </Button>

        {/* El orden deja de ser un `<select>` de formulario y pasa a la misma
            hoja que los filtros. Sigue siendo alcanzable de un toque y sigue
            escribiéndose en la URL; lo que se va es el lenguaje de escritorio
            —y con él el problema de ancho intrínseco que obligaba a `min-w-0`
            en tres sitios para que «Orden del catálogo» no desbordara a 320—. */}
        {/* EL VALOR SÓLO SE ENSEÑA CUANDO DICE ALGO
            Poner siempre el orden actual dentro del botón parecía informativo y
            a 320 px reventaba: «Ordenar · Orden del catálogo» no cabe, y el
            texto se salía del control en tres líneas. Medido en la captura de
            la Fase A.

            Además el valor por defecto no aporta —«Orden del catálogo» es
            justamente «no he ordenado nada»—, así que se enseña sólo cuando hay
            un orden elegido, y truncado. `min-w-0` porque un elemento flexible
            no encoge por debajo de su contenido sin él. */}
        <Button variant="secondary" size="sm" className="min-w-0" onClick={() => setAbierto(true)}>
          <span className="truncate">
            {t('catalog.sort')}
            {filtros.orden !== 'catalogo' && (
              <span className="font-normal text-muted"> · {t(etiquetaOrden.clave)}</span>
            )}
          </span>
          <Icon name="chevron-down" size={14} aria-hidden="true" className="shrink-0" />
        </Button>
      </div>

      {/* El recuento se anuncia, pero ya no ocupa una tercera pieza delante del
          producto: quien ve la rejilla los está contando con los ojos. Para
          lector de pantalla no cambia nada. */}
      <p aria-live="polite" className="sr-only">
        {t('catalog.showing', { visibles: totalVisible, total: totalSin })}
      </p>

      <Modal open={abierto} onClose={() => setAbierto(false)} title={t('catalog.filter')}>
        <fieldset className="border-0 p-0">
          <legend className="text-sm font-bold text-ink">{t('catalog.sort')}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ORDENES.map((o) => (
              <Chip
                key={o.valor}
                selected={filtros.orden === o.valor}
                onClick={() => onCambiar({ ...filtros, orden: o.valor })}
              >
                {t(o.clave)}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6 border-0 p-0">
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
