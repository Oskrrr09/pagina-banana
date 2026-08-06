// Aviso interno de que una cuenta de cliente ha cerrado sesión.
//
// POR QUÉ HACE FALTA UN EVENTO Y NO UNA LLAMADA DIRECTA
//
// Las preferencias de cuenta —tienda favorita, seguimientos de disponibilidad y
// notificaciones— viven en `StorePreferenceProvider` y `FavoriteAlertsProvider`,
// que están **por debajo** de `CustomerAuthProvider` en el árbol (ver
// `src/main.tsx`). Desde el proveedor de sesión no se pueden usar sus hooks, y
// reordenar los proveedores sólo para esto arrastraría al Header, al checkout y
// al panel de agentes, que dependen del orden actual.
//
// Así que el proveedor de sesión avisa y quien tenga algo que reiniciar
// escucha. Cada proveedor sigue siendo dueño de su estado: nadie escribe en el
// de otro.
//
// El evento es deliberadamente concreto —«se ha cerrado la sesión de un
// cliente»— y no un `reset` genérico. Un nombre genérico invita a colgar de él
// cosas que no tienen que ver, y acabaría borrando el carrito o el idioma.

type Escucha = () => void

const escuchas = new Set<Escucha>()

/**
 * Registra un reinicio que debe ejecutarse al cerrar sesión una cuenta.
 * Devuelve la función para darse de baja, pensada para `useEffect`.
 */
export function alCerrarSesionCliente(escucha: Escucha): () => void {
  escuchas.add(escucha)
  return () => {
    escuchas.delete(escucha)
  }
}

/**
 * Avisa a los proveedores suscritos.
 *
 * Cada escucha va en su propio `try`: el cierre de sesión no se puede quedar a
 * medias porque un reinicio falle. Si `localStorage` lanza —modo privado de
 * Safari, cuota agotada, permisos—, el resto de escuchas se ejecutan igual y
 * quien cerró sesión sale de verdad.
 */
export function notificarCierreSesionCliente(): void {
  for (const escucha of [...escuchas]) {
    try {
      escucha()
    } catch (error) {
      console.error('[accountSession] un reinicio falló al cerrar sesión', error)
    }
  }
}
