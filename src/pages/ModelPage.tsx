import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Chip } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { StockIndicator } from '../components/ui/StockIndicator'
import { ProvisionalBadge } from '../components/ui/Tag'
import { StorePicker } from '../components/product/StorePicker'
import { FinanceSimulator } from '../components/product/FinanceSimulator'
import { getModel, familyInfo, variantPath } from '../data/products'
import { getAccessoriesForModel, accessoryPath } from '../data/accessories'
import { AccessoryImage } from '../components/product/AccessoryImage'
import type { ColorVariant, Model } from '../data/types'
import { useStore } from '../lib/store'
import { euro } from '../lib/format'
import { NotFound } from './NotFound'

type SortKey = 'relevancia' | 'precio' | 'novedad'

export function ModelPage() {
  const t = useT()
  const { family: familySlug, model: modelSlug } = useParams()
  const family = familyInfo(familySlug ?? '')
  const model = getModel(familySlug ?? '', modelSlug ?? '')

  const [capFilter, setCapFilter] = useState<string | null>(null)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('relevancia')

  const allCapacities = useMemo(() => {
    if (!model) return []
    const set = new Set<string>()
    model.colors.forEach((c) => c.capacities.forEach((cap) => set.add(cap.capacity)))
    return [...set]
  }, [model])

  if (!family || !model) return <NotFound />

  const colors = [...model.colors].sort((a, b) => {
    if (sort === 'precio') return a.capacities[0].price - b.capacities[0].price
    return 0
  })

  return (
    <>
      <Container className="py-8">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink">{model.name}</h1>
            <p className="mt-1 max-w-xl text-muted">{model.tagline}</p>
          </div>
        </div>

        {/* Barra de filtros y orden */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-6">
          {allCapacities.map((cap) => (
            <Chip key={cap} selected={capFilter === cap} onClick={() => setCapFilter(capFilter === cap ? null : cap)}>
              {cap}
            </Chip>
          ))}
          <Chip selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)}>
            En stock
          </Chip>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-muted">
              Ordenar
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 rounded-[12px] border border-line bg-surface px-3 text-sm outline-none"
            >
              <option value="relevancia">{t('product.sortRelevance')}</option>
              <option value="precio">{t('product.sortPrice')}</option>
              <option value="novedad">{t('product.new')}</option>
            </select>
          </div>
        </div>

        {/* Agrupación por color */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {colors.map((color) => (
            <ColorCard
              key={color.color}
              family={family.slug}
              model={model}
              color={color}
              capFilter={capFilter}
              inStockOnly={inStockOnly}
            />
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          Consulta rápida: cada tarjeta permite ver stock por tienda y la cuota de financiación sin salir de la
          página.
        </p>

        <CompatibleAccessoriesSection family={family.slug} modelSlug={model.slug} />
      </Container>
    </>
  )
}

// Tarjeta de color con selector de capacidad embebido (§4.6).
function ColorCard({
  family,
  model,
  color,
  capFilter,
  inStockOnly,
}: {
  family: string
  model: Model
  color: ColorVariant
  capFilter: string | null
  inStockOnly: boolean
}) {
  const t = useT()
  const { toggleFavorite, isFavorite, toggleCompare, isComparing, compareFull } = useStore()
  const navigate = useNavigate()
  const [storeOpen, setStoreOpen] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(false)

  // Respeta el filtro de capacidad: si está activo y esta capacidad no existe, la 1ª válida
  const initialCap =
    (capFilter && color.capacities.find((c) => c.capacity === capFilter)) || color.capacities[0]
  const [selectedCap, setSelectedCap] = useState(initialCap.capacity)
  const current = color.capacities.find((c) => c.capacity === selectedCap) ?? color.capacities[0]

  // Si el filtro "en stock" oculta este color entero (todas agotadas), no lo mostramos
  if (inStockOnly && color.capacities.every((c) => c.availability === 'agotado')) return null
  if (capFilter && !color.capacities.some((c) => c.capacity === capFilter)) return null

  const favId = `${family}/${model.slug}/${color.color}`
  const compareId = `${family}/${model.slug}/${color.color}/${current.capacity}`
  const needsReservation = current.availability !== 'disponible'

  const openVariant = () =>
    navigate(variantPath(model, color, current))

  return (
    <div className="flex flex-col rounded-[12px] border border-line bg-surface p-5 shadow-[var(--shadow-rest)]">
      <div className="relative">
        <button
          onClick={() => toggleFavorite(favId)}
          aria-label={isFavorite(favId) ? t('favorites.remove') : t('favorites.add')}
          aria-pressed={isFavorite(favId)}
          className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface/80 text-muted backdrop-blur hover:text-danger"
        >
          <Icon name="heart" className={isFavorite(favId) ? 'fill-danger text-danger' : ''} />
        </button>
        <ProductImage src={color.image} alt={`${model.name} · ${color.name}`} ratio="4 / 3" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: color.hex }} aria-hidden />
        <h2 className="font-semibold text-ink">
          {model.name} · {color.name}
        </h2>
      </div>

      {/* Selector de capacidad */}
      <p className="mt-4 mb-2 text-xs font-semibold text-muted">{t('product.chooseCapacity')}</p>
      <div className="flex flex-wrap gap-2">
        {color.capacities.map((cap) => (
          <Chip
            key={cap.capacity}
            selected={cap.capacity === selectedCap}
            onClick={() => setSelectedCap(cap.capacity)}
            ariaLabel={`${cap.capacity} · ${euro(cap.price)}`}
          >
            {cap.capacity}
          </Chip>
        ))}
      </div>

      {/* Precio + disponibilidad (se actualizan al instante) */}
      <div className="mt-4 flex items-end gap-2">
        <span className="text-2xl font-bold text-ink">{euro(current.price)}</span>
        {current.previousPrice && (
          <span className="pb-1 text-sm text-muted line-through">{euro(current.previousPrice)}</span>
        )}
      </div>
      <div className="mt-1">
        <ProvisionalBadge label="Precio demostrativo" />
      </div>
      <div className="mt-3">
        <StockIndicator status={current.availability} note={current.availabilityNote} size="sm" />
      </div>

      {/* Acciones */}
      <div className="mt-5 flex flex-col gap-2">
        {/* Sin stock inmediato se reserva en vez de comprar. El flujo
            completo vive en la ficha, así que aquí solo se navega. */}
        <Button onClick={openVariant} variant={needsReservation ? 'secondary' : 'primary'}>
          {needsReservation ? t('common.reserve') : t('common.buy')}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setStoreOpen(true)} className="font-semibold text-ink hover:underline">
            Ver stock por tienda ›
          </button>
          <button onClick={() => setFinanceOpen(true)} className="text-muted hover:text-ink">
            desde {euro(model.financeFrom.monthly)}/mes*
          </button>
        </div>
        <label className="mt-1 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={isComparing(compareId)}
            disabled={!isComparing(compareId) && compareFull}
            onChange={() =>
              toggleCompare({
                id: compareId,
                modelSlug: model.slug,
                family,
                name: model.name,
                color: color.name,
                capacity: current.capacity,
                price: current.price,
                specs: model.specs,
              })
            }
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          Añadir a comparar
          {!isComparing(compareId) && compareFull && <span className="text-xs">(máx. 3)</span>}
        </label>
      </div>

      <StorePicker
        open={storeOpen}
        onClose={() => setStoreOpen(false)}
        variantLabel={`${model.name} ${current.capacity} ${color.name}`}
      />
      <FinanceSimulator
        open={financeOpen}
        onClose={() => setFinanceOpen(false)}
        price={current.price}
        productName={`${model.name} ${current.capacity} · ${color.name}`}
      />
    </div>
  )
}

// Sección "Accesorios compatibles" en la ficha del dispositivo (§4.5).
// Muestra hasta 4 accesorios: primero compatibilidad exacta con el modelo,
// después compatibilidad por familia. Sin lógica de carrito ni favoritos.
function CompatibleAccessoriesSection({
  family,
  modelSlug,
}: {
  family: string
  modelSlug: string
}) {
  const t = useT()
  const items = getAccessoriesForModel(`${family}/${modelSlug}`).slice(0, 4)
  if (items.length === 0) return null
  return (
    <section aria-labelledby="compat-accessories" className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="compat-accessories" className="text-xl font-bold text-ink">
          Accesorios compatibles
        </h2>
        <Link
          to="/accesorios"
          className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
        >
          {t('common.allAccessories')}
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((a) => (
          <li key={a.slug}>
            <Link
              to={accessoryPath(a.slug)}
              className="flex h-full flex-col overflow-hidden rounded-[12px] border border-line bg-surface hover:border-ink/30"
            >
              <AccessoryImage
                src={a.image}
                alt={a.name}
                size="card"
                presentation={a.imagePresentation}
                imageBg={a.imageBg}
                width={400}
                height={400}
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-ink">{a.name}</p>
                {a.price != null && (
                  <p className="mt-1 text-xs text-muted">{euro(a.price)} · precio demostrativo</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
