import type { DemoOrder } from './demoOrderRepository'

// Las compras hechas SIN cuenta que esperan a que alguien se identifique.
//
// POR QUÉ EXISTE ESTE ALMACÉN Y NO SE REUTILIZA EL DE CONFIRMACIÓN
//
// El pedido de la pantalla de confirmación vive en `sessionStorage`
// (`demoOrderRepository`) y ahí se queda: es lo que `/checkout/3` necesita para
// pintarse tras una recarga, y muere con la pestaña, que es exactamente lo que
// se quiere de una pantalla de confirmación.
//
// Una compra pendiente de vincular necesita lo contrario: sobrevivir a cerrar el
// navegador, porque la persona puede registrarse al día siguiente. Por eso va en
// `localStorage` y por eso es una cola aparte en vez de mudar todo el historial
// demostrativo a un almacenamiento permanente.
//
// SÓLO ENTRA LO QUE NACIÓ SIN CUENTA
//
// Una compra hecha con la sesión ya iniciada se escribe en `pedidos` en el
// propio checkout y NO pasa por aquí. Si pasara, la reconciliación intentaría
// subir después algo que ya está subido.
//
// EL RECLAMO ES DE UNA CUENTA, NO DEL NAVEGADOR
//
// En cuanto una cuenta permanente empieza a reclamar una compra pendiente, ésta
// queda marcada con su UID. Si el intento falla —sin red, Supabase caído—, el
// pendiente sobrevive para que ESA misma cuenta lo reintente, y **ninguna otra
// cuenta del mismo navegador puede heredarlo**. Sin esa marca, cerrar sesión y
// entrar con otra cuenta habría bastado para quedarse con la compra de alguien.

const CLAVE = 'banana:pending-guest-orders'

export interface PendingGuestOrder {
  /**
   * Identidad LOCAL de esta compra pendiente. No cambia nunca.
   *
   * Existe porque `order.id` sí puede cambiar: si al guardarla choca con un
   * pedido ajeno, la compra recibe un identificador nuevo. Si la cola se
   * indexara por `order.id`, ese renombrado convertiría la entrada en otra
   * distinta: la pantalla de confirmación dejaría de encontrarla y creería que
   * ya terminó, cuando el nuevo intento todavía puede fallar.
   *
   * Así que hay dos cosas separadas: quién es esta compra aquí (`clave`) y con
   * qué número se está intentando guardar (`order.id`).
   */
  clave: string
  /** El pedido tal y como lo creó el checkout. `order.id` es el candidato. */
  order: DemoOrder
  /** UID de la cuenta que lo está reclamando, si alguna ya empezó. */
  claimedBy?: string
}

/**
 * Nombre del evento que anuncia que la cola ha cambiado.
 *
 * La pantalla de confirmación necesita enterarse de que una compra se ha
 * guardado, y no puede hacerlo con un sondeo de duración fija: una
 * sincronización lenta terminaría bien y dejaría el mensaje antiguo en
 * pantalla. Con un aviso, la interfaz reacciona cuando pasa, tarde lo que tarde.
 *
 * Para los cambios hechos en OTRA pestaña está `storage`, que el navegador
 * emite solo; éste cubre los de la propia ventana, donde `storage` no llega.
 */
export const EVENTO_PENDIENTES = 'banana:pending-guest-orders-cambio'

function avisar() {
  try {
    window.dispatchEvent(new Event(EVENTO_PENDIENTES))
  } catch {
    /* sin ventana —pruebas unitarias en node—: nadie está escuchando */
  }
}

/** La clave de almacenamiento, para quien necesite escuchar `storage`. */
export const CLAVE_PENDIENTES = CLAVE

function leer(): PendingGuestOrder[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return []
    const valor = JSON.parse(crudo)
    // Un almacenamiento manipulado o escrito por otra versión no debe tumbar el
    // arranque de la aplicación: lo que no tenga forma de pedido se ignora.
    if (!Array.isArray(valor)) return []
    return valor.filter((p): p is PendingGuestOrder => Boolean(p?.clave) && Array.isArray(p?.order?.lines))
  } catch {
    return []
  }
}

function escribir(lista: PendingGuestOrder[]) {
  try {
    if (lista.length === 0) localStorage.removeItem(CLAVE)
    else localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    /* almacenamiento lleno o bloqueado: no se rompe la compra por esto */
  }
}

/** Las compras pendientes de vincular, en el orden en que se hicieron. */
export function listarPendientes(): PendingGuestOrder[] {
  return leer()
}

/**
 * Guarda una compra recién hecha sin cuenta.
 *
 * No duplica: si ese pedido ya está en la cola, se deja como está —con su
 * reclamo, si lo tuviera—.
 */
export function guardarPendiente(order: DemoOrder) {
  const lista = leer()
  if (lista.some((p) => p.clave === order.id)) return
  // La clave arranca siendo el identificador del pedido, que en ese momento es
  // único y ya está a mano. Lo que importa no es de dónde sale, sino que a
  // partir de aquí no cambie.
  escribir([...lista, { clave: order.id, order }])
  avisar()
}

/**
 * Marca una compra como reclamada por una cuenta, y dice si puede seguir.
 *
 * Devuelve `false` cuando ya la reclamó OTRA cuenta: ahí no se toca nada y el
 * pendiente se queda esperando a su dueño legítimo.
 *
 * Se escribe ANTES de intentar la escritura en el servidor, no después. Si se
 * marcara después, una caída entre el intento y la marca dejaría la compra
 * libre para la siguiente cuenta que entrara en ese navegador.
 */
export function reclamar(clave: string, uid: string): boolean {
  const lista = leer()
  const i = lista.findIndex((p) => p.clave === clave)
  if (i === -1) return false
  const actual = lista[i].claimedBy
  if (actual && actual !== uid) return false
  if (actual === uid) return true
  const copia = lista.slice()
  copia[i] = { ...copia[i], claimedBy: uid }
  escribir(copia)
  return true
}

/**
 * Retira una compra de la cola.
 *
 * Se llama SÓLO con la confirmación de que el servidor ya la tiene. Mientras el
 * resultado no sea seguro, el pendiente se queda: perder la compra por limpiar
 * demasiado pronto es peor que reintentarlo.
 */
export function consumir(clave: string) {
  escribir(leer().filter((p) => p.clave !== clave))
  avisar()
}

/**
 * Cambia el identificador de una compra pendiente conservando su reclamo.
 *
 * Hace falta en un caso muy concreto: el `id` chocó en la tabla con un pedido
 * que no es de esta cuenta. Ver `orderSync`.
 */
export function renombrar(clave: string, nuevoId: string) {
  const lista = leer()
  const i = lista.findIndex((p) => p.clave === clave)
  if (i === -1) return
  const copia = lista.slice()
  // Cambia el CANDIDATO, no la identidad: `clave` se queda como estaba, así que
  // quien esté observando esta compra la sigue encontrando.
  copia[i] = { ...copia[i], order: { ...copia[i].order, id: nuevoId } }
  escribir(copia)
  avisar()
}

/** ¿Hay alguna compra esperando a que esta cuenta —o cualquiera— la recoja? */
export function hayPendientes(): boolean {
  return leer().length > 0
}
