import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getStore, stores } from '../data/stores'
import type { Store } from '../data/types'

// Estado global de la "tienda favorita" del usuario. Persistencia:
//   - banana:favorite-store         → slug de tienda (string).
//   - banana:favorite-store-prompt  → 'dismissed' cuando el usuario elige
//                                     "Ahora no" para no mostrar el bottom
//                                     sheet inicial en cada visita.
// No guardamos ubicación, coordenadas, IP ni información personal.

const STORAGE_KEY = 'banana:favorite-store'
const PROMPT_KEY = 'banana:favorite-store-prompt'

interface StorePreferenceState {
  favoriteSlug: string | null
  favoriteStore: Store | null
  promptDismissed: boolean
  setFavorite: (slug: string) => void
  clearFavorite: () => void
  dismissPrompt: () => void
}

const StorePreferenceContext = createContext<StorePreferenceState | null>(null)

function readString(key: string): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeString(key: string, value: string | null) {
  try {
    if (typeof window === 'undefined') return
    if (value == null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* almacenamiento no disponible */
  }
}

export function StorePreferenceProvider({ children }: { children: ReactNode }) {
  const [favoriteSlug, setFavoriteSlugState] = useState<string | null>(() => {
    const raw = readString(STORAGE_KEY)
    if (!raw) return null
    return stores.some((s) => s.slug === raw) ? raw : null
  })
  const [promptDismissed, setPromptDismissed] = useState<boolean>(
    () => readString(PROMPT_KEY) === 'dismissed',
  )

  useEffect(() => {
    writeString(STORAGE_KEY, favoriteSlug)
  }, [favoriteSlug])

  useEffect(() => {
    writeString(PROMPT_KEY, promptDismissed ? 'dismissed' : null)
  }, [promptDismissed])

  const setFavorite = useCallback((slug: string) => {
    if (!stores.some((s) => s.slug === slug)) return
    setFavoriteSlugState(slug)
    setPromptDismissed(true)
  }, [])

  const clearFavorite = useCallback(() => {
    setFavoriteSlugState(null)
  }, [])

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true)
  }, [])

  const value: StorePreferenceState = {
    favoriteSlug,
    favoriteStore: favoriteSlug ? (getStore(favoriteSlug) ?? null) : null,
    promptDismissed,
    setFavorite,
    clearFavorite,
    dismissPrompt,
  }

  return <StorePreferenceContext.Provider value={value}>{children}</StorePreferenceContext.Provider>
}

export function useStorePreference(): StorePreferenceState {
  const ctx = useContext(StorePreferenceContext)
  if (!ctx) {
    throw new Error('useStorePreference debe usarse dentro de <StorePreferenceProvider>')
  }
  return ctx
}

/** Devuelve la lista de tiendas con la favorita primero, si existe. */
export function sortStoresWithFavoriteFirst(list: Store[], favoriteSlug: string | null): Store[] {
  if (!favoriteSlug) return list
  const fav = list.find((s) => s.slug === favoriteSlug)
  if (!fav) return list
  return [fav, ...list.filter((s) => s.slug !== favoriteSlug)]
}
