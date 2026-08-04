import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { ProductImage } from '../product/ProductImage'
import { euro } from '../../lib/format'
import type { Model } from '../../data/types'
import { useCatalogo, useIdioma } from '../../lib/i18n'

// Diálogo del comparador para elegir o cambiar el modelo de una columna.
// Accesibilidad: reutiliza <Modal /> (focus trap + Escape + restauración de
// foco + aria-modal). Filtra por texto localmente y desactiva los modelos ya
// añadidos a otras columnas.

export interface ModelPickerDialogProps {
  open: boolean
  onClose: () => void
  models: Model[]
  /** Slugs ya usados en otras columnas: se muestran como "Ya añadido". */
  usedSlugs: string[]
  /** Slug actualmente ocupando la columna (si estamos "cambiando modelo"). */
  currentSlug?: string
  onPick: (model: Model) => void
  familyName: string
  mode: 'add' | 'replace'
}

export function ModelPickerDialog({
  open,
  onClose,
  models,
  usedSlugs,
  currentSlug,
  onPick,
  familyName,
  mode,
}: ModelPickerDialogProps) {
  const cat = useCatalogo()
  const { t, intl } = useIdioma()
  const [query, setQuery] = useState('')
  const title = t(
    mode === 'add' ? 'compare.picker.addTitle' : 'compare.picker.replaceTitle',
    { familia: familyName },
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return models
    const q = query.trim().toLocaleLowerCase(intl)
    return models.filter((m) => cat(m.name).toLocaleLowerCase(intl).includes(q))
  }, [cat, intl, models, query])

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-3 text-sm text-muted">
        {t('compare.picker.intro')}
      </p>
      <label className="mb-4 block">
        <span className="sr-only">{t('compare.picker.search')}</span>
        <div className="flex items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-2">
          <Icon name="search" size={16} className="text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t('compare.picker.searchFamily', { familia: familyName })}…`}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            aria-label={t('compare.picker.searchFamily', { familia: familyName })}
          />
        </div>
      </label>

      {filtered.length === 0 && (
        <p className="rounded-[12px] bg-neutral p-4 text-sm text-muted">
          {t('compare.picker.noResults', { consulta: query })}
        </p>
      )}

      <ul className="grid gap-2" role="list">
        {filtered.map((m) => {
          const alreadyInOther = usedSlugs.includes(m.slug) && m.slug !== currentSlug
          const isCurrent = m.slug === currentSlug
          const disabled = alreadyInOther || isCurrent
          const badge = alreadyInOther
            ? t('compare.picker.alreadyAdded')
            : isCurrent
              ? t('compare.picker.currentColumn')
              : null
          const modelName = cat(m.name)
          return (
            <li key={m.slug}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onPick(m)
                  onClose()
                }}
                aria-label={
                  disabled
                    ? `${modelName} (${badge})`
                    : mode === 'add'
                      ? t('compare.picker.choose', { modelo: modelName })
                      : t('compare.picker.replaceWith', { modelo: modelName })
                }
                className="flex w-full items-center gap-3 rounded-[12px] border border-line bg-surface p-3 text-left transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-banana hover:shadow-[var(--shadow-raised)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-line disabled:hover:shadow-none"
              >
                <div className="h-14 w-14 shrink-0">
                  <ProductImage src={m.colors[0].image} alt="" ratio="1 / 1" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{modelName}</p>
                  <p className="text-xs font-medium text-ink">
                    {t('common.from', { precio: euro(m.fromPrice, intl) })}
                  </p>
                  {badge && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-neutral px-2 py-0.5 text-[11px] font-semibold text-ink">
                      {badge}
                    </p>
                  )}
                </div>
                {!disabled && (
                  <Icon name="chevron-right" size={16} className="text-muted" aria-hidden="true" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
