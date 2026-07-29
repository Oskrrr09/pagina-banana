import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// ------------------------------------------------------------------
// Estado del prototipo: carrito, comparador y favoritos.
// Funcionan de verdad sobre los datos de ejemplo (sin backend, §9.6),
// y persisten en localStorage para no perderlos al recargar.
// ------------------------------------------------------------------

export interface CartLine {
  id: string // `${family}/${model}/${color}/${capacity}`
  modelSlug: string
  family: string
  name: string // 'iPhone 17 Pro'
  color: string // 'Plata'
  capacity: string // '256GB'
  price: number
  previousPrice: number | null
  qty: number
  insured?: boolean
}

export interface CompareItem {
  id: string
  modelSlug: string
  family: string
  name: string
  color: string
  capacity: string
  price: number
  specs: { label: string; value: string }[]
}

interface StoreState {
  cart: CartLine[]
  addToCart: (line: Omit<CartLine, 'qty'>, qty?: number) => void
  removeFromCart: (id: string) => void
  setQty: (id: string, qty: number) => void
  setLineInsurance: (id: string, insured: boolean) => void
  clearCart: () => void
  cartCount: number
  cartSubtotal: number
  cartInsuranceTotal: number
  insurancePrice: number

  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean

  compare: CompareItem[]
  toggleCompare: (item: CompareItem) => void
  removeCompare: (id: string) => void
  /**
   * Sustituye en la misma posición el item con id `currentId` por `next`.
   * Preserva el orden de columnas y evita duplicados: si `next.id` ya está
   * en otra posición, no hace nada. Si el nuevo pertenece a otra familia,
   * tampoco (mantiene la restricción de familia única).
   */
  replaceCompareItem: (currentId: string, next: CompareItem) => void
  isComparing: (id: string) => boolean
  compareFull: boolean
}

const StoreContext = createContext<StoreState | null>(null)

const MAX_COMPARE = 3
export const INSURANCE_PRICE = 8.99

function usePersistent<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* almacenamiento no disponible: seguimos solo en memoria */
    }
  }, [key, value])
  return [value, setValue]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = usePersistent<CartLine[]>('banana:cart', [])
  const [favorites, setFavorites] = usePersistent<string[]>('banana:fav', [])
  const [compare, setCompare] = usePersistent<CompareItem[]>('banana:compare', [])

  const value = useMemo<StoreState>(() => {
    const addToCart: StoreState['addToCart'] = (line, qty = 1) => {
      setCart((prev) => {
        const found = prev.find((l) => l.id === line.id)
        if (found) {
          return prev.map((l) =>
            l.id === line.id
              ? { ...l, qty: l.qty + qty, insured: Boolean(l.insured || line.insured) }
              : l,
          )
        }
        return [...prev, { ...line, qty }]
      })
    }
    const removeFromCart: StoreState['removeFromCart'] = (id) =>
      setCart((prev) => prev.filter((l) => l.id !== id))
    const setQty: StoreState['setQty'] = (id, qty) =>
      setCart((prev) =>
        prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)),
      )
    const setLineInsurance: StoreState['setLineInsurance'] = (id, insured) =>
      setCart((prev) => prev.map((line) => (line.id === id ? { ...line, insured } : line)))
    const clearCart = () => setCart([])

    const toggleFavorite: StoreState['toggleFavorite'] = (id) =>
      setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))

    const toggleCompare: StoreState['toggleCompare'] = (item) =>
      setCompare((prev) => {
        if (prev.find((c) => c.id === item.id)) return prev.filter((c) => c.id !== item.id)
        // Solo se comparan productos del mismo tipo (iPhone con iPhone, Mac con
        // Mac…). Si el nuevo es de otra familia, empezamos una comparación nueva.
        if (prev.length > 0 && prev[0].family !== item.family) return [item]
        if (prev.length >= MAX_COMPARE) return prev
        return [...prev, item]
      })
    const removeCompare: StoreState['removeCompare'] = (id) =>
      setCompare((prev) => prev.filter((c) => c.id !== id))
    const replaceCompareItem: StoreState['replaceCompareItem'] = (currentId, next) =>
      setCompare((prev) => {
        const idx = prev.findIndex((c) => c.id === currentId)
        if (idx === -1) return prev
        // Familia distinta: ignoramos la sustitución (no mezclamos familias).
        if (prev[0] && prev[0].family !== next.family) return prev
        // Ya está en otra columna: no duplicamos.
        if (prev.some((c, i) => i !== idx && c.id === next.id)) return prev
        const copy = prev.slice()
        copy[idx] = next
        return copy
      })

    return {
      cart,
      addToCart,
      removeFromCart,
      setQty,
      setLineInsurance,
      clearCart,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      cartSubtotal: cart.reduce((n, l) => n + l.price * l.qty, 0),
      cartInsuranceTotal: cart.reduce(
        (total, line) => total + (line.insured ? INSURANCE_PRICE * line.qty : 0),
        0,
      ),
      insurancePrice: INSURANCE_PRICE,
      favorites,
      toggleFavorite,
      isFavorite: (id) => favorites.includes(id),
      compare,
      toggleCompare,
      removeCompare,
      replaceCompareItem,
      isComparing: (id) => compare.some((c) => c.id === id),
      compareFull: compare.length >= MAX_COMPARE,
    }
  }, [
    cart,
    favorites,
    compare,
    setCart,
    setFavorites,
    setCompare,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return ctx
}
