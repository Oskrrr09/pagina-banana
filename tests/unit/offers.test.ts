import { describe, expect, it } from 'vitest'
import { getOfferVariant, presentacionDeTarjeta, tieneOferta } from '../../src/lib/offers'
import { allModels, getModel, variantPath } from '../../src/data/products/index'
import type { Model } from '../../src/data/types'

// Detección de la variante realmente ofertada.
//
// El caso que motiva todo esto: un modelo cuya PRIMERA capacidad no tiene
// rebaja y sí la tiene otra posterior. Mirando sólo `colors[0].capacities[0]`
// —como se hacía— ese modelo desaparecía de las ofertas.

function variante(capacity: string, price: number, previousPrice: number | null) {
  return { capacity, price, previousPrice, availability: 'disponible' }
}

function modelo(colores: { name: string; capacities: ReturnType<typeof variante>[] }[]): Model {
  return {
    family: 'mac',
    slug: 'prueba',
    name: 'Prueba',
    tagline: '',
    fromPrice: colores[0].capacities[0].price,
    colors: colores.map((c) => {
      const slug = c.name.toLowerCase().replace(/ /g, '-')
      // Imagen distinta por color: es lo que permite comprobar que la tarjeta
      // enseña la foto de la variante ofertada y no la de la primera.
      return { color: slug, name: c.name, hex: '#000', image: `/img/${slug}.webp`, ...c }
    }),
  } as unknown as Model
}

describe('getOfferVariant', () => {
  it('devuelve null cuando ninguna variante está rebajada', () => {
    const m = modelo([{ name: 'Plata', capacities: [variante('256GB', 1000, null), variante('512GB', 1200, null)] }])
    expect(getOfferVariant(m)).toBeNull()
    expect(tieneOferta(m)).toBe(false)
  })

  it('encuentra la oferta aunque la PRIMERA capacidad no la tenga', () => {
    // Es exactamente la forma del MacBook Air M5 en el catálogo real.
    const m = modelo([
      {
        name: 'Azul cielo',
        capacities: [variante('13" · 512 GB', 1319, null), variante('15" · 512 GB', 1579, 1649)],
      },
    ])

    const oferta = getOfferVariant(m)
    expect(oferta, 'la rebaja está en la segunda capacidad, no en la primera').not.toBeNull()
    expect(oferta!.capacity.capacity).toBe('15" · 512 GB')
    expect(oferta!.precio).toBe(1579)
    expect(oferta!.precioAnterior).toBe(1649)
  })

  it('el precio, el anterior y el porcentaje son de la MISMA variante', () => {
    const m = modelo([{ name: 'Plata', capacities: [variante('A', 1319, null), variante('B', 1579, 1649)] }])
    const oferta = getOfferVariant(m)!

    // El fallo que se quiere evitar: enseñar el «desde» de la variante de
    // entrada (1319) junto al precio anterior de otra (1649), que daría un
    // descuento del 20 % que nadie puede comprar.
    expect(oferta.precio, 'no puede ser el fromPrice del modelo').not.toBe(m.fromPrice)
    expect(oferta.descuento).toBe(Math.round(((1649 - 1579) / 1649) * 100))
    expect(oferta.descuento).toBe(4)
  })

  it('busca también en colores posteriores', () => {
    const m = modelo([
      { name: 'Plata', capacities: [variante('A', 1000, null)] },
      { name: 'Negro', capacities: [variante('A', 900, 1100)] },
    ])
    expect(getOfferVariant(m)!.color.name).toBe('Negro')
  })

  it('con varias ofertas elige la de mayor descuento', () => {
    const m = modelo([
      {
        name: 'Plata',
        capacities: [variante('poca', 950, 1000), variante('mucha', 500, 1000)],
      },
    ])
    const oferta = getOfferVariant(m)!
    expect(oferta.capacity.capacity).toBe('mucha')
    expect(oferta.descuento).toBe(50)
  })

  it('ignora una rebaja que no rebaja', () => {
    // Precio anterior igual o menor que el actual: no es una oferta.
    const m = modelo([{ name: 'Plata', capacities: [variante('A', 1000, 1000), variante('B', 1200, 1100)] }])
    expect(getOfferVariant(m)).toBeNull()
  })
})

// Coherencia de la tarjeta. Se prueba la función y no el componente montado a
// propósito: lo que puede romperse es la elección de la variante, y montar
// React aquí sólo añadiría maquetación entre el fallo y la prueba.
describe('presentacionDeTarjeta', () => {
  it('sin oferta enseña y abre el color de entrada', () => {
    const m = modelo([
      { name: 'Plata', capacities: [variante('256GB', 1000, null)] },
      { name: 'Negro', capacities: [variante('256GB', 1000, null)] },
    ])
    const p = presentacionDeTarjeta(m)

    expect(p.oferta).toBeNull()
    expect(p.color).toBe(m.colors[0])
    expect(p.capacity).toBe(m.colors[0].capacities[0])
    // El destino tiene que salir idéntico al que daba `variantPath(model)`:
    // la tarjeta sin rebaja —la mayoría— no cambia de comportamiento.
    expect(variantPath(m, p.color, p.capacity)).toBe(variantPath(m))
  })

  it('con la oferta en un color posterior, foto, precio y destino son de ESE color', () => {
    const m = modelo([
      { name: 'Plata', capacities: [variante('256GB', 1000, null)] },
      { name: 'Negro', capacities: [variante('512GB', 900, 1100)] },
    ])
    const p = presentacionDeTarjeta(m)

    expect(p.oferta, 'la rebaja está en el segundo color').not.toBeNull()
    // El fallo que se quiere evitar: foto de la Plata, precio de la Negra y,
    // al pulsar, apertura de la Negra.
    expect(p.color.name, 'la imagen sale del color rebajado').toBe('Negro')
    expect(p.color.image).toBe('/img/negro.webp')
    expect(p.color.image, 'no puede ser la del primer color').not.toBe(m.colors[0].image)
    expect(p.oferta!.color).toBe(p.color)
    expect(p.capacity).toBe(p.oferta!.capacity)
    expect(variantPath(m, p.color, p.capacity)).toContain('negro')
  })

  it('la capacidad enseñada es la rebajada aunque no sea la primera', () => {
    const m = modelo([{ name: 'Plata', capacities: [variante('256GB', 1319, null), variante('512GB', 1579, 1649)] }])
    const p = presentacionDeTarjeta(m)

    expect(p.capacity.capacity).toBe('512GB')
    expect(p.oferta!.precio).toBe(p.capacity.price)
  })
})

describe('contra el catálogo real', () => {
  it('encuentra los seis modelos con rebaja, no cinco', () => {
    const conOferta = allModels.filter(tieneOferta).map((m) => `${m.family}/${m.slug}`)
    expect(conOferta).toHaveLength(6)
    // El que se perdía al mirar sólo la primera capacidad.
    expect(conOferta, 'el MacBook Air M5 tiene la rebaja en la de 15 pulgadas').toContain('mac/macbook-air-m5')
  })

  it('ninguna tarjeta del catálogo mezcla color y capacidad', () => {
    // La capacidad que se enseña tiene que existir DENTRO del color que se
    // enseña. Es la invariante que rompía coger la imagen de `colors[0]`.
    for (const m of allModels) {
      const p = presentacionDeTarjeta(m)
      expect(p.color.capacities, `${m.family}/${m.slug}`).toContain(p.capacity)
      expect(m.colors, `${m.family}/${m.slug}`).toContain(p.color)
      if (p.oferta) expect(p.oferta.precio).toBe(p.capacity.price)
    }
  })

  it('la oferta del MacBook Air M5 apunta a la variante correcta', () => {
    const air = getModel('mac', 'macbook-air-m5')!
    const oferta = getOfferVariant(air)!

    expect(oferta.precio).toBeLessThan(oferta.precioAnterior)
    expect(oferta.capacity.previousPrice, 'el precio anterior sale de esa misma capacidad').toBe(oferta.precioAnterior)
    expect(oferta.capacity.price).toBe(oferta.precio)
    expect(oferta.precio, 'no es el precio de entrada del modelo').not.toBe(air.fromPrice)
  })
})
