import type { Model } from '../data/types'

// Filtrado y ordenación del catálogo de una familia.
//
// Aparte de la página y sin React: son funciones puras sobre una lista de
// modelos, así que se prueban sin montar nada.
//
// SÓLO SE OFRECE LO QUE LOS DATOS SOPORTAN
//
// Precio y disponibilidad salen limpios del catálogo. Capacidad y color no: hay
// más de cuarenta cadenas distintas de capacidad —`13" · 16 GB · 256 GB`,
// `49 mm · GPS + Cellular`— que mezclan pulgadas, memoria, almacenamiento y
// conectividad en un solo texto libre. Filtrar por ahí exigiría normalizar
// antes el modelo de datos; ofrecerlo sin eso daría un filtro que casi nunca
// acierta, que es peor que no tenerlo.

export type Orden = 'catalogo' | 'precio-asc' | 'precio-desc'

/** Los tres valores reales de `availability` en el catálogo. */
export type Disponibilidad = 'disponible' | 'bajo-pedido' | 'agotado'

export interface FiltrosCatalogo {
  /** Precio máximo en euros. `null` = sin tope. */
  precioMax: number | null
  /** Vacío = todas. */
  disponibilidad: Disponibilidad[]
  orden: Orden
}

export const FILTROS_VACIOS: FiltrosCatalogo = {
  precioMax: null,
  disponibilidad: [],
  orden: 'catalogo',
}

/** Tramos de precio. Se guardan como cifra y el rótulo se compone al pintar:
 *  el símbolo del euro no va en el mismo sitio en todos los idiomas. */
export const TRAMOS_PRECIO = [500, 1000, 1500, 2000] as const

/** Disponibilidad de un modelo: la mejor de todas sus variantes. */
export function disponibilidadDe(model: Model): Disponibilidad {
  const todas = model.colors.flatMap((c) => c.capacities.map((k) => k.availability as Disponibilidad))
  if (todas.includes('disponible')) return 'disponible'
  if (todas.includes('bajo-pedido')) return 'bajo-pedido'
  return 'agotado'
}

/**
 * Aplica filtros y orden.
 *
 * El orden `catalogo` **conserva el del catálogo tal cual**. Se llama así y no
 * «recomendados» a propósito: no hay ninguna señal de recomendación detrás
 * —ni ventas, ni valoraciones, ni comportamiento—, y ponerle ese nombre
 * prometería un algoritmo que no existe.
 */
export function aplicarFiltros(models: Model[], filtros: FiltrosCatalogo): Model[] {
  let salida = models

  if (filtros.precioMax != null) {
    const tope = filtros.precioMax
    salida = salida.filter((m) => m.fromPrice <= tope)
  }

  if (filtros.disponibilidad.length > 0) {
    salida = salida.filter((m) => filtros.disponibilidad.includes(disponibilidadDe(m)))
  }

  if (filtros.orden === 'precio-asc') salida = [...salida].sort((a, b) => a.fromPrice - b.fromPrice)
  if (filtros.orden === 'precio-desc') salida = [...salida].sort((a, b) => b.fromPrice - a.fromPrice)

  return salida
}

/** ¿Hay algo aplicado? Sirve para enseñar el contador y el botón de limpiar. */
export function cuentaFiltrosActivos(filtros: FiltrosCatalogo): number {
  return (filtros.precioMax != null ? 1 : 0) + (filtros.disponibilidad.length > 0 ? 1 : 0)
}

// ---- Serialización a la URL -------------------------------------------------
//
// Los filtros viven en la barra de direcciones y no sólo en memoria: así
// Atrás y Adelante los conservan, y un enlace compartido llega con lo mismo que
// veía quien lo mandó. Sólo se escriben los parámetros con valor, para no
// ensuciar la URL de la mayoría, que no filtra nada.

// QUÉ SE OFRECE Y CÓMO SE LLAMA — LO MISMO EN LAS DOS PLATAFORMAS
//
// Web y app pintan estos controles de forma distinta —ver `CatalogFiltersWeb` y
// `CatalogFiltersApp`—, pero lo que ofrecen no puede divergir: los mismos tres
// órdenes, los mismos tres estados y en el mismo orden. Vive aquí, con la
// lógica que ya valida la URL contra estas listas, para que separar la
// presentación no acabe separando también la semántica.
//
// Las etiquetas de disponibilidad son las que ya usa la ficha de producto: el
// mismo estado debe llamarse igual en toda la tienda.
export const ORDENES: {
  valor: Orden
  clave: 'catalog.sort.default' | 'catalog.sort.priceAsc' | 'catalog.sort.priceDesc'
}[] = [
  { valor: 'catalogo', clave: 'catalog.sort.default' },
  { valor: 'precio-asc', clave: 'catalog.sort.priceAsc' },
  { valor: 'precio-desc', clave: 'catalog.sort.priceDesc' },
]

export const DISPONIBILIDADES: {
  valor: Disponibilidad
  clave: 'availability.inStock' | 'availability.backorder' | 'availability.soldOut'
}[] = [
  { valor: 'disponible', clave: 'availability.inStock' },
  { valor: 'bajo-pedido', clave: 'availability.backorder' },
  { valor: 'agotado', clave: 'availability.soldOut' },
]

const VALORES_ORDEN = ORDENES.map((o) => o.valor)
const VALORES_DISPONIBILIDAD = DISPONIBILIDADES.map((d) => d.valor)

export function leerFiltrosDeUrl(params: URLSearchParams): FiltrosCatalogo {
  const precioBruto = Number(params.get('precio'))
  const precioMax = Number.isFinite(precioBruto) && precioBruto > 0 ? precioBruto : null

  const disponibilidad = (params.get('disp') ?? '')
    .split(',')
    .filter((v): v is Disponibilidad => VALORES_DISPONIBILIDAD.includes(v as Disponibilidad))

  const ordenBruto = params.get('orden')
  const orden = VALORES_ORDEN.includes(ordenBruto as Orden) ? (ordenBruto as Orden) : 'catalogo'

  return { precioMax, disponibilidad, orden }
}

export function escribirFiltrosEnUrl(filtros: FiltrosCatalogo): URLSearchParams {
  const params = new URLSearchParams()
  if (filtros.precioMax != null) params.set('precio', String(filtros.precioMax))
  if (filtros.disponibilidad.length > 0) params.set('disp', filtros.disponibilidad.join(','))
  if (filtros.orden !== 'catalogo') params.set('orden', filtros.orden)
  return params
}
