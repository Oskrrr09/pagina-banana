import { useMemo } from 'react'
import { useStore } from '../../lib/store'
import { useStorePreference } from '../../lib/storePreference'
import { useFavoriteAlerts } from '../../lib/favoriteAlerts'
import { allModels } from '../../data/products'
import type { Model } from '../../data/types'

/**
 * Todo lo que Favoritos necesita **saber y hacer**, sin decidir nada de cómo
 * se ve.
 *
 * POR QUÉ EXISTE
 *
 * La página tiene dos composiciones —la histórica de la web y la nativa— y
 * varias de sus acciones no son una llamada suelta, sino una combinación:
 * retirar un favorito además desactiva su seguimiento para no dejar avisos
 * huérfanos, y elegir tienda de seguimiento la guarda como favorita si aún no
 * había ninguna. Esas combinaciones son DOMINIO, no presentación, y escritas
 * dos veces divergirían en cuanto una de las dos cambiase.
 *
 * Así que aquí vive el comportamiento entero y las dos superficies consumen el
 * mismo objeto. Es el criterio de D-085 —compartir código no es compartir
 * composición— aplicado a la inversa de lo habitual: lo que se comparte es
 * justamente lo que no se ve.
 */
export function useFavoritos() {
  const { favorites, toggleFavorite } = useStore()
  const { favoriteStore, setFavorite: setFavoriteStore } = useStorePreference()
  const {
    alerts,
    notifications,
    setAlert,
    changeAlertStore,
    disableAlert,
    simulateArrival,
    markRead,
    markAllRead,
    getAlertForProduct,
  } = useFavoriteAlerts()

  const favModels = useMemo<Model[]>(
    () => allModels.filter((m) => favorites.some((f) => f.startsWith(`${m.family}/${m.slug}`))),
    [favorites],
  )

  const trackedAlerts = alerts.filter((a) => a.enabled)

  return {
    favModels,
    trackedAlerts,
    notifications,
    favoriteStoreSlug: favoriteStore?.slug ?? null,
    getAlertForProduct,
    changeAlertStore,
    disableAlert,
    simulateArrival,
    markRead,
    markAllRead,

    /**
     * Retira el favorito y, con él, su seguimiento.
     *
     * El orden importa: primero se desactiva el aviso y después se quita el
     * favorito. Al revés quedaría un aviso apuntando a un producto que ya no
     * está en la lista, que es el «huérfano» que cubre `favorites-alerts`.
     */
    quitar(productId: string) {
      disableAlert(productId)
      toggleFavorite(productId)
    },

    /**
     * Empieza a seguir la disponibilidad en una tienda y, si quien lo hace aún
     * no tenía tienda favorita, la guarda también como tal: es la primera vez
     * que ha dicho a qué tienda va.
     */
    seguir(productId: string, storeSlug: string) {
      setAlert(productId, storeSlug)
      if (!favoriteStore) setFavoriteStore(storeSlug)
    },
  }
}
