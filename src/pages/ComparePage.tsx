import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useSearchParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Chip } from '../components/ui/Chip'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { useStore } from '../lib/store'
import {
  families,
  getFamilyModels,
  familyInfo,
  developedFamilies,
  productImage,
  variantPath,
} from '../data/products'
import type { Model } from '../data/types'
import { euro } from '../lib/format'
import {
  buildDecisionRows,
  buildDecisionSummary,
  type FamilySlug,
} from '../data/productDecisionData'

// ---------------------------------------------------------------------------
// Comparador esencial (§PR1 del bloque diferencial).
//
// - Pinta las columnas como tarjetas de producto (imagen, nombre, variante,
//   precio, botones ver/comprar/favoritos/eliminar y un selector para sustituir
//   ese modelo por otro de la misma familia).
// - La tabla de características utiliza `productDecisionData.ts` para limitar
//   la comparación a los campos esenciales de cada familia, con el modo "Solo
//   diferencias" activo por defecto.
// - Compatibilidad: no cambia el shape de `CompareItem` (definido en
//   `src/lib/store.tsx`). Los datos esenciales se derivan a partir de
//   `modelSlug` consultando el catálogo, así los usuarios con
//   `banana:compare` guardado antes de esta PR ven la nueva UI sin migración.
// - No modifica seguro, precios, checkout ni catálogo.
// ---------------------------------------------------------------------------

export function ComparePage() {
  const { compare, toggleCompare, removeCompare, addToCart, compareFull, toggleFavorite, isFavorite } =
    useStore()
  const [params, setParams] = useSearchParams()
  const [onlyDifferences, setOnlyDifferences] = useState(true)

  const paramFamily = params.get('familia') ?? ''
  const activeFamily = (compare.length > 0
    ? compare[0].family
    : developedFamilies.includes(paramFamily)
      ? paramFamily
      : 'iphone') as FamilySlug
  const family = familyInfo(activeFamily)

  const models = getFamilyModels(activeFamily)
  const comparableFamilies = families.filter(
    (f) => developedFamilies.includes(f.slug) && getFamilyModels(f.slug).length > 1,
  )

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

  // Contextos de decisión (uno por columna) resueltos desde el catálogo actual.
  const contexts = useMemo(
    () =>
      compare
        .map((c) => models.find((m) => m.slug === c.modelSlug))
        .filter((m): m is Model => Boolean(m))
        .map((model, i) => ({
          model,
          capacity: compare[i]?.capacity ?? null,
          color: compare[i]?.color ?? null,
        })),
    [compare, models],
  )

  const rows = useMemo(
    () => (compare.length > 0 ? buildDecisionRows(contexts, activeFamily, { onlyDifferences }) : []),
    [contexts, activeFamily, onlyDifferences],
  )

  const summary = useMemo(() => buildDecisionSummary(contexts), [contexts])

  function switchFamily(slug: string) {
    setParams(slug === 'iphone' ? {} : { familia: slug })
  }

  function replaceInColumn(currentId: string, newSlug: string) {
    const target = models.find((m) => m.slug === newSlug)
    if (!target) return
    removeCompare(currentId)
    const item = compareItemFor(target)
    // Sólo si aún no está en la comparación (no duplicar).
    if (!addedModelSlugs.has(item.modelSlug) || item.id === currentId) {
      toggleCompare(item)
    }
  }

  return (
    <Container className="py-10">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Comparador
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">
          Compara tus opciones
        </h1>
        <p className="mt-2 text-muted">
          Consulta solo las diferencias que realmente pueden ayudarte a elegir.
        </p>
      </header>

      {/* Estado vacío: selector de familia + primer <select> para añadir
          un modelo sin salir de la página + CTA del futuro asistente. */}
      {compare.length === 0 && (
        <div className="mt-6 rounded-[16px] border border-line bg-neutral p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">Tipo de producto:</span>
            {comparableFamilies.map((f) => (
              <Chip key={f.slug} selected={f.slug === activeFamily} onClick={() => switchFamily(f.slug)}>
                {f.name}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            Elige uno o más modelos abajo para empezar. Cada columna incluye su propio selector
            para sustituir o añadir más productos.
          </p>
          <label className="mt-4 block max-w-sm text-sm text-ink">
            <span className="mb-1 block font-semibold">Primer modelo a comparar</span>
            <select
              aria-label={`Añadir un ${family?.name} a la comparación`}
              className="w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-ink"
              value=""
              onChange={(event) => {
                const slug = event.target.value
                if (!slug) return
                const target = models.find((m) => m.slug === slug)
                if (target) toggleCompare(compareItemFor(target))
              }}
            >
              <option value="" disabled>
                Elige un {family?.name}…
              </option>
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name} — desde {euro(m.fromPrice)}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Disponible en próximas actualizaciones"
              className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-muted"
            >
              <Icon name="chat" size={16} aria-hidden="true" /> Necesito ayuda para elegir
            </button>
            <p className="mt-2 text-xs text-muted">Asistente "Encuentra tu Apple" disponible próximamente.</p>
          </div>
        </div>
      )}

      {/* Resumen superior */}
      {compare.length >= 2 && (
        <section
          aria-label="Resumen de diferencias"
          className="mt-6 rounded-[16px] border border-line bg-neutral p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Resumen
              </p>
              <h2 className="text-lg font-bold text-ink">Diferencias entre las opciones</h2>
            </div>
            <ProvisionalBadge label="Orientación demostrativa" />
          </div>
          <ul className="mt-3 grid gap-2 text-sm text-ink sm:grid-cols-2">
            {summary.cheapestSlug && (
              <SummaryItem
                icon="credit-card"
                text={`Opción más económica de esta comparación: ${nameOfSlug(compare, summary.cheapestSlug)}.`}
              />
            )}
            {summary.largestCapacitySlug && (
              <SummaryItem
                icon="package"
                text={`Mayor capacidad inicial: ${nameOfSlug(compare, summary.largestCapacitySlug)}.`}
              />
            )}
            {summary.largestScreenSlug && (
              <SummaryItem
                icon="info"
                text={`Mayor pantalla entre los modelos seleccionados: ${nameOfSlug(compare, summary.largestScreenSlug)}.`}
              />
            )}
            {summary.lightestSlug && (
              <SummaryItem
                icon="check"
                text={`Más ligero de la comparación: ${nameOfSlug(compare, summary.lightestSlug)}.`}
              />
            )}
          </ul>
        </section>
      )}

      {/* Switch "Solo diferencias / Mostrar todas" */}
      {compare.length >= 2 && (
        <div
          role="group"
          aria-label="Modo de visualización de la comparación"
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-sm font-semibold text-ink">Mostrar:</span>
          <Chip selected={onlyDifferences} onClick={() => setOnlyDifferences(true)}>
            Solo diferencias
          </Chip>
          <Chip selected={!onlyDifferences} onClick={() => setOnlyDifferences(false)}>
            Mostrar todas
          </Chip>
          <span className="sr-only" aria-live="polite">
            {onlyDifferences ? 'Mostrando solo diferencias' : 'Mostrando todas las características esenciales'}
          </span>
        </div>
      )}

      {/* Tabla comparativa */}
      {compare.length > 0 && (
        <div className="mt-6">
          {/* Cabecera "sticky" reducida — sólo cuando hay al menos una columna */}
          <div
            aria-hidden="true"
            className="sticky top-16 z-20 -mx-4 mb-4 hidden bg-surface/95 px-4 py-2 shadow-[0_4px_10px_-6px_rgba(0,0,0,0.12)] backdrop-blur sm:top-[6.25rem] sm:mx-0 sm:rounded-full sm:px-4 md:flex"
          >
            <div className="flex w-full items-center gap-3 overflow-hidden">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Comparando
              </span>
              {compare.map((c) => (
                <span key={`sticky-${c.id}`} className="flex items-center gap-2 text-xs text-ink">
                  <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-md bg-neutral">
                    <img
                      src={productImage(c.modelSlug, c.color)}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </span>
                  <span className="max-w-[160px] truncate font-semibold">{c.name}</span>
                  <span className="text-muted">{euro(c.price)}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table
              className="w-full min-w-[560px] border-collapse text-left"
              aria-label={`Comparación de ${compare.length} ${family?.name}`}
            >
              <thead>
                <tr>
                  <th className="w-40 p-3 align-bottom text-sm font-medium text-muted">
                    <span className="sr-only">Característica</span>
                  </th>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {compare.map((c) => {
                      const favId = `${c.family}/${c.modelSlug}`
                      const fav = isFavorite(favId)
                      const stickyCol =
                        summary.cheapestSlug === c.modelSlug
                          ? 'Más económico'
                          : summary.largestCapacitySlug === c.modelSlug
                            ? 'Mayor capacidad'
                            : summary.lightestSlug === c.modelSlug
                              ? 'Más ligero'
                              : summary.largestScreenSlug === c.modelSlug
                                ? 'Mayor pantalla'
                                : null
                      return (
                        <motion.th
                          key={c.id}
                          layout
                          initial={{ opacity: 0, scale: 0.94, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, y: -8 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          className="scroll-mx-4 w-64 p-3 align-bottom"
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          <div className="relative flex h-full flex-col rounded-[12px] border border-line bg-surface p-3">
                            <button
                              onClick={() => removeCompare(c.id)}
                              aria-label={`Quitar ${c.name} de la comparación`}
                              className="absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-muted shadow-[var(--shadow-rest)] hover:border-danger hover:text-danger"
                            >
                              <Icon name="close" size={15} aria-hidden="true" />
                            </button>

                            {stickyCol && (
                              <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-brand-050 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                                {stickyCol}
                              </span>
                            )}

                            <ProductImage
                              src={productImage(c.modelSlug, c.color)}
                              alt={c.name}
                              ratio="4 / 3"
                            />
                            <p className="mt-2 text-sm font-bold text-ink">{c.name}</p>
                            <p className="text-xs text-muted">
                              {c.capacity} · {c.color}
                            </p>
                            <p className="mt-1 font-bold text-ink">{euro(c.price)}</p>
                            <div className="mt-1">
                              <ProvisionalBadge label="Precio demostrativo" />
                            </div>

                            {/* Selector de sustitución dentro de la columna */}
                            {pickable.length > 0 && (
                              <label className="mt-3 block text-xs text-muted">
                                <span className="mb-1 block">Sustituir por:</span>
                                <select
                                  aria-label={`Sustituir ${c.name} por otro modelo`}
                                  className="w-full rounded-[8px] border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                                  value=""
                                  onChange={(event) => {
                                    const slug = event.target.value
                                    if (slug) replaceInColumn(c.id, slug)
                                  }}
                                >
                                  <option value="" disabled>
                                    Elegir modelo…
                                  </option>
                                  {pickable.map((m) => (
                                    <option key={m.slug} value={m.slug}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link
                                to={variantPath(
                                  models.find((m) => m.slug === c.modelSlug) ?? models[0],
                                )}
                                className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink/30"
                              >
                                Ver producto
                              </Link>
                              <button
                                type="button"
                                onClick={() => toggleFavorite(favId)}
                                aria-pressed={fav}
                                aria-label={fav ? `Quitar ${c.name} de favoritos` : `Añadir ${c.name} a favoritos`}
                                className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:border-danger hover:text-danger"
                              >
                                <Icon
                                  name="heart"
                                  size={13}
                                  className={fav ? 'fill-danger text-danger' : ''}
                                  aria-hidden="true"
                                />
                                {fav ? 'En favoritos' : 'Favorito'}
                              </button>
                            </div>

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
                      )
                    })}
                  </AnimatePresence>
                  {compare.length < 3 && pickable.length > 0 && (
                    <th className="w-64 p-3 align-middle">
                      <div className="flex h-full min-h-[220px] flex-col items-stretch justify-center gap-3 rounded-[12px] border border-dashed border-line bg-neutral p-4 text-center text-sm text-muted">
                        <span className="font-semibold text-ink">Añadir otro modelo</span>
                        <label className="block text-left text-xs text-muted">
                          <span className="mb-1 block">Elige un {family?.name}:</span>
                          <select
                            aria-label={`Añadir un ${family?.name} a la comparación`}
                            className="w-full rounded-[8px] border border-line bg-surface px-2 py-1.5 text-xs text-ink"
                            value=""
                            onChange={(event) => {
                              const slug = event.target.value
                              if (!slug) return
                              const target = models.find((m) => m.slug === slug)
                              if (target) toggleCompare(compareItemFor(target))
                            }}
                          >
                            <option value="" disabled>
                              Elegir modelo…
                            </option>
                            {pickable.map((m) => (
                              <option key={m.slug} value={m.slug}>
                                {m.name} — desde {euro(m.fromPrice)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {compare.length < 2 && (
                  <tr>
                    <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
                      Diferencias
                    </th>
                    <td className="p-3 text-sm text-muted" colSpan={2}>
                      Añade otro modelo para ver las diferencias esenciales.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.field} className="border-t border-line">
                    <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
                      {row.field}
                    </th>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className={`p-3 text-sm ${
                          row.allEqual
                            ? 'text-ink'
                            : 'bg-brand-050 font-semibold text-ink'
                        }`}
                      >
                        {v ?? <span className="text-muted">No especificado</span>}
                      </td>
                    ))}
                    {compare.length < 3 && pickable.length > 0 && <td />}
                  </tr>
                ))}
                {compare.length >= 2 && rows.length === 0 && (
                  <tr>
                    <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
                      Diferencias
                    </th>
                    <td className="p-3 text-sm text-muted" colSpan={compare.length + 1}>
                      Los modelos seleccionados comparten los datos esenciales disponibles. Cambia
                      a "Mostrar todas" para verlos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pie con nota provisional y contador — la selección de productos se
          hace directamente desde el <select> de cada columna. */}
      {compare.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-xs text-muted">
            {compare.length}/3 · {family?.name}
            {compareFull ? ' · Has alcanzado el máximo.' : ''}
          </span>
          <ProvisionalBadge label="Especificaciones demostrativas" />
        </div>
      )}
    </Container>
  )
}

function SummaryItem({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Icon name={icon} size={16} className="mt-0.5 text-ink" aria-hidden="true" />
      <span>{text}</span>
    </li>
  )
}

function nameOfSlug(compare: { modelSlug: string; name: string }[], slug: string): string {
  return compare.find((c) => c.modelSlug === slug)?.name ?? slug
}
