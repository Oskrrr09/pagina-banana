import { describe, expect, it } from 'vitest'
import { allModels } from '../../src/data/products'
import { modelosFavoritos } from '../../src/components/favorites/identidadDeFavoritos'

// ============================================================================
// QUÉ MODELO ES UN FAVORITO, EXACTAMENTE.
//
// EL FALLO QUE ORIGINA ESTE FICHERO
//
// La lista se reconstruía con `favorites.some((f) => f.startsWith(id))`, y eso
// no pregunta «¿está guardado este modelo?» sino «¿empieza algún favorito por
// su identificador?». Guardando SÓLO `iphone/17-pro`, el iPhone 17 —cuyo id es
// `iphone/17`— salía también como favorito, porque `"iphone/17-pro"` empieza
// por `"iphone/17"`.
//
// Lo detectó la validación física de D1, pero el `startsWith` venía de antes:
// estaba igual en `main`, dentro de `FavoritesPage`. D1 sólo lo movió de sitio.
//
// POR QUÉ ES UN TEST DE DOMINIO Y NO DE PANTALLA
//
// `useFavoritos` lo consumen las dos plataformas, así que esto no era un
// defecto visual de la app: la web pintaba el mismo modelo fantasma. Se
// comprueba aquí, sobre el catálogo real, y las suites de pantalla comprueban
// que cada superficie lo respeta.
// ============================================================================

const id = (familia: string, slug: string) => `${familia}/${slug}`

describe('la identidad de un favorito', () => {
  it('un id guardado devuelve ese modelo y sólo ese', () => {
    const soloPro = modelosFavoritos(allModels, ['iphone/17-pro'])
    expect(soloPro.map((m) => m.slug)).toEqual(['17-pro'])
  })

  it('el modelo cuyo id es prefijo de otro no se cuela', () => {
    // El caso exacto del informe: guardar el Pro no puede traer el normal.
    const soloPro = modelosFavoritos(allModels, ['iphone/17-pro'])
    expect(soloPro.some((m) => m.slug === '17')).toBe(false)
  })

  it('y al revés tampoco: guardar el normal no trae el Pro', () => {
    const soloNormal = modelosFavoritos(allModels, ['iphone/17'])
    expect(soloNormal.map((m) => m.slug)).toEqual(['17'])
  })

  it('guardar los dos devuelve los dos', () => {
    const ambos = modelosFavoritos(allModels, ['iphone/17-pro', 'iphone/17'])
    expect(ambos.map((m) => m.slug).sort()).toEqual(['17', '17-pro'])
  })

  it('un id que ya no existe en el catálogo no devuelve nada', () => {
    expect(modelosFavoritos(allModels, ['iphone/modelo-retirado'])).toEqual([])
  })

  it('el orden es el del catálogo, no el de guardado', () => {
    const alReves = modelosFavoritos(allModels, ['iphone/17', 'iphone/17-pro'])
    const directo = modelosFavoritos(allModels, ['iphone/17-pro', 'iphone/17'])
    expect(alReves.map((m) => m.slug)).toEqual(directo.map((m) => m.slug))
  })

  // EL CENSO, SIN LISTA MANUAL DE EXCEPCIONES
  //
  // No se arregla «el caso del iPhone 17»: se comprueba el catálogo entero.
  // Cualquier modelo nuevo cuyo identificador sea prefijo de otro —un `air`
  // frente a un `air-m4`, un `15` frente a un `15-pro`— entra en este caso sin
  // que haya que tocarlo.
  it('ningún modelo del catálogo arrastra a otro, sea cual sea el par', () => {
    const arrastres: string[] = []
    for (const guardado of allModels) {
      const devueltos = modelosFavoritos(allModels, [id(guardado.family, guardado.slug)])
      if (devueltos.length !== 1 || devueltos[0].slug !== guardado.slug) {
        arrastres.push(
          `${id(guardado.family, guardado.slug)} → ${devueltos.map((m) => id(m.family, m.slug)).join(', ')}`,
        )
      }
    }
    expect(arrastres, `guardar un modelo devolvió otros: ${arrastres.join(' | ')}`).toEqual([])
  })

  it('el catálogo tiene de verdad pares que colisionan por prefijo', () => {
    // Si algún día dejara de haberlos, el caso de arriba se volvería vacío y
    // dejaría de proteger nada sin que nadie se entere. Esto lo impide.
    const ids = allModels.map((m) => id(m.family, m.slug))
    const pares = ids.filter((a) => ids.some((b) => b !== a && a.startsWith(b)))
    expect(pares.length, 'el catálogo debe seguir teniendo pares como 17 / 17-pro').toBeGreaterThan(0)
  })
})
