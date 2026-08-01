import { useEffect } from 'react'

/**
 * Permite abrir el chat de Bananito desde fuera del propio widget.
 *
 * En la web el chat se abre desde su burbuja flotante. Dentro de la app
 * nativa esa burbuja no existe —es un patrón de web, y además chocaría con la
 * barra de navegación inferior—, así que el chat vive en "Contacta con
 * nosotros", dentro del menú.
 *
 * Se resuelve con un evento del documento y no con un contexto porque
 * `ChatBubble` se monta fuera de `Layout` (ver `src/App.tsx`): un proveedor
 * tendría que envolver toda la aplicación solo para esto.
 */

const EVENTO = 'banana:abrir-chat'

export function openChat(): void {
  document.dispatchEvent(new CustomEvent(EVENTO))
}

/** Ejecuta `alAbrir` cuando alguien pide abrir el chat desde fuera. */
export function useChatOpenRequest(alAbrir: () => void): void {
  useEffect(() => {
    document.addEventListener(EVENTO, alAbrir)
    return () => document.removeEventListener(EVENTO, alAbrir)
  }, [alAbrir])
}
