import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Chip } from '../components/ui/Chip'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { ModelPickerDialog } from '../components/compare/ModelPickerDialog'
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
  buildDecisionSections,
  buildDecisionSummary,
  type FamilySlug,
} from '../data/productDecisionData'

// ---------------------------------------------------------------------------
// Comparador (versión simplificada).
//
// - Hasta tres "espacios" en la parte superior. Cada uno vacío muestra
//   "Elegir modelo" y ocupado muestra la tarjeta del producto con
//   "Cambiar modelo" / "Quitar".
// - Sin rejilla inferior con todos los modelos: el selector se abre en un
//   diálogo modal.
// - Sin bloque grande "Diferencias entre las opciones": las ventajas objetivas
//   aparecen como un chip discreto "Destaca por…" bajo el nombre del producto,
//   y sólo cuando existe un ganador único con dato en todos los modelos.
// - La tabla agrupa las filas en secciones semánticas (Precio, Pantalla,
//   Rendimiento…). El fondo amarillo global de las celdas distintas se ha
//   sustituido por texto normal; las ventajas se comunican con un badge
//   pequeño en la cabecera de la columna ganadora.
// - Cabecera sticky real (no hay copia `aria-hidden`).
// - En 375 px sólo el contenedor de la tabla desplaza horizontal, con
//   scroll-snap por columna. El documento no genera scroll horizontal.
// - Compatibilidad `banana:compare`: el shape de `CompareItem` no cambia.
// ---------------------------------------------------------------------------

const MAX_SLOTS = 3

export function ComparePage() {
  const t = useT()
  const {
    compare,
    toggleCompare,
    removeCompare,
    replaceCompareItem,
    addToCart,
    toggleFavorite,
    isFavorite,
  } = useStore()
  const [params, setParams] = useSearchParams()
  const [onlyDifferences, setOnlyDifferences] = useState(true)
  const [pickerSlot, setPickerSlot] = useState<
    | { kind: 'add' }
    | { kind: 'replace'; currentId: string; currentSlug: string }
    | null
  >(null)

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

  const usedSlugs = useMemo(() => compare.map((c) => c.modelSlug), [compare])

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

  const contexts = useMemo(() => {
    const out: { model: Model; capacity: string | null; color: string | null }[] = []
    for (const c of compare) {
      const model = models.find((m) => m.slug === c.modelSlug)
      if (!model) continue
      out.push({ model, capacity: c.capacity ?? null, color: c.color ?? null })
    }
    return out
  }, [compare, models])

  const sections = useMemo(
    () =>
      contexts.length > 0
        ? buildDecisionSections(contexts, activeFamily, { onlyDifferences })
        : [],
    [contexts, activeFamily, onlyDifferences],
  )

  const summary = useMemo(() => buildDecisionSummary(contexts), [contexts])

  function switchFamily(slug: string) {
    setParams(slug === 'iphone' ? {} : { familia: slug })
  }

  function handleAdd(model: Model) {
    toggleCompare(compareItemFor(model))
  }
  function handleReplace(model: Model, currentId: string) {
    replaceCompareItem(currentId, compareItemFor(model))
  }

  // Etiqueta "Destaca por…" (máx. 2) por columna, sólo si hay ganador único.
  function highlightsFor(modelSlug: string): string[] {
    const out: string[] = []
    if (summary.cheapestSlug === modelSlug) out.push('Más económico')
    if (summary.lightestSlug === modelSlug) out.push('Más ligero')
    if (summary.largestScreenSlug === modelSlug) out.push('Mayor pantalla')
    if (summary.largestCapacitySlug === modelSlug) out.push('Mayor capacidad')
    return out.slice(0, 2)
  }

  const isEmpty = compare.length === 0

  // Compat: si algún accesorio quedó persistido en localStorage con la
  // family antigua `accessory:<category>`, lo retiramos silenciosamente
  // — el comparador queda solo para dispositivos.
  useEffect(() => {
    compare.forEach((c) => {
      if (c.family?.startsWith('accessory:')) removeCompare(c.id)
    })
  }, [compare, removeCompare])

  return (
    <Container className="py-10">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Comparador
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">{t('compare.heading')}</h1>
        <p className="mt-2 text-muted">
          {t('compare.intro')}
        </p>
      </header>

      {isEmpty ? (
        <section className="mt-6 rounded-[16px] border border-line bg-neutral p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">Tipo de producto:</span>
            {comparableFamilies.map((f) => (
              <Chip
                key={f.slug}
                selected={f.slug === activeFamily}
                onClick={() => switchFamily(f.slug)}
              >
                {f.name}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">
            {t('compare.chooseUpTo', { familia: family?.name ?? '' })}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: MAX_SLOTS }).map((_, i) => (
              <EmptySlot
                key={i}
                index={i}
                onClick={() => setPickerSlot({ kind: 'add' })}
                familyName={family?.name ?? ''}
                primary={i === 0}
              />
            ))}
          </div>
          <div className="mt-6">
            <Link
              to="/elige-tu-apple"
              className="inline-flex items-center gap-2 rounded-[12px] bg-action px-4 py-2 text-sm font-semibold text-ink hover:bg-action-600"
            >
              <Icon name="chat" size={16} aria-hidden="true" /> {t('compare.needHelp')}
            </Link>
            <p className="mt-2 text-xs text-muted">
              {t('compare.needHelpNote')}
            </p>
          </div>
        </section>
      ) : (
        <>
          {compare.length >= 2 ? (
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
                {onlyDifferences
                  ? 'Mostrando solo diferencias'
                  : 'Mostrando todas las características esenciales'}
              </span>
            </div>
          ) : (
            <p className="mt-6 rounded-[12px] bg-neutral p-3 text-sm text-muted">
              Añade otro modelo para ver diferencias.
            </p>
          )}

          <div className="mt-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="mx-auto w-full max-w-4xl">
              <div className="min-w-[720px]">
                {/* Cards row: CSS grid garantiza tres columnas idénticas
                    con las tarjetas estiradas a la misma altura. */}
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: '10rem repeat(3, minmax(0, 1fr))' }}
                  role="group"
                  aria-label={`Modelos comparados en ${family?.name ?? ''}`}
                >
                  <div aria-hidden="true" />
                  {Array.from({ length: MAX_SLOTS }).map((_, i) => {
                    const c = compare[i]
                    if (!c) {
                      return (
                        <EmptySlot
                          key={`slot-${i}`}
                          index={i}
                          onClick={() => setPickerSlot({ kind: 'add' })}
                          familyName={family?.name ?? ''}
                          primary={false}
                          compact
                        />
                      )
                    }
                    const favId = `${c.family}/${c.modelSlug}`
                    const fav = isFavorite(favId)
                    const model = models.find((m) => m.slug === c.modelSlug) ?? models[0]
                    const highlights = highlightsFor(c.modelSlug)
                    return (
                      <div
                        key={c.id}
                        className="flex h-full min-h-[520px] flex-col rounded-[12px] border border-line bg-surface p-3"
                      >
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
                          <ProvisionalBadge />
                        </div>

                        {highlights.length > 0 && (
                          <ul
                            className="mt-2 flex flex-wrap gap-1"
                            aria-label="Destaca por"
                          >
                            {highlights.map((h) => (
                              <li
                                key={h}
                                className="inline-flex items-center gap-1 rounded-full border border-brand bg-brand-050 px-2 py-0.5 text-[11px] font-semibold text-ink"
                              >
                                <Icon name="check" size={11} aria-hidden="true" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-auto pt-3">
                          <Button
                            size="sm"
                            className="w-full"
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
                          <Link
                            to={variantPath(model)}
                            className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-[12px] border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30"
                          >
                            {t('services.more')}
                          </Link>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerSlot({
                                kind: 'replace',
                                currentId: c.id,
                                currentSlug: c.modelSlug,
                              })
                            }
                            aria-label={`Cambiar modelo en la columna ${c.name}`}
                            className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[11px] font-semibold text-ink hover:border-ink/30"
                          >
                            <Icon name="refresh" size={12} aria-hidden="true" />
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(favId)}
                            aria-pressed={fav}
                            aria-label={
                              fav
                                ? `Quitar ${c.name} de favoritos`
                                : `Añadir ${c.name} a favoritos`
                            }
                            className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink hover:border-danger hover:text-danger"
                          >
                            <Icon
                              name="heart"
                              size={14}
                              className={fav ? 'fill-danger text-danger' : ''}
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCompare(c.id)}
                            aria-label={`Quitar ${c.name} de la comparación`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted hover:border-danger hover:text-danger"
                          >
                            <Icon name="close" size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Tabla de especificaciones con el mismo grid de columnas
                    que las cards, alineación garantizada por colgroup. */}
                <table
                  className="mt-6 w-full table-fixed border-collapse text-left"
                  aria-label={`Especificaciones comparadas de ${compare.length} ${family?.name ?? ''}`}
                >
                  <colgroup>
                    <col style={{ width: '10rem' }} />
                    <col />
                    <col />
                    <col />
                  </colgroup>
                  <tbody>
                    {sections.map((section) => (
                      <SectionGroup
                        key={section.title}
                        title={section.title}
                        rows={section.rows}
                        slots={MAX_SLOTS}
                      />
                    ))}
                    {compare.length >= 2 && sections.length === 0 && (
                      <tr>
                        <th
                          scope="row"
                          className="p-3 text-left text-sm font-medium text-muted"
                        >
                          Diferencias
                        </th>
                        <td className="p-3 text-sm text-muted" colSpan={MAX_SLOTS}>
                          Los modelos seleccionados comparten los datos esenciales
                          disponibles. Cambia a "Mostrar todas" para verlos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <ModelPickerDialog
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        models={models}
        usedSlugs={usedSlugs}
        currentSlug={pickerSlot?.kind === 'replace' ? pickerSlot.currentSlug : undefined}
        familyName={family?.name ?? ''}
        mode={pickerSlot?.kind === 'replace' ? 'replace' : 'add'}
        onPick={(model) => {
          if (pickerSlot?.kind === 'replace') handleReplace(model, pickerSlot.currentId)
          else handleAdd(model)
        }}
      />
    </Container>
  )
}

function EmptySlot({
  index,
  onClick,
  familyName,
  primary,
  compact,
}: {
  index: number
  onClick: () => void
  familyName: string
  primary?: boolean
  compact?: boolean
}) {
  const t = useT()
  return (
    <button
      type="button"
      onClick={onClick}
      data-model-picker-trigger
      aria-label={t('compare.emptySlotAria', { familia: familyName, n: index + 1 })}
      className={[
        'group flex h-full w-full flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed p-4 text-center transition-[transform,border-color] duration-150 hover:-translate-y-0.5',
        compact ? 'min-h-[520px]' : 'min-h-[180px]',
        primary ? 'border-brand text-ink hover:border-banana' : 'border-line text-muted hover:border-ink/30',
      ].join(' ')}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink">
        <Icon name="plus" size={18} aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-ink">{t('compare.chooseModel')}</span>
      <span className="text-xs text-muted">{t('compare.slot', { n: index + 1 })}</span>
    </button>
  )
}

function SectionGroup({
  title,
  rows,
  slots,
}: {
  title: string
  rows: { field: string; values: (string | null)[] }[]
  slots: number
}) {
  return (
    <>
      <tr className="border-t border-line bg-neutral/60">
        <th
          scope="colgroup"
          colSpan={slots + 1}
          className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
        >
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.field} className="border-t border-line">
          <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
            {row.field}
          </th>
          {Array.from({ length: slots }).map((_, i) => {
            const v = row.values[i]
            return (
              <td
                key={i}
                className="p-3 text-sm text-ink"
                style={{ scrollSnapAlign: 'start' }}
              >
                {v ?? <span className="text-muted">—</span>}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
