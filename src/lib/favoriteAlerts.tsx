import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getInventoryState,
  setInventoryOverride,
  type InventoryState,
} from '../data/demoStoreInventory'

// Estado global de seguimiento de disponibilidad + notificaciones internas.
// Persistencia:
//   - banana:favorite-alerts        → seguimientos activos.
//   - banana:favorite-notifications → notificaciones internas
//                                     (no se envía correo ni se
//                                     consulta ningún servicio remoto).
// NO se guarda email, IP, cuenta ni ningún dato personal.

const ALERTS_KEY = 'banana:favorite-alerts'
const NOTIFICATIONS_KEY = 'banana:favorite-notifications'

export interface FavoriteAlert {
  productId: string // `family/model`
  storeSlug: string
  alertType: 'availability'
  enabled: boolean
  createdAt: string
}

export interface AlertNotification {
  id: string
  productId: string
  storeSlug: string
  state: InventoryState
  message: string
  createdAt: string
  read: boolean
}

interface FavoriteAlertsState {
  alerts: FavoriteAlert[]
  notifications: AlertNotification[]
  unreadCount: number
  setAlert: (productId: string, storeSlug: string) => void
  changeAlertStore: (productId: string, storeSlug: string) => void
  disableAlert: (productId: string) => void
  simulateArrival: (productId: string, productName: string) => void
  markRead: (notificationId: string) => void
  markAllRead: () => void
  getAlertForProduct: (productId: string) => FavoriteAlert | null
}

const FavoriteAlertsContext = createContext<FavoriteAlertsState | null>(null)

function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
function writeJSON<T>(key: string, value: T) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento no disponible */
  }
}

let notificationCounter = 0

export function FavoriteAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<FavoriteAlert[]>(() => readJSON(ALERTS_KEY, []))
  const [notifications, setNotifications] = useState<AlertNotification[]>(() =>
    readJSON(NOTIFICATIONS_KEY, []),
  )

  useEffect(() => {
    writeJSON(ALERTS_KEY, alerts)
  }, [alerts])
  useEffect(() => {
    writeJSON(NOTIFICATIONS_KEY, notifications)
  }, [notifications])

  const setAlert = useCallback((productId: string, storeSlug: string) => {
    setAlerts((prev) => {
      const filtered = prev.filter((a) => a.productId !== productId)
      return [
        ...filtered,
        {
          productId,
          storeSlug,
          alertType: 'availability',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ]
    })
  }, [])

  const changeAlertStore = useCallback((productId: string, storeSlug: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.productId === productId ? { ...a, storeSlug, enabled: true } : a)),
    )
  }, [])

  const disableAlert = useCallback((productId: string) => {
    setAlerts((prev) => prev.filter((a) => a.productId !== productId))
    // También descartamos notificaciones huérfanas para no dejar avisos
    // asociados a seguimientos que ya no existen.
    setNotifications((prev) => prev.filter((n) => n.productId !== productId))
  }, [])

  const simulateArrival = useCallback(
    (productId: string, productName: string) => {
      // Buscamos la alerta actual dentro del propio setter para evitar
      // closures obsoletas: si no existe, no hacemos nada.
      let currentAlert: FavoriteAlert | null = null
      setAlerts((prev) => {
        currentAlert = prev.find((a) => a.productId === productId) ?? null
        return prev
      })
      if (!currentAlert) return
      // Efecto secundario en el inventario en memoria: marcamos disponible.
      setInventoryOverride(
        currentAlert.storeSlug,
        productId.split('/')[1] ?? productId,
        'disponible',
      )
      notificationCounter += 1
      const notification: AlertNotification = {
        id: `${Date.now()}-${notificationCounter}`,
        productId,
        storeSlug: currentAlert.storeSlug,
        state: 'disponible',
        message: `Simulación: ${productName} figura como disponible en la tienda seleccionada.`,
        createdAt: new Date().toISOString(),
        read: false,
      }
      setNotifications((prev) => [notification, ...prev])
    },
    [],
  )

  const markRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    )
  }, [])
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])
  const getAlertForProduct = useCallback(
    (productId: string): FavoriteAlert | null => alerts.find((a) => a.productId === productId) ?? null,
    [alerts],
  )

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const value: FavoriteAlertsState = {
    alerts,
    notifications,
    unreadCount,
    setAlert,
    changeAlertStore,
    disableAlert,
    simulateArrival,
    markRead,
    markAllRead,
    getAlertForProduct,
  }

  return <FavoriteAlertsContext.Provider value={value}>{children}</FavoriteAlertsContext.Provider>
}

export function useFavoriteAlerts(): FavoriteAlertsState {
  const ctx = useContext(FavoriteAlertsContext)
  if (!ctx) {
    throw new Error('useFavoriteAlerts debe usarse dentro de <FavoriteAlertsProvider>')
  }
  return ctx
}

// Utilidad pura para pintar el estado demostrativo actual de una tienda×producto.
export function currentInventoryStateFor(storeSlug: string, productId: string) {
  const modelSlug = productId.split('/')[1] ?? productId
  return getInventoryState(storeSlug, modelSlug)
}
