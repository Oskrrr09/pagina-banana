import { useEffect, useMemo, useRef, useState } from 'react'
import type { InboxItem } from './chatSession'

/**
 * Conversaciones sin leer del agente.
 *
 * No hay columna de "leído" en la base de datos y no se añade a propósito:
 * sería estado por agente y por conversación, y en la demostración atiende una
 * sola persona. Se guarda en el navegador del agente, con lo que eso implica
 * y conviene no olvidar: si entra desde otro equipo, empieza de cero.
 *
 * Sin leer = el último mensaje lo escribió el visitante y es posterior a la
 * última vez que el agente abrió esa conversación.
 */

const SEEN_KEY = 'banana:agente-visto'

type SeenMap = Record<string, string>

function loadSeen(): SeenMap {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as SeenMap) : {}
  } catch {
    return {}
  }
}

function saveSeen(seen: SeenMap): void {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
  } catch {
    // Modo privado o cuota llena: no leer no es motivo para romper el panel.
  }
}

export function useUnreadConversations(
  items: InboxItem[],
  selectedId: string | null,
): { unreadIds: Set<string>; count: number } {
  const [seen, setSeen] = useState<SeenMap>(loadSeen)

  // Abrir una conversación la marca como leída hasta su último mensaje.
  useEffect(() => {
    if (!selectedId) return
    const item = items.find((i) => i.conversation.id === selectedId)
    const marca = item?.lastMessage?.created_at ?? item?.conversation.ultimo_mensaje_at
    if (!marca) return
    setSeen((previo) => {
      if (previo[selectedId] === marca) return previo
      const siguiente = { ...previo, [selectedId]: marca }
      saveSeen(siguiente)
      return siguiente
    })
  }, [items, selectedId])

  const unreadIds = useMemo(() => {
    const ids = new Set<string>()
    for (const item of items) {
      const ultimo = item.lastMessage
      if (!ultimo || ultimo.autor !== 'visitor') continue
      const visto = seen[item.conversation.id]
      if (!visto || ultimo.created_at > visto) ids.add(item.conversation.id)
    }
    return ids
  }, [items, seen])

  return { unreadIds, count: unreadIds.size }
}

/**
 * Llama a `onNuevo` cuando entra un mensaje de visitante que el agente no
 * había visto todavía. Sirve para lanzar la notificación del sistema.
 *
 * En el primer render solo toma nota de lo que ya hay: sin esto, abrir el
 * panel dispararía una notificación por cada conversación pendiente.
 */
export function useNewMessageAlert(
  items: InboxItem[],
  onNuevo: (item: InboxItem) => void,
): void {
  const conocidos = useRef<Map<string, string> | null>(null)
  const callback = useRef(onNuevo)
  callback.current = onNuevo

  useEffect(() => {
    const actual = new Map<string, string>()
    for (const item of items) {
      if (item.lastMessage) actual.set(item.conversation.id, item.lastMessage.id)
    }

    if (conocidos.current === null) {
      conocidos.current = actual
      return
    }

    for (const item of items) {
      const ultimo = item.lastMessage
      if (!ultimo || ultimo.autor !== 'visitor') continue
      if (conocidos.current.get(item.conversation.id) !== ultimo.id) {
        callback.current(item)
      }
    }
    conocidos.current = actual
  }, [items])
}
