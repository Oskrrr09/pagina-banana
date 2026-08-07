import { describe, expect, it } from 'vitest'
import { getOfferVariant, tieneOferta } from '../../src/lib/offers'
import { allModels, getModel } from '../../src/data/products/index'
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
    colors: colores.map((c) => ({ color: c.name.toLowerCase(), name: c.name, hex: '#000', image: '', ...c })),
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

describe('contra el catálogo real', () => {
  it('encuentra los seis modelos con rebaja, no cinco', () => {
    const conOferta = allModels.filter(tieneOferta).map((m) => `${m.family}/${m.slug}`)
    expect(conOferta).toHaveLength(6)
    // El que se perdía al mirar sólo la primera capacidad.
    expect(conOferta, 'el MacBook Air M5 tiene la rebaja en la de 15 pulgadas').toContain('mac/macbook-air-m5')
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
