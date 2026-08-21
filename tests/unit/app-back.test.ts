import { describe, expect, it } from 'vitest'
import { destinoAtrasApp, puedeVolverEnHistorial } from '../../src/lib/appBack'
import { developedFamilies, getFamilyModels } from '../../src/data/products'

// A dónde vuelve cada pantalla de la aplicación nativa.
//
// El mapa se prueba aquí, sin navegador, porque es una decisión de producto y
// no de pintado: qué pantalla contiene a cuál. Lo que hace el shell con esta
// respuesta —retroceder de verdad o ir al sitio— se prueba en `app-atras`.

// Familia y modelo tomados del catálogo real, no escritos a mano: si una
// familia se retira, estas pruebas siguen midiendo algo que existe.
const FAMILIA = developedFamilies[0]
const MODELO = getFamilyModels(FAMILIA)[0].slug

describe('las raíces no llevan control de vuelta', () => {
  it('las cuatro pestañas devuelven null', () => {
    for (const raiz of ['/', '/tienda', '/mis-productos', '/cuenta']) {
      expect(destinoAtrasApp(raiz), raiz).toBeNull()
    }
  })

  it('/login también, porque es la pestaña Cuenta sin sesión', () => {
    expect(destinoAtrasApp('/login')).toBeNull()
    // Y con el `redirect` que le pone el guardia de una ruta protegida.
    expect(destinoAtrasApp('/login', '?redirect=%2Fcuenta')).toBeNull()
  })
})

describe('el registro devuelve al acceso', () => {
  it('sin parámetros va a /login', () => {
    expect(destinoAtrasApp('/registro')).toBe('/login')
  })

  it('conserva un destino interno', () => {
    expect(destinoAtrasApp('/registro', '?redirect=%2Fmis-productos')).toBe('/login?redirect=%2Fmis-productos')
  })

  it('descarta un destino que saldría de Banana', () => {
    // Las tres formas que rechaza `safeRedirect`: absoluta, protocolo relativo
    // y barra invertida, que algunos navegadores normalizan a `//`.
    for (const malicioso of ['https://example.test', '//example.test', '/\\example.test']) {
      expect(destinoAtrasApp('/registro', `?redirect=${encodeURIComponent(malicioso)}`), malicioso).toBe('/login')
    }
  })
})

describe('las pantallas estáticas vuelven a su contenedor', () => {
  const casos: [string, string][] = [
    ['/accesorios', '/tienda'],
    ['/buscar', '/tienda'],
    ['/favoritos', '/tienda'],
    ['/carrito', '/tienda'],
    ['/elige-tu-apple', '/'],
    ['/tiendas', '/'],
    ['/soporte', '/'],
    ['/servicio-tecnico', '/soporte'],
    ['/servicios', '/'],
    ['/plan-renove', '/servicios'],
  ]

  for (const [ruta, destino] of casos) {
    it(`${ruta} → ${destino}`, () => {
      expect(destinoAtrasApp(ruta)).toBe(destino)
    })
  }

  it('los detalles vuelven a su lista', () => {
    expect(destinoAtrasApp('/accesorios/airtag')).toBe('/accesorios')
    expect(destinoAtrasApp('/tiendas/triana')).toBe('/tiendas')
  })

  it('una barra final no cambia la respuesta', () => {
    expect(destinoAtrasApp('/soporte/')).toBe('/')
  })
})

describe('el comparador vuelve a la familia que estaba comparando', () => {
  it('sin familia, a Tienda', () => {
    expect(destinoAtrasApp('/comparar')).toBe('/tienda')
  })

  it('con una familia real, a su catálogo', () => {
    expect(destinoAtrasApp('/comparar', `?familia=${FAMILIA}`)).toBe(`/${FAMILIA}`)
  })

  it('con una familia inventada, a Tienda', () => {
    expect(destinoAtrasApp('/comparar', '?familia=banana')).toBe('/tienda')
    // `accesorios` es familia del menú pero no tiene catálogo desarrollado, y
    // el comparador ya la trata así.
    expect(destinoAtrasApp('/comparar', '?familia=accesorios')).toBe('/tienda')
  })
})

describe('el catálogo se valida contra los datos, no contra la forma de la ruta', () => {
  it('una familia real vuelve a Tienda', () => {
    expect(destinoAtrasApp(`/${FAMILIA}`)).toBe('/tienda')
  })

  it('un modelo real vuelve al catálogo de su familia', () => {
    expect(destinoAtrasApp(`/${FAMILIA}/${MODELO}`)).toBe(`/${FAMILIA}`)
  })

  it('un modelo inventado dentro de una familia real también', () => {
    // La pantalla es un 404, pero el sitio del que se viene sigue siendo el
    // catálogo de esa familia, que sí existe.
    expect(destinoAtrasApp(`/${FAMILIA}/no-existe`)).toBe(`/${FAMILIA}`)
  })

  it('una variante vuelve al catálogo de su familia, no a la del modelo', () => {
    // El catálogo enlaza directo a la variante: la pantalla del modelo no
    // está en medio, así que ofrecerla sería inventar un paso.
    expect(destinoAtrasApp(`/${FAMILIA}/${MODELO}/plata-256gb`)).toBe(`/${FAMILIA}`)
  })

  it('una familia inexistente vuelve a Inicio, no a otro 404', () => {
    expect(destinoAtrasApp('/banana')).toBe('/')
    expect(destinoAtrasApp('/banana/inventado')).toBe('/')
    expect(destinoAtrasApp('/banana/inventado/mas')).toBe('/')
  })

  it('una ruta inventada de cualquier profundidad vuelve a Inicio', () => {
    expect(destinoAtrasApp('/esto/no/existe/en/absoluto')).toBe('/')
  })
})

describe('cuándo hay una pantalla de Banana detrás', () => {
  // React Router numera sus entradas en `history.state.idx`. Esta es la única
  // regla que lo interpreta: si el supuesto cambia con una versión futura del
  // router, se pone roja aquí y no en mitad de la aplicación.

  it('con idx mayor que cero, sí', () => {
    expect(puedeVolverEnHistorial({ idx: 1 })).toBe(true)
    expect(puedeVolverEnHistorial({ idx: 7, usr: null, key: 'abc' })).toBe(true)
  })

  it('con idx cero, no: el router no tiene una entrada anterior apilada', () => {
    expect(puedeVolverEnHistorial({ idx: 0 })).toBe(false)
    // Un índice negativo no lo produce el router; si aparece, tampoco autoriza
    // a retroceder.
    expect(puedeVolverEnHistorial({ idx: -1 })).toBe(false)
  })

  it('sin estado o sin idx, no', () => {
    expect(puedeVolverEnHistorial(null)).toBe(false)
    expect(puedeVolverEnHistorial(undefined)).toBe(false)
    expect(puedeVolverEnHistorial({})).toBe(false)
    expect(puedeVolverEnHistorial({ usr: null, key: 'abc' })).toBe(false)
  })

  it('con un idx que no es un entero, no', () => {
    for (const idx of ['2', 1.5, NaN, true, null, [], {}]) {
      expect(puedeVolverEnHistorial({ idx }), String(idx)).toBe(false)
    }
  })

  it('un estado que no es objeto, no', () => {
    expect(puedeVolverEnHistorial('idx=2')).toBe(false)
    expect(puedeVolverEnHistorial(3)).toBe(false)
  })
})
