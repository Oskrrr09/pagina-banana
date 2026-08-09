// Ancho de la lista de conversaciones del panel de agentes.
//
// La lógica vive aparte del componente porque lo que puede romperse aquí es
// aritmética —que el arrastre no deje ninguno de los dos paneles inservible— y
// eso se prueba sin montar nada.

/** Por debajo de esto la lista deja de poder leerse: nombre, extracto y hora. */
export const MINIMO_LISTA = 280

/** Lo que la conversación necesita como mínimo para no estrangularse. */
export const MINIMO_CONVERSACION = 360

/** Con qué ancho abre la primera vez. */
export const ANCHO_INICIAL = 400

/**
 * Y un tope proporcional: en una pantalla ancha, una lista de 900 px no aporta
 * nada y le roba sitio a lo que se está leyendo.
 */
export const MAXIMO_PROPORCION = 0.55

/**
 * Lo que ocupa el propio divisor.
 *
 * Parecen nueve píxeles sin importancia y no lo son: si no se descuentan, el
 * mínimo de la conversación se calcula sobre un espacio que no existe.
 */
export const ANCHO_DIVISOR = 9

/**
 * Hasta dónde puede llegar la lista con el espacio que hay.
 *
 * `anchoContenedor` es el del bloque `lista | divisor | conversación`, y NADA
 * más. La ficha del visitante queda fuera a propósito: es una tercera columna
 * que no participa del reparto, y contarla llevaba a anunciar máximos que
 * dejaban la conversación en 279 px a 1280 y en 351 a 1440, por debajo de su
 * mínimo.
 */
export function maximoLista(anchoContenedor: number): number {
  const topeProporcional = anchoContenedor * MAXIMO_PROPORCION
  const topePorConversacion = anchoContenedor - MINIMO_CONVERSACION - ANCHO_DIVISOR
  return Math.min(topeProporcional, topePorConversacion)
}

const CLAVE = 'banana:agente-ancho-lista'

/**
 * Encaja un ancho pedido dentro de lo que el contenedor permite.
 *
 * Los tres límites pueden contradecirse en una ventana estrecha —el mínimo de
 * la lista más el mínimo de la conversación pueden no caber—, y entonces manda
 * el de la conversación: es donde se está trabajando. Si ni así cabe, se
 * devuelve el mínimo de la lista y el contenedor se encarga; nunca un número
 * negativo.
 */
export function encajarAncho(pedido: number, anchoContenedor: number): number {
  if (!Number.isFinite(pedido) || !Number.isFinite(anchoContenedor) || anchoContenedor <= 0) {
    return MINIMO_LISTA
  }

  const maximo = maximoLista(anchoContenedor)

  if (maximo < MINIMO_LISTA) return MINIMO_LISTA
  return Math.round(Math.min(Math.max(pedido, MINIMO_LISTA), maximo))
}

/**
 * Lee el ancho guardado, o el inicial.
 *
 * Guardar la preferencia es barato —un número— y evita que quien trabaja en el
 * panel tenga que recolocar la lista cada vez que entra. Si el almacenamiento
 * no está disponible o guarda basura, se cae al inicial sin ruido.
 */
export function leerAnchoGuardado(): number {
  try {
    if (typeof window === 'undefined') return ANCHO_INICIAL
    const bruto = window.localStorage.getItem(CLAVE)
    if (!bruto) return ANCHO_INICIAL
    const valor = Number(bruto)
    return Number.isFinite(valor) && valor > 0 ? valor : ANCHO_INICIAL
  } catch {
    return ANCHO_INICIAL
  }
}

export function guardarAncho(ancho: number): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(CLAVE, String(Math.round(ancho)))
  } catch {
    /* almacenamiento no disponible: el ancho vale para esta sesión igualmente */
  }
}
