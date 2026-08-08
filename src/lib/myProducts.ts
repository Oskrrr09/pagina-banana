import type { DbOrder, DbOrderLine } from './supabase'
import { getModel, variantPath } from '../data/products'
import type { CapacityOption, ColorVariant, Model } from '../data/types'

// Los productos que salen de las compras de un cliente.
//
// QUÉ REPRESENTA ESTO, Y QUÉ NO
//
// Esto es «productos presentes en las compras del cliente». NO es un inventario
// de aparatos físicos: no tenemos número de serie, ni IMEI, ni ningún
// identificador de unidad. Por eso dos compras de la misma variante en pedidos
// distintos son DOS entradas y no una — probablemente sean dos aparatos, y
// colapsarlas por su SKU haría desaparecer uno. Por la misma razón, una línea
// con `qty: 2` se enseña como «2 unidades» y no se parte en dos tarjetas: serían
// dos objetos inventados sin nada que los distinga.
//
// La identidad de cada entrada es el pedido más la línea, que es lo único
// verdadero que tenemos: «esta línea, de esta compra».
//
// CÓMO SE RESUELVE UNA COMPRA CONTRA EL CATÁLOGO
//
// Por slugs, nunca por texto visible. `family` + `modelSlug` dan el modelo,
// `colorSlug` da el color y `capacity` da la capacidad. El nombre del modelo y
// el del color se guardaron como estaban el día de la compra y sirven para
// enseñar lo que se compró, pero no para buscarlo: son texto editorial y
// cambian con una corrección de estilo o una traducción.
//
// Lo que no resuelve, no entra. No se adivina un producto a partir de su
// nombre: los accesorios se guardan con la variante pegada al nombre
// («Cargador MagSafe · 1 m») y los nombres de modelo son texto que cambia, así
// que una coincidencia no demuestra nada. Una línea que no se puede resolver
// sigue apareciendo en «Mis pedidos», que es donde el dato sí es fiel.

export interface ProductoComprado {
  /**
   * Identidad de esta entrada en la interfaz: pedido + posición de la línea.
   *
   * La posición y no el `id` de la línea, porque el `id` identifica el SKU y
   * dos líneas del mismo pedido podrían compartirlo — el carrito las junta,
   * pero lo guardado es jsonb y no lo garantiza. Con el `id` como clave, esas
   * dos entradas colisionarían y React pintaría una sola.
   *
   * No identifica un aparato físico; ver la cabecera del archivo.
   */
  clave: string
  pedidoId: string
  /** Fecha del pedido, en ISO. */
  compradoEn: string
  /** Unidades de esta línea. Puede ser mayor que 1. */
  cantidad: number

  /** Modelo del catálogo. Siempre resuelto: sin él la línea no llega aquí. */
  model: Model
  /** Color del catálogo, o `null` si ya no existe. */
  color: ColorVariant | null
  /** Capacidad del catálogo, o `null` si ya no existe. */
  capacity: CapacityOption | null

  /** Nombre del modelo tal y como se guardó al comprar. */
  nombre: string
  /** Nombre del color tal y como se guardó al comprar. */
  colorNombre: string
  /** Capacidad tal y como se guardó al comprar. */
  capacidad: string
  /** Imagen del catálogo. Las líneas de dispositivo nunca guardaron una. */
  imagen: string | undefined

  /**
   * Adónde lleva «Ver producto».
   *
   * Con color y capacidad resueltos, a esa variante exacta. Si alguno ya no
   * existe en el catálogo, a la ficha del modelo — nunca a otra variante, que
   * sería una ruta válida hacia un producto que no es el que se compró.
   */
  ruta: string
  /** ¿Se pudo resolver la variante exacta, o sólo el modelo? */
  varianteExacta: boolean
}

/**
 * Identidad de una línea guardada.
 *
 * COMPATIBILIDAD, NO CONTRATO
 *
 * El camino normal son los campos explícitos. El `id` sólo se mira cuando falta
 * alguno, y únicamente si su formato encaja exactamente y lo que saca de ahí se
 * confirma después contra el catálogo. Es una concesión a los datos que ya
 * existen, no una segunda forma válida de escribir una línea: lo que se guarde
 * a partir de ahora lleva los campos puestos.
 */
function identidadDe(line: DbOrderLine): { family: string; modelSlug: string; colorSlug: string | null } | null {
  // `id` de dispositivo: `familia/modelo/color/capacidad`. Cuatro partes justas.
  // Ningún slug de color ni ninguna capacidad del catálogo contiene `/`, así que
  // más o menos de cuatro significa que esto no es lo que parece.
  const partes = line.id?.split('/') ?? []
  const delId = partes.length === 4 ? { family: partes[0], modelSlug: partes[1], colorSlug: partes[2] } : null

  const family = line.family ?? delId?.family
  const modelSlug = line.modelSlug ?? delId?.modelSlug
  if (!family || !modelSlug) return null

  return { family, modelSlug, colorSlug: line.colorSlug ?? delId?.colorSlug ?? null }
}

/** Convierte una línea guardada en producto, o devuelve `null` si no se puede. */
function productoDeLinea(order: DbOrder, line: DbOrderLine, indice: number): ProductoComprado | null {
  // Las líneas antiguas no tienen `kind` y todas eran dispositivos: esa era la
  // convención cuando se escribieron.
  const kind = line.kind ?? 'device'
  // Los accesorios no son «tus productos»: pertenecen al pedido, y ahí siguen.
  if (kind !== 'device') return null

  const identidad = identidadDe(line)
  if (!identidad) return null

  const model = getModel(identidad.family, identidad.modelSlug)
  // Producto retirado del catálogo. No se inventa nada con el nombre guardado.
  if (!model) return null

  const color = identidad.colorSlug ? (model.colors.find((c) => c.color === identidad.colorSlug) ?? null) : null
  const capacity = color ? (color.capacities.find((k) => k.capacity === line.capacity) ?? null) : null
  const varianteExacta = Boolean(color && capacity)

  return {
    clave: `${order.id}#${indice}`,
    pedidoId: order.id,
    compradoEn: order.created_at,
    cantidad: Math.max(1, line.qty),
    model,
    color,
    capacity,
    nombre: line.name,
    colorNombre: line.color,
    capacidad: line.capacity,
    imagen: color?.image ?? model.colors[0]?.image,
    ruta: varianteExacta ? variantPath(model, color!, capacity!) : `/${model.family}/${model.slug}`,
    varianteExacta,
  }
}

/**
 * Los productos de una lista de pedidos, del más reciente al más antiguo.
 *
 * No agrupa ni deduplica. Ver la cabecera del archivo.
 */
export function productosDeMisPedidos(orders: DbOrder[]): ProductoComprado[] {
  return [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .flatMap((order) =>
      (order.lines ?? [])
        .map((line, indice) => productoDeLinea(order, line, indice))
        .filter((p): p is ProductoComprado => p !== null),
    )
}
