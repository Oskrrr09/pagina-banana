import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { ProvisionalBadge } from '../ui/Tag'
import { limitSearchResults, searchCatalog, type SearchResults } from '../../lib/catalogSearch'
import type { SearchItem } from '../../data/searchIndex'

// Autocompletado accesible compartido por Header escritorio y overlay móvil.
// Usa el mismo motor `searchCatalog` que /buscar y agrupa los resultados por
// las mismas secciones. Implementa el patrón combobox con lista popup
// (aria-controls / aria-expanded / aria-activedescendant) y navegación por
// teclado con Flechas / Enter / Escape.
//
// Se muestra vacío hasta que la consulta tiene 2 o más caracteres. Con menos,
// se pintan accesos rápidos discretos.

const QUICK_LINKS: { label: string; to: string }[] = [
  { label: 'iPhone', to: '/iphone' },
  { label: 'Mac', to: '/mac' },
  { label: 'iPad', to: '/ipad' },
  { label: 'Apple Watch', to: '/apple-watch' },
  { label: 'AirPods', to: '/airpods' },
  { label: 'Accesorios', to: '/accesorios' },
]

const HEADER_LIMITS = {
  appleDevices: 4,
  relatedProducts: 3,
  appleAccessories: 3,
  compatibleAccessories: 3,
  services: 3,
  help: 3,
}

interface FlatEntry {
  section: string
  item: SearchItem
  index: number
  isExact?: boolean
}

function flattenResults(results: SearchResults): FlatEntry[] {
  const out: FlatEntry[] = []
  let index = 0
  if (results.exactMatch) {
    out.push({ section: 'Coincidencia principal', item: results.exactMatch, index: index++, isExact: true })
  }
  const sections: [string, SearchItem[]][] = [
    ['Dispositivos Apple', results.appleDevices],
    ['Productos relacionados', results.relatedProducts],
    ['Accesorios Apple', results.appleAccessories],
    ['Accesorios compatibles', results.compatibleAccessories],
    ['Servicios', results.services],
    ['Ayuda', results.help],
  ]
  for (const [section, items] of sections) {
    for (const item of items) {
      out.push({ section, item, index: index++ })
    }
  }
  return out
}

export interface HeaderSearchProps {
  mode: 'desktop' | 'mobile'
  onClose: () => void
  /**
   * Ref opcional del elemento al que devolver el foco al cerrar (típicamente
   * la lupa del Header en escritorio o el botón de menú en móvil).
   */
  restoreFocusTo?: React.RefObject<HTMLElement | null>
}

export function HeaderSearch({ mode, onClose, restoreFocusTo }: HeaderSearchProps) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  // -1 = ninguna sugerencia seleccionada. Enter en ese estado envía la
  // búsqueda completa a /buscar. El usuario debe pulsar ArrowDown/Up para
  // elegir explícitamente una sugerencia; solo entonces Enter la abre.
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const results = useMemo<SearchResults | null>(() => {
    if (q.trim().length < 2) return null
    return limitSearchResults(searchCatalog(q), HEADER_LIMITS)
  }, [q])

  const flat = useMemo(() => (results ? flattenResults(results) : []), [results])
  const expanded = results !== null && flat.length > 0

  // Enfocar el input al montar.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Al cambiar la consulta, la selección previa deja de tener sentido: la
  // limpiamos para que Enter vuelva a significar "ver todos los resultados".
  useEffect(() => {
    setActiveIndex(-1)
  }, [q])

  function closeAndRestore() {
    setActiveIndex(-1)
    onClose()
    if (restoreFocusTo?.current) {
      window.setTimeout(() => restoreFocusTo.current?.focus(), 0)
    }
  }

  function submitFullSearch(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    navigate(`/buscar?q=${encodeURIComponent(trimmed)}`)
    closeAndRestore()
  }

  function activateItem(item: SearchItem) {
    if (item.route) {
      navigate(item.route)
      closeAndRestore()
      return
    }
    submitFullSearch(item.name)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeAndRestore()
      return
    }
    if (!expanded) {
      if (e.key === 'Enter') {
        e.preventDefault()
        submitFullSearch(q)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Desde -1 → 0 (primera sugerencia). Después avanza sin salir de rango.
      setActiveIndex((i) => (i < 0 ? 0 : Math.min(flat.length - 1, i + 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Desde -1 → última sugerencia (wrap consistente). Desde 0 → -1 (vuelve
      // al estado sin selección, donde Enter envía la búsqueda completa).
      setActiveIndex((i) => {
        if (i < 0) return flat.length - 1
        if (i === 0) return -1
        return i - 1
      })
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex < 0) {
        submitFullSearch(q)
        return
      }
      const active = flat[activeIndex]
      if (active) activateItem(active.item)
      else submitFullSearch(q)
    }
  }

  const activeId = expanded && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined

  const isMobile = mode === 'mobile'

  return (
    <div className={isMobile ? 'flex h-full flex-col bg-surface' : ''}>
      {/* Barra de input + botones auxiliares */}
      <div
        className={
          isMobile
            ? 'flex h-16 shrink-0 items-center gap-2 border-b border-line px-4'
            : 'px-5 py-3 sm:px-6 lg:px-8'
        }
      >
        {isMobile && (
          <button
            type="button"
            onClick={closeAndRestore}
            aria-label="Cerrar búsqueda"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink hover:bg-neutral"
          >
            <Icon name="chevron-right" className="rotate-180" />
          </button>
        )}
        <div
          role="combobox"
          aria-expanded={expanded}
          aria-owns={listboxId}
          aria-haspopup="listbox"
          className={
            isMobile
              ? 'flex flex-1 items-center gap-2 rounded-full border border-line bg-neutral px-4 py-2.5'
              : 'mx-auto flex w-full max-w-6xl items-center gap-2 rounded-full border border-line bg-neutral px-4 py-2.5'
          }
        >
          <Icon name="search" className="text-muted" />
          <input
            ref={inputRef}
            role="searchbox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isMobile ? '¿Qué estás buscando?' : 'Buscar productos, categorías, ayuda…'}
            aria-label="Buscar"
            data-testid="header-search-input"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => submitFullSearch(q)}
            aria-label="Buscar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-neutral hover:text-ink"
          >
            <Icon name="search" />
          </button>
        )}
      </div>

      {/* Panel de resultados */}
      <div
        className={
          isMobile
            ? 'flex-1 overflow-y-auto px-4 py-4'
            : 'mx-auto w-full max-w-6xl px-5 pb-4 sm:px-6 lg:px-8'
        }
      >
        {q.trim().length < 2 ? (
          <QuickLinks onNavigate={closeAndRestore} />
        ) : results && flat.length === 0 ? (
          <p className="rounded-[12px] border border-dashed border-line p-4 text-sm text-muted">
            Sin sugerencias para «{q.trim()}».{' '}
            <button
              type="button"
              className="font-semibold text-ink underline underline-offset-2"
              onClick={() => submitFullSearch(q)}
            >
              Ver la página de resultados
            </button>
          </p>
        ) : results ? (
          <SuggestionsList
            listboxId={listboxId}
            entries={flat}
            activeIndex={activeIndex}
            onSelect={activateItem}
            correction={results.correction}
            onCorrection={(term) => setQ(term)}
            onSeeAll={() => submitFullSearch(q)}
            query={q}
          />
        ) : null}
      </div>
    </div>
  )
}

function QuickLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav aria-label="Accesos rápidos" className="flex flex-wrap gap-2">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink hover:border-ink/30"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function SuggestionsList({
  listboxId,
  entries,
  activeIndex,
  onSelect,
  correction,
  onCorrection,
  onSeeAll,
  query,
}: {
  listboxId: string
  entries: FlatEntry[]
  activeIndex: number
  onSelect: (item: SearchItem) => void
  correction: string | null
  onCorrection: (term: string) => void
  onSeeAll: () => void
  query: string
}) {
  // Agrupar por sección para pintar encabezados manteniendo `index` global.
  const bySection = new Map<string, FlatEntry[]>()
  for (const e of entries) {
    if (!bySection.has(e.section)) bySection.set(e.section, [])
    bySection.get(e.section)!.push(e)
  }
  return (
    <>
      {correction && (
        <p className="mb-3 rounded-[12px] border border-line bg-neutral px-3 py-2 text-sm text-ink">
          Quizá querías decir{' '}
          <button
            type="button"
            className="font-semibold text-ink underline underline-offset-2"
            onClick={() => onCorrection(correction)}
          >
            {correction}
          </button>
        </p>
      )}
      <ul
        id={listboxId}
        role="listbox"
        aria-label="Sugerencias de búsqueda"
        className="space-y-4"
      >
        {Array.from(bySection.entries()).map(([section, items]) => (
          <li key={section} role="presentation">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted">{section}</p>
            <ul role="presentation" className="space-y-1">
              {items.map((entry) => (
                <SuggestionRow
                  key={entry.item.id}
                  entry={entry}
                  active={activeIndex === entry.index}
                  onSelect={() => onSelect(entry.item)}
                  listboxId={listboxId}
                />
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-line pt-3">
        <button
          type="button"
          onClick={onSeeAll}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-2 hover:underline"
        >
          Ver todos los resultados para «{query.trim()}»{' '}
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </>
  )
}

function SuggestionRow({
  entry,
  active,
  onSelect,
  listboxId,
}: {
  entry: FlatEntry
  active: boolean
  onSelect: () => void
  listboxId: string
}) {
  const { item } = entry
  const brand = item.brand ?? ''
  return (
    <li>
      <button
        type="button"
        id={`${listboxId}-opt-${entry.index}`}
        role="option"
        aria-selected={active}
        onClick={onSelect}
        className={`flex w-full min-h-[52px] items-center gap-3 rounded-[10px] px-3 py-2 text-left ${
          active ? 'bg-neutral' : 'hover:bg-neutral'
        }`}
      >
        {item.image && !item.demo ? (
          <span
            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[#fafafa]"
            aria-hidden="true"
          >
            <img
              src={item.image}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              className="max-h-full max-w-full object-contain p-1"
            />
          </span>
        ) : (
          <Icon name="search" size={14} className="shrink-0 text-muted" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted">
            {brand && <span>{brand}</span>}
            {item.demo && (
              <span className="inline-block">
                <ProvisionalBadge label="Contenido demostrativo" />
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}
