import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Chip } from '../components/ui/Chip'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { useStore } from '../lib/store'
import { families, getFamilyModels, familyInfo, developedFamilies, productImage } from '../data/products'
import type { Model } from '../data/types'
import { euro } from '../lib/format'

// Comparador (§4.8): hasta 3 columnas del MISMO tipo de producto. Incluye un
// selector integrado para añadir modelos sin salir de la página, de modo que
// se pueda comparar desde aquí directamente.
export function ComparePage() {
  const { compare, toggleCompare, removeCompare, addToCart, compareFull } = useStore()
  const [params, setParams] = useSearchParams()

  // Familia activa: la de los productos ya añadidos o, si está vacío, la del
  // parámetro ?familia= (o iPhone por defecto).
  const paramFamily = params.get('familia') ?? ''
  const activeFamily = compare.length > 0 ? compare[0].family : developedFamilies.includes(paramFamily) ? paramFamily : 'iphone'
  const family = familyInfo(activeFamily)

  const models = getFamilyModels(activeFamily)
  const comparableFamilies = families.filter((f) => developedFamilies.includes(f.slug) && getFamilyModels(f.slug).length > 1)

  // Convierte un modelo en un ítem de comparación usando su primera variante.
  function compareItemFor(model: Model) {
    const color = model.colors[0]
    const capacity = color.capacities[0]
    return {
      id: `${model.family}/${model.slug}/${color.color}/${capacity.capacity}`,
      modelSlug: model.slug,
      family: model.family,
      name: model.name,
      color: color.name,
      capacity: capacity.capacity,
      price: capacity.price,
      specs: model.specs,
    }
  }

  const addedModelSlugs = useMemo(() => new Set(compare.map((c) => c.modelSlug)), [compare])
  const pickable = models.filter((m) => !addedModelSlugs.has(m.slug))

  // Filas de características (unión de etiquetas de los productos comparados)
  const specLabels = Array.from(new Set(compare.flatMap((c) => c.specs.map((s) => s.label))))
  const valuesFor = (label: string) => compare.map((c) => c.specs.find((s) => s.label === label)?.value ?? '—')
  const allSame = (vals: string[]) => vals.every((v) => v === vals[0])

  function switchFamily(slug: string) {
    setParams(slug === 'iphone' ? {} : { familia: slug })
  }

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">Comparador</h1>
      <p className="mt-1 text-muted">
        Compara hasta 3 productos del mismo tipo, lado a lado. Elige un modelo abajo para empezar.
      </p>

      {/* Selector de familia (solo cuando aún no hay nada añadido) */}
      {compare.length === 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">Tipo de producto:</span>
          {comparableFamilies.map((f) => (
            <Chip key={f.slug} selected={f.slug === activeFamily} onClick={() => switchFamily(f.slug)}>
              {f.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Tabla comparativa (cuando hay al menos un producto) */}
      {compare.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="mx-auto w-auto border-collapse">
            <thead>
              <tr>
                <th className="w-32 p-3 text-left align-bottom text-sm font-medium text-muted">Producto</th>
                <AnimatePresence mode="popLayout" initial={false}>
                  {compare.map((c) => (
                    <motion.th
                      key={c.id}
                      layout
                      initial={{ opacity: 0, scale: 0.85, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="w-56 p-3 align-bottom"
                    >
                      <div className="relative rounded-[12px] border border-line p-3 pt-4">
                        <button
                          onClick={() => removeCompare(c.id)}
                          aria-label={`Quitar ${c.name}`}
                          className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full border border-line bg-surface text-muted shadow-[var(--shadow-rest)] transition-colors hover:border-danger hover:text-danger"
                        >
                          <Icon name="close" size={15} />
                        </button>
                        <ProductImage src={productImage(c.modelSlug, c.color)} alt={c.name} ratio="4 / 3" />
                        <p className="mt-2 text-left text-sm font-bold text-ink">{c.name}</p>
                        <p className="text-left text-xs text-muted">
                          {c.capacity} · {c.color}
                        </p>
                        <p className="mt-1 text-left font-bold text-ink">{euro(c.price)}</p>
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() =>
                            addToCart({
                              id: c.id,
                              modelSlug: c.modelSlug,
                              family: c.family,
                              name: c.name,
                              color: c.color,
                              capacity: c.capacity,
                              price: c.price,
                              previousPrice: null,
                            })
                          }
                        >
                          Comprar
                        </Button>
                      </div>
                    </motion.th>
                  ))}
                </AnimatePresence>
                {compare.length < 3 && pickable.length > 0 && (
                  <th className="w-56 p-3 align-middle">
                    <div className="grid h-full min-h-[180px] place-items-center rounded-[12px] border border-dashed border-line px-3 text-center text-sm text-muted">
                      Añade otro modelo desde la lista de abajo ↓
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
                  Precio
                </th>
                {compare.map((c) => (
                  <td key={c.id} className="p-3 font-bold text-ink">
                    {euro(c.price)}
                  </td>
                ))}
                {compare.length < 3 && pickable.length > 0 && <td />}
              </tr>
              {specLabels.map((label) => {
                const vals = valuesFor(label)
                const same = allSame(vals)
                return (
                  <tr key={label} className="border-t border-line">
                    <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
                      {label}
                    </th>
                    {vals.map((v, i) => (
                      <td
                        key={i}
                        className={`p-3 text-sm ${same ? 'text-ink' : 'bg-action-050 font-semibold text-action-600'}`}
                      >
                        {v}
                      </td>
                    ))}
                    {compare.length < 3 && pickable.length > 0 && <td />}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {compare.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <ProvisionalBadge label="Precio demostrativo" />
          <span className="text-xs text-muted">Las diferencias entre columnas aparecen resaltadas.</span>
        </div>
      )}

      {/* Selector integrado: añade modelos de la familia activa */}
      <div className="mt-10 border-t border-line pt-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {compare.length === 0 ? `Elige modelos de ${family?.name}` : `Añadir otro ${family?.name}`}
            </h2>
            <p className="text-sm text-muted">
              {compare.length >= 3
                ? 'Has alcanzado el máximo de 3 productos.'
                : 'Toca un modelo para añadirlo a la comparación.'}
            </p>
          </div>
          {compare.length > 0 && (
            <span className="text-sm text-muted">
              {compare.length}/3 · {family?.name}
            </span>
          )}
        </div>

        {pickable.length === 0 ? (
          <p className="mt-6 rounded-[12px] bg-neutral p-4 text-sm text-muted">
            No quedan más modelos de {family?.name} para añadir.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {pickable.map((m) => {
                const disabled = compareFull
                return (
                  <motion.button
                    key={m.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => !disabled && toggleCompare(compareItemFor(m))}
                    disabled={disabled}
                    className="group flex flex-col rounded-[12px] border border-line bg-surface p-3 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-banana hover:shadow-[var(--shadow-raised)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ProductImage src={m.colors[0].image} alt={m.name} ratio="4 / 3" />
                    <p className="mt-2 text-sm font-semibold text-ink">{m.name}</p>
                    <p className="text-xs text-muted">desde {euro(m.fromPrice)}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      <Icon name="plus" size={14} /> Añadir a comparar
                    </span>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Container>
  )
}
