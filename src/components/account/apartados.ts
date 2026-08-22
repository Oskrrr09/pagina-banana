// Los apartados de «Mi cuenta», y la gramática de sus direcciones.
//
// POR QUÉ SON SUBRUTAS Y NO UN PARÁMETRO
//
// Hasta la PR de navegación nativa cada apartado era `/cuenta?apartado=X`. Eso
// funcionaba —la URL ya era la fuente de verdad— pero tenía un techo: el
// armazón nativo decide si una pantalla lleva «Volver» mirando el PATHNAME, así
// que `/cuenta?apartado=pedidos` era `/cuenta`, o sea una raíz de pestaña, y
// nunca podía ofrecer retroceso. Con un segmento propio la pantalla es
// secundaria por construcción y el control aparece sin excepciones.
//
// La web usa las mismas direcciones: una sola gramática para las dos
// superficies. El parámetro antiguo sigue entrando y se normaliza con
// `replace`.

export const APARTADOS = [
  { id: 'datos', label: 'Datos personales' },
  { id: 'envio', label: 'Dirección de envío' },
  { id: 'facturacion', label: 'Dirección de facturación' },
  { id: 'pedidos', label: 'Mis pedidos' },
  { id: 'reservas', label: 'Mis reservas' },
  { id: 'descuento', label: 'Descuento educativo' },
  { id: 'favoritos', label: 'Favoritos y tienda' },
] as const

export type Apartado = (typeof APARTADOS)[number]['id']

/** ¿Este segmento es uno de los siete apartados? */
export function esApartado(valor: string | null | undefined): valor is Apartado {
  return APARTADOS.some((a) => a.id === valor)
}

/**
 * La dirección de un apartado, conservando el resto de la consulta.
 *
 * Se conserva porque no es nuestra: alguien puede llegar con `utm=` o con
 * cualquier otra cosa, y perderla por el camino al cambiar de apartado sería
 * romper su enlace sin motivo.
 */
export function rutaDeApartado(id: Apartado, params?: URLSearchParams): string {
  const resto = new URLSearchParams(params ?? undefined)
  resto.delete('apartado')
  const cadena = resto.toString()
  return cadena ? `/cuenta/${id}?${cadena}` : `/cuenta/${id}`
}

/** La raíz de la cuenta, conservando también el resto de la consulta. */
export function rutaRaizCuenta(params?: URLSearchParams): string {
  const resto = new URLSearchParams(params ?? undefined)
  resto.delete('apartado')
  const cadena = resto.toString()
  return cadena ? `/cuenta?${cadena}` : '/cuenta'
}
