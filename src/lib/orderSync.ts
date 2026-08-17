import { supabase, type DbOrder, type DbOrderLine } from './supabase'
import { INSURANCE_MONTHLY, type DemoOrder, type DemoOrderLine } from './demoOrderRepository'
import { nuevoIdDePedido } from './orderId'
import { consumir, listarPendientes, reclamar, renombrar } from './pendingGuestOrders'

// Espejo de los pedidos demostrativos en Supabase.
//
// El pedido "de verdad" del prototipo sigue viviendo en sessionStorage
// (demoOrderRepository), igual que antes: quien compra como invitado no
// nota ningún cambio. Cuando hay sesión de cliente guardamos además una
// copia para que "Mis pedidos" sobreviva a cerrar el navegador.
//
// Si el espejo falla, NO se rompe la compra: el pedido demostrativo ya
// existe y el usuario ve su confirmación igual. Solo se registra el error.
//
// UNA RESERVA NO ES UNA COMPRA
//
// El `DemoOrder` local recoge todo lo que pasó en ese paso por caja, compras y
// reservas juntas, y la pantalla de confirmación las enseña juntas con razón.
// La tabla `pedidos` no: ahí sólo va lo comprado, porque las reservas ya tienen
// su sitio en `reservas` con su cola y su estado.
//
// Antes se espejaba `order.lines` entero. Con un carrito mixto —algo comprado y
// algo reservado— la línea reservada acababa en `pedidos` sin ninguna marca, y
// además contaba en `products_total`. Nadie lo veía porque «Mis pedidos» sólo
// pintaba cantidad y nombre, pero el dato decía que el cliente había comprado
// un aparato que en realidad estaba esperando en una lista. Filtrar aquí y no
// en quien llama es a propósito: este módulo es el que decide qué entra en
// `pedidos`, y así ningún futuro llamante puede saltárselo.

/** Lo comprado de verdad: todo lo que no sea una reserva. */
function lineasCompradas(order: DemoOrder): DemoOrderLine[] {
  return order.lines.filter((line) => !line.reservation)
}

/**
 * Traduce una línea local a la forma que se guarda.
 *
 * Se conserva la identidad —`id`, `family`, `modelSlug`, `kind`, `colorSlug`—
 * para poder volver del pedido al producto del catálogo. Sin ella, de una
 * compra guardada sólo quedaba un nombre suelto.
 */
function aLineaPersistida(line: DemoOrderLine): DbOrderLine {
  return {
    id: line.id,
    family: line.family,
    modelSlug: line.modelSlug,
    kind: line.kind ?? 'device',
    colorSlug: line.colorSlug,
    name: line.name,
    color: line.color,
    capacity: line.capacity,
    price: line.price,
    qty: line.qty,
    insured: line.insured,
    image: line.image,
  }
}

/**
 * La fila que se va a guardar, sin tocar la red.
 *
 * Está fuera de `mirrorOrderToSupabase` para poder comprobar el contrato —qué
 * líneas entran y qué agregados salen— sin levantar Supabase. Devuelve `null`
 * cuando no hay nada que guardar.
 */
export function construirFilaDePedido(clienteId: string, order: DemoOrder) {
  const compradas = lineasCompradas(order)
  // Un pedido íntegramente de reservas no genera fila: hoy el checkout ya no
  // llama aquí en ese caso, pero la garantía vive donde se toma la decisión.
  if (compradas.length === 0) return null

  // Los agregados se recalculan sobre lo que se guarda, no se copian del
  // pedido local: si se copiaran, un carrito mixto dejaría una fila cuyo total
  // incluye un artículo que no aparece entre sus líneas.
  const unidadesAseguradas = compradas.reduce((n, l) => n + (l.insured ? l.qty : 0), 0)

  return {
    id: order.id,
    cliente_id: clienteId,
    created_at: order.createdAt,
    delivery: order.delivery,
    payment_method: order.paymentMethod,
    financing_months: order.financingMonths ?? null,
    products_total: compradas.reduce((n, l) => n + l.price * l.qty, 0),
    insurance_total: unidadesAseguradas * INSURANCE_MONTHLY,
    insured_units: unidadesAseguradas,
    lines: compradas.map(aLineaPersistida),
    status: order.status,
  }
}

export async function mirrorOrderToSupabase(clienteId: string, order: DemoOrder): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no está configurado.' }

  const row = construirFilaDePedido(clienteId, order)
  if (!row) return { error: null }

  const { error } = await supabase.from('pedidos').insert(row)
  if (error) {
    console.error('[orderSync] no se pudo guardar el pedido', error)
    return { error: error.message }
  }
  return { error: null }
}

export async function listMyOrders(clienteId: string): Promise<{ orders: DbOrder[]; error: string | null }> {
  if (!supabase) return { orders: [], error: 'Supabase no está configurado.' }
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) return { orders: [], error: error.message }
  return { orders: (data ?? []) as DbOrder[], error: null }
}

// ============================================================================
// RECUPERAR UNA COMPRA HECHA SIN CUENTA
//
// Quien compra sin identificarse deja su pedido en la cola de
// `pendingGuestOrders`. Cuando aparece una cuenta permanente —al iniciar
// sesión, al registrarse, o al restaurar la sesión en una recarga— esa compra
// se escribe en `pedidos` a su nombre.
//
// EL DUEÑO LO PONE EL SERVIDOR, NO EL NAVEGADOR
//
// `cliente_id` sale SIEMPRE del uid de la sesión en curso; nunca del pedido
// guardado ni de nada que venga del almacenamiento local. Y aunque alguien
// manipulara esto, la política `cliente crea sus pedidos` exige
// `cliente_id = auth.uid()` en su `with check`: el servidor rechazaría la fila.
//
// POR QUÉ NO HAY `upsert`
//
// Sería lo cómodo para la idempotencia, pero `pedidos` no lo admite: la tabla
// concede a `authenticated` sólo `select, insert` —ni siquiera existe el
// privilegio de UPDATE— y no hay política de UPDATE. Un `on conflict do update`
// fallaría por permisos. La idempotencia se resuelve con lectura, inserción y
// tratamiento explícito del conflicto.
// ============================================================================

/** Código de PostgreSQL para violación de clave única. */
const CONFLICTO = '23505'

/** Cuántas veces se reintenta cuando el identificador choca con uno ajeno. */
const MAX_REINTENTOS_DE_ID = 3

export type ResultadoSincronizacion = 'sincronizado' | 'ya-estaba' | 'error'

/**
 * Cómo terminó, y con qué identificador quedó el pedido.
 *
 * El `id` importa porque puede haber cambiado por el camino: si el original
 * chocaba con un pedido ajeno, la compra se queda con uno nuevo, y es ÉSE el
 * que hay que retirar de la cola.
 */
export interface Sincronizacion {
  resultado: ResultadoSincronizacion
  /** Identificador con el que quedó el pedido; puede no ser el de partida. */
  id: string
}

/**
 * ¿De quién es este pedido, si es que existe?
 *
 * TRES RESPUESTAS, NO DOS
 *
 * La consulta va bajo RLS, así que sólo devuelve filas propias. Pero eso hace
 * que «no hay fila» y «no pude leer» se parezcan mucho, y **no significan lo
 * mismo**:
 *
 *  · `mio`     — la lectura fue bien y la fila está: la subí yo.
 *  · `ausente` — la lectura fue bien y no hay nada visible para mí.
 *  · `error`   — no se pudo leer. **No se sabe nada.**
 *
 * Colapsar `error` en `ausente` tenía una consecuencia grave: tras un conflicto
 * de clave, un fallo de red se habría interpretado como «ese identificador es de
 * otra persona», y la respuesta a eso es renombrar la compra e insertarla otra
 * vez. Es decir, un corte de red podía **duplicar el pedido**.
 */
type Propiedad = 'mio' | 'ausente' | 'error'

async function deQuienEs(id: string): Promise<Propiedad> {
  // El `try` no sobra: una consulta puede fallar de dos maneras distintas. Un
  // 500 de PostgREST o un error de RLS llegan como `{ error }`; una petición
  // cortada por la red LANZA. Las dos son el mismo desconocimiento, y las dos
  // tienen que responder `error` — no `ausente`.
  try {
    const { data, error } = await supabase!.from('pedidos').select('id').eq('id', id).maybeSingle()
    if (error) {
      console.error('[orderSync] no se pudo comprobar si el pedido ya existe', error)
      return 'error'
    }
    return data ? 'mio' : 'ausente'
  } catch (fallo) {
    console.error('[orderSync] no se pudo comprobar si el pedido ya existe', fallo)
    return 'error'
  }
}

/**
 * Escribe una compra pendiente a nombre de la cuenta indicada.
 *
 * Es seguro llamarla dos veces, incluso a la vez: dos reconciliaciones que
 * compitan acaban con UNA fila. La que pierde recibe el conflicto de clave,
 * vuelve a preguntar, se encuentra el pedido ya suyo y termina bien.
 */
export async function sincronizarPendiente(
  clienteId: string,
  clave: string,
  order: DemoOrder,
): Promise<Sincronizacion> {
  let id = order.id
  if (!supabase) return { resultado: 'error', id }

  for (let intento = 0; intento < MAX_REINTENTOS_DE_ID; intento++) {
    const antes = await deQuienEs(id)
    if (antes === 'mio') return { resultado: 'ya-estaba', id }
    // Sin saber si la fila existe no se inserta a ciegas: podría estar ya
    // escrita de un intento anterior. La compra se queda en la cola y se
    // reintenta cuando esta misma cuenta vuelva a aparecer.
    if (antes === 'error') return { resultado: 'error', id }

    const fila = construirFilaDePedido(clienteId, { ...order, id })
    // Un pedido sin nada comprado —sólo reservas— no genera fila, y eso no es
    // un error: se da por resuelto para que salga de la cola.
    if (!fila) return { resultado: 'ya-estaba', id }

    const { error } = await supabase.from('pedidos').insert(fila)
    if (!error) return { resultado: 'sincronizado', id }

    if (error.code !== CONFLICTO) {
      console.error('[orderSync] no se pudo recuperar la compra invitada', error)
      return { resultado: 'error', id }
    }

    // Hubo conflicto de clave. TRES posibilidades, y se distinguen preguntando:
    //
    //  · el pedido es AHORA mío  → otra reconciliación mía ganó la carrera, y
    //    esto es un éxito idempotente, no un fallo;
    //  · ausente                 → la lectura fue bien y no lo veo, así que ese
    //    identificador pertenece a un pedido ajeno. No se intenta tocar: se le
    //    da a ESTA compra un identificador nuevo y se reintenta;
    //  · error                   → no se sabe. Renombrar aquí sería duplicar la
    //    compra si la fila anterior era mía y no pude leerla. Se conserva el
    //    identificador y la cola, y se reintenta más tarde.
    const despues = await deQuienEs(id)
    if (despues === 'mio') return { resultado: 'ya-estaba', id }
    if (despues === 'error') return { resultado: 'error', id }

    const siguiente = nuevoIdDePedido()
    renombrar(clave, siguiente)
    id = siguiente
  }

  console.error('[orderSync] el identificador siguió chocando tras varios intentos')
  return { resultado: 'error', id }
}

/** Evita que dos disparos simultáneos hagan el mismo trabajo dos veces. */
let enCurso: Promise<number> | null = null

/**
 * Sube a la cuenta todas las compras pendientes que le correspondan.
 *
 * Devuelve cuántas quedaron guardadas. Es idempotente y se puede llamar desde
 * más de un sitio —inicio de sesión, alta, restauración de sesión— sin
 * coordinar a los llamantes: mientras hay una ejecución viva, la siguiente se
 * engancha a ella en vez de empezar otra.
 */
export function recuperarComprasInvitadas(clienteId: string): Promise<number> {
  if (enCurso) return enCurso
  enCurso = (async () => {
    let guardadas = 0
    for (const pendiente of listarPendientes()) {
      // Reclamar antes de intentar nada. Si ya lo tenía pedido otra cuenta, esta
      // compra no es de quien está preguntando y se queda donde está.
      if (!reclamar(pendiente.clave, clienteId)) continue

      const { resultado } = await sincronizarPendiente(clienteId, pendiente.clave, pendiente.order)
      if (resultado === 'error') continue
      // Sólo aquí, con el servidor confirmando, se retira de la cola. Por su
      // CLAVE, que no cambia aunque el identificador del pedido sí lo haya
      // hecho.
      consumir(pendiente.clave)
      if (resultado === 'sincronizado') guardadas++
    }
    return guardadas
  })().finally(() => {
    enCurso = null
  })
  return enCurso
}
