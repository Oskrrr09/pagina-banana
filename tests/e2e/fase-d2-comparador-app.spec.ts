import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// FASE D2 — «EL COMPARADOR SE SIENTE DE APP».
//
// QUÉ CAMBIA, Y POR QUÉ
//
// La web compara en columnas: producto A | producto B | producto C. En un
// teléfono esa metáfora no cabe. Medido sobre `main` antes de esta entrega, a
// 320 px y con tres productos: `min-w-[720px]` dejaba **424 px de la tabla
// fuera de pantalla** tras un gesto horizontal sin ninguna señal, había DOS
// desplazadores horizontales anidados, 15 de 17 controles por debajo del
// mínimo táctil y 18 superficies con marco dentro de otra. Comparar exigía
// sostener una cifra en la memoria mientras se arrastraba para ver la otra:
// eso no es comparar, es recordar.
//
// En la app la comparación pasa a ser VERTICAL y por atributo: cada
// característica es un bloque y dentro están los valores de los productos, uno
// por línea. La diferencia se ve sin gesto y sin memoria.
//
// EL MOTOR NO SE TOCA
//
// `ESSENTIAL_FIELDS`, `EXTENDED_FIELDS`, `FIELD_SECTIONS`,
// `buildDecisionSections` y `buildDecisionSummary` siguen siendo los mismos, y
// «Solo diferencias» sigue activo por defecto. Lo que diverge es cómo se
// presenta, no qué significa.
//
// LA WEB NO CAMBIA
//
// D-086. Sus casos comprueban que sigue IGUAL —su tabla, sus tres columnas y
// su `min-width`—, no que esté mejor. Los 14 casos históricos de
// `comparator.spec.ts` recorren la web y se quedan como estaban.
// ============================================================================

const comoApp = (page: Page) => page.addInitScript(() => ((window as { Capacitor?: unknown }).Capacitor = {}))

type Semilla = { slug: string; nombre: string; capacidad: string; precio: number; familia?: string }

const IPHONE: Record<string, Semilla> = {
  pro: { slug: '17-pro', nombre: 'iPhone 17 Pro', capacidad: '256GB', precio: 1229 },
  normal: { slug: '17', nombre: 'iPhone 17', capacidad: '128GB', precio: 959 },
  max: { slug: '17-pro-max', nombre: 'iPhone 17 Pro Max', capacidad: '256GB', precio: 1469 },
}

/** Siembra una comparación con la forma real de `CompareItem`. */
function conComparacion(page: Page, semillas: Semilla[]) {
  return page.addInitScript((lista) => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    localStorage.setItem(
      'banana:compare',
      JSON.stringify(
        lista.map((s) => ({
          id: `${s.familia ?? 'iphone'}/${s.slug}/Plata/${s.capacidad}`,
          modelSlug: s.slug,
          family: s.familia ?? 'iphone',
          name: s.nombre,
          color: 'Plata',
          capacity: s.capacidad,
          price: s.precio,
          specs: [],
        })),
      ),
    )
  }, semillas)
}

/**
 * Geometría del comparador nativo.
 *
 * NO basta con `document.scrollWidth`: el armazón impide que el documento
 * desborde, así que la tabla podía tener 424 px fuera de pantalla sin que
 * ninguna medida del documento se enterara. Se mide cada superficie del
 * comparador contra su propio ancho visible.
 */
async function geometria(page: Page) {
  return page.evaluate(() => {
    const raiz = document.querySelector('[data-cmp-app]')
    if (!raiz) return null
    const dentro = [raiz, ...raiz.querySelectorAll('*')] as HTMLElement[]

    // Los `sr-only` quedan fuera: miden 1 px de ancho con el texto sin
    // envolver, así que su `scrollWidth` siempre excede al `clientWidth` por
    // construcción. No son superficies visibles y contarlos sería ruido.
    const visible = (e: HTMLElement) => {
      const r = e.getBoundingClientRect()
      return r.width > 2 && r.height > 2
    }
    const desbordanH = dentro
      .filter(visible)
      .filter((e) => e.scrollWidth > e.clientWidth + 1)
      .map((e) => ({
        etiqueta: e.tagName.toLowerCase() + (e.dataset.cmpAtributo ? '[atributo]' : ''),
        exceso: e.scrollWidth - e.clientWidth,
      }))

    const scrollersH = dentro.filter((e) => /auto|scroll/.test(getComputedStyle(e).overflowX))
    const scrollersV = dentro.filter((e) => /auto|scroll/.test(getComputedStyle(e).overflowY))

    // SUPERFICIES: sólo las que dibujan una caja de contenido. Un chip o un
    // botón con borde y radio es semántico, no una tarjeta, y contarlos como
    // marcos convertiría la métrica en ruido.
    const superficies = dentro.filter((e) => {
      if (e.closest('button, a')) return false
      const s = getComputedStyle(e)
      return parseFloat(s.borderTopWidth) > 0 && parseFloat(s.borderTopLeftRadius) >= 10
    })
    const profundidad = (e: Element) => superficies.filter((o) => o !== e && o.contains(e)).length

    const controles = dentro.filter(
      (e) => /^(a|button|input|select)$/.test(e.tagName.toLowerCase()) && e.getBoundingClientRect().height > 0,
    )
    const pequenos = controles.filter((e) => {
      const r = e.getBoundingClientRect()
      return r.height < 44 || r.width < 44
    })

    return {
      desbordanH,
      scrollersH: scrollersH.length,
      scrollersV: scrollersV.length,
      superficies: superficies.length,
      anidadas: superficies.filter((e) => profundidad(e) > 0).length,
      profundidadMaxima: superficies.reduce((m, e) => Math.max(m, profundidad(e)), 0),
      controles: controles.length,
      pequenos: pequenos.map((e) => ({
        texto: (e.getAttribute('aria-label') ?? e.textContent ?? e.tagName).trim().slice(0, 28),
        alto: Math.round(e.getBoundingClientRect().height),
        ancho: Math.round(e.getBoundingClientRect().width),
      })),
      overflowDocumento: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      anchoRaiz: Math.round((raiz as HTMLElement).getBoundingClientRect().width),
      anchoViewport: document.documentElement.clientWidth,
    }
  })
}

/** Lo que se lee en los bloques de atributo. */
async function bloques(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-cmp-atributo]')].map((b) => ({
      campo: (b.querySelector('[data-cmp-campo]')?.textContent ?? '').trim(),
      valores: [...b.querySelectorAll('[data-cmp-valor]')].map((v) => ({
        producto: (v.querySelector('[data-cmp-etiqueta]')?.textContent ?? '').trim(),
        valor: (v.querySelector('[data-cmp-dato]')?.textContent ?? '').trim(),
        destaca: (v.querySelector('[data-cmp-destaca]')?.textContent ?? '').trim(),
      })),
    })),
  )
}

// ---------------------------------------------------------------------------
// GEOMETRÍA — el contrato central de D2
// ---------------------------------------------------------------------------

for (const [ancho, alto] of [
  [320, 568],
  [390, 844],
  [430, 932],
] as const) {
  for (const [etiqueta, semillas] of [
    ['vacío', []],
    ['1 producto', [IPHONE.pro]],
    ['2 productos', [IPHONE.pro, IPHONE.normal]],
    ['3 productos', [IPHONE.pro, IPHONE.normal, IPHONE.max]],
  ] as const) {
    test.describe(`el comparador nativo a ${ancho} px · ${etiqueta}`, () => {
      test.use({ viewport: { width: ancho, height: alto } })

      test('no se desplaza en horizontal y todo lo que se pulsa llega al dedo', async ({ page }) => {
        await comoApp(page)
        await conComparacion(page, [...semillas])
        await page.goto('./comparar')
        await expect(page.locator('[data-cmp-app]')).toHaveCount(1)

        const g = (await geometria(page))!
        expect(g.desbordanH, `superficies que desbordan: ${JSON.stringify(g.desbordanH)}`).toEqual([])
        expect(g.scrollersH, 'ningún desplazador horizontal').toBe(0)
        expect(g.scrollersV, 'ningún desplazador vertical propio: manda el armazón').toBe(0)
        expect(g.overflowDocumento, 'sin desbordamiento del documento').toBe(0)
        expect(g.anchoRaiz).toBeLessThanOrEqual(g.anchoViewport)
        expect(g.pequenos, `controles por debajo de 44: ${JSON.stringify(g.pequenos)}`).toEqual([])
      })

      test('el final de la comparación se alcanza por encima de la navegación', async ({ page }) => {
        await comoApp(page)
        await conComparacion(page, [...semillas])
        await page.goto('./comparar')

        const f = await page.evaluate(
          () =>
            new Promise<{ libre: number; ultimo: string }>((resolve) => {
              // EN LA APP EL SCROLL ES DE `main#contenido`, no del documento.
              const main = document.querySelector('main') as HTMLElement
              main.scrollTop = main.scrollHeight
              setTimeout(() => {
                const tab = document.querySelector('[data-app-tab-bar]')!.getBoundingClientRect()
                const raiz = document.querySelector('[data-cmp-app]')!.getBoundingClientRect()
                resolve({ libre: Math.round(tab.top - raiz.bottom), ultimo: 'el comparador' })
              }, 350)
            }),
        )
        expect(f.libre, `${f.ultimo} termina por encima de la navegación`).toBeGreaterThanOrEqual(0)
      })

      test('la jerarquía de superficies es simple', async ({ page }) => {
        await comoApp(page)
        await conComparacion(page, [...semillas])
        await page.goto('./comparar')

        const g = (await geometria(page))!
        expect(g.anidadas, 'ninguna tarjeta dentro de otra tarjeta').toBe(0)
        expect(g.profundidadMaxima, 'como mucho un nivel de superficie').toBeLessThanOrEqual(1)
      })
    })
  }
}

// ---------------------------------------------------------------------------
// ESTADOS
// ---------------------------------------------------------------------------

test.describe('los cuatro estados del comparador nativo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('vacío: se entiende qué hacer, sin tres huecos ficticios', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [])
    await page.goto('./comparar')

    await expect(page.locator('[data-cmp-vacio]')).toBeVisible()
    // Ni tres tarjetas huecas de 520 px ni resúmenes de productos que no hay.
    await expect(page.locator('[data-cmp-producto]')).toHaveCount(0)
    expect(await page.locator('[data-model-picker-trigger]').count(), 'un solo camino para añadir, no tres').toBe(1)

    // Y el picker abre y añade de verdad.
    await page.locator('[data-model-picker-trigger]').click()
    const dialogo = page.getByRole('dialog', { name: /^Elegir modelo de/ })
    await expect(dialogo).toBeVisible()
    await dialogo.getByRole('button', { name: /^Elegir iPhone 17 Pro$/ }).click()
    await expect(page.locator('[data-cmp-producto]')).toHaveCount(1)
  })

  test('un producto: se ve entero y se invita a añadir el segundo', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro])
    await page.goto('./comparar')

    await expect(page.locator('[data-cmp-producto]')).toHaveCount(1)
    const uno = page.locator('[data-cmp-producto]').first()
    await expect(uno.getByRole('button', { name: /^Comprar/ })).toBeVisible()
    await expect(uno.getByRole('link', { name: /Ver producto/ })).toBeVisible()
    await expect(uno.getByRole('button', { name: /Cambiar/ })).toBeVisible()
    await expect(uno.getByRole('button', { name: /Quitar/ })).toBeVisible()

    // Nada que comparar todavía: no se pintan bloques de atributo vacíos.
    expect(await page.locator('[data-cmp-atributo]').count(), 'sin bloques que no comparan nada').toBe(0)
    await expect(page.getByText(/Añade otro modelo/)).toBeVisible()
    await expect(page.locator('[data-model-picker-trigger]')).toBeVisible()
  })

  test('dos productos: bloques por atributo con los dos valores', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    await expect(page.locator('[data-cmp-producto]')).toHaveCount(2)
    const b = await bloques(page)
    expect(b.length, 'hay bloques de atributo').toBeGreaterThan(0)
    for (const bloque of b) {
      expect(bloque.campo, 'cada bloque dice qué compara').not.toBe('')
      expect(bloque.valores.length, `«${bloque.campo}» enseña un valor por producto`).toBe(2)
    }
    // Precio es siempre distinto entre estos dos, así que debe estar.
    expect(b.map((x) => x.campo)).toContain('Precio')
  })

  test('tres productos: los tres, sin paginar ni esconder al último', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal, IPHONE.max])
    await page.goto('./comparar')

    await expect(page.locator('[data-cmp-producto]')).toHaveCount(3)
    const b = await bloques(page)
    for (const bloque of b) {
      expect(bloque.valores.length, `«${bloque.campo}» enseña los tres`).toBe(3)
    }
    // Con el máximo alcanzado no se ofrece añadir un cuarto.
    await expect(page.locator('[data-model-picker-trigger]')).toHaveCount(0)
  })
})

// ---------------------------------------------------------------------------
// COMPARACIÓN — el motor manda, la presentación cambia
// ---------------------------------------------------------------------------

test.describe('la comparación nativa dice lo mismo que el motor', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('«Solo diferencias» viene activo y «Mostrar todas» añade bloques', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    await expect(page.getByRole('button', { name: 'Solo diferencias' })).toHaveAttribute('aria-pressed', 'true')
    const soloDiferencias = (await bloques(page)).length

    await page.getByRole('button', { name: 'Mostrar todas' }).click()
    const todas = (await bloques(page)).length
    expect(todas, 'mostrar todas enseña más').toBeGreaterThan(soloDiferencias)
  })

  test('con «Solo diferencias» no aparece ningún atributo con todos los valores iguales', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    for (const bloque of await bloques(page)) {
      const datos = bloque.valores.map((v) => v.valor)
      const todosIguales = datos.every((d) => d === datos[0])
      expect(todosIguales, `«${bloque.campo}» tiene todos los valores iguales y no debería estar`).toBe(false)
    }
  })

  test('el destacado va junto al valor que lo gana, no suelto arriba', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    const precio = (await bloques(page)).find((b) => b.campo === 'Precio')!
    const ganador = precio.valores.find((v) => v.destaca !== '')
    expect(ganador, 'el precio tiene un ganador señalado').toBeTruthy()
    expect(ganador!.destaca).toMatch(/econ/i)
    // Y sólo uno: nada de un mar de chips.
    expect(precio.valores.filter((v) => v.destaca !== '').length).toBe(1)
  })

  test('las secciones del dominio se conservan como jerarquía', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    const secciones = await page.locator('[data-cmp-seccion] [data-cmp-titulo]').allTextContents()
    expect(secciones.length, 'hay secciones').toBeGreaterThan(0)
    expect(secciones.map((s) => s.trim())).toContain('Precio')
  })
})

// ---------------------------------------------------------------------------
// NOMBRES — identificación corta y sin colisiones, sin lista de excepciones
// ---------------------------------------------------------------------------

test.describe('cómo se identifica cada producto dentro de un atributo', () => {
  test.use({ viewport: { width: 320, height: 568 } })

  test('los tres iPhone se distinguen sin repetir la palabra iPhone', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal, IPHONE.max])
    await page.goto('./comparar')

    const b = await bloques(page)
    const etiquetas = b[0].valores.map((v) => v.producto)
    expect(new Set(etiquetas).size, 'las tres etiquetas son distintas entre sí').toBe(3)
    for (const e of etiquetas) {
      expect(e, 'y ninguna queda vacía').not.toBe('')
    }
    // El resumen de arriba sí lleva el nombre completo.
    await expect(page.locator('[data-cmp-producto]').first()).toContainText('iPhone 17 Pro')
  })

  test('una familia sin prefijo común conserva los nombres completos', async ({ page }) => {
    // Los Mac no comparten primera palabra —MacBook, Mac, iMac—, así que
    // abreviar sería inventarse algo. La regla es genérica: si no hay prefijo
    // común de la familia, se usa el nombre entero.
    await comoApp(page)
    await conComparacion(page, [
      { slug: 'macbook-air-m4', nombre: 'MacBook Air M4', capacidad: '256GB', precio: 1199, familia: 'mac' },
      { slug: 'mac-mini-m4', nombre: 'Mac mini M4', capacidad: '256GB', precio: 699, familia: 'mac' },
    ])
    await page.goto('./comparar')

    const b = await bloques(page)
    expect(b.length, 'la comparación de Mac también produce bloques').toBeGreaterThan(0)
    const etiquetas = b[0].valores.map((v) => v.producto)
    expect(new Set(etiquetas).size).toBe(2)
    expect(etiquetas.join(' ')).toMatch(/Mac/)
  })

  test('un valor largo envuelve y no desborda a 320', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')
    await page.getByRole('button', { name: 'Mostrar todas' }).click()

    const g = (await geometria(page))!
    expect(g.desbordanH, `desbordan: ${JSON.stringify(g.desbordanH)}`).toEqual([])
    // El valor de cámara del Pro es el más largo del catálogo.
    const camara = (await bloques(page)).find((b) => /Cámara principal/.test(b.campo))
    if (camara) expect(camara.valores.some((v) => v.valor.length > 20)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// COMPORTAMIENTO — el dominio no cambia
// ---------------------------------------------------------------------------

test.describe('el comparador nativo funciona igual por dentro', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('cambiar el del medio no toca a sus vecinos ni reordena', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal, IPHONE.max])
    await page.goto('./comparar')

    await page
      .locator('[data-cmp-producto]')
      .nth(1)
      .getByRole('button', { name: /Cambiar/ })
      .click()
    // En modo sustitución el diálogo se titula «Cambiar modelo de…», no
    // «Elegir modelo de…»: es el mismo componente con otro rótulo.
    const dialogo = page.getByRole('dialog', { name: /modelo de/ })
    await expect(dialogo).toBeVisible()
    await dialogo.getByRole('button', { name: /iPhone Air/ }).click()

    const nombres = await page.locator('[data-cmp-producto] [data-cmp-nombre]').allTextContents()
    expect(nombres.map((n) => n.trim())).toEqual(['iPhone 17 Pro', 'iPhone Air', 'iPhone 17 Pro Max'])
  })

  test('quitar uno conserva los demás y su orden', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal, IPHONE.max])
    await page.goto('./comparar')

    await page
      .locator('[data-cmp-producto]')
      .nth(1)
      .getByRole('button', { name: /Quitar/ })
      .click()
    const nombres = await page.locator('[data-cmp-producto] [data-cmp-nombre]').allTextContents()
    expect(nombres.map((n) => n.trim())).toEqual(['iPhone 17 Pro', 'iPhone 17 Pro Max'])
  })

  test('quitar hasta el final pasa por el estado de uno y termina en el vacío', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    await page
      .locator('[data-cmp-producto]')
      .last()
      .getByRole('button', { name: /Quitar/ })
      .click()
    await expect(page.locator('[data-cmp-producto]')).toHaveCount(1)
    await expect(page.getByText(/Añade otro modelo/)).toBeVisible()

    await page
      .locator('[data-cmp-producto]')
      .first()
      .getByRole('button', { name: /Quitar/ })
      .click()
    await expect(page.locator('[data-cmp-vacio]')).toBeVisible()
  })

  test('la comparación sobrevive a la recarga', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')
    await expect(page.locator('[data-cmp-producto]')).toHaveCount(2)
    await page.reload()
    await expect(page.locator('[data-cmp-producto]')).toHaveCount(2)
  })

  test('«Comprar» añade al carrito lo que dice el resumen', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    await page
      .locator('[data-cmp-producto]')
      .first()
      .getByRole('button', { name: /^Comprar/ })
      .click()
    const carrito = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:cart') ?? '[]'))
    expect(carrito.length, 'una línea, sin duplicar').toBe(1)
    expect(carrito[0]).toMatchObject({ modelSlug: '17-pro', family: 'iphone', capacity: '256GB' })
  })

  test('«Ver producto» lleva a la ficha real del modelo', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [IPHONE.pro, IPHONE.normal])
    await page.goto('./comparar')

    await page
      .locator('[data-cmp-producto]')
      .first()
      .getByRole('link', { name: /Ver producto/ })
      .click()
    await expect(page).toHaveURL(/\/iphone\/17-pro\//)
  })

  test('abrir con ?familia= elige esa familia en el estado vacío', async ({ page }) => {
    await comoApp(page)
    await conComparacion(page, [])
    await page.goto('./comparar?familia=ipad')
    await expect(page.locator('[data-cmp-vacio]')).toContainText(/iPad/)
  })
})

// ---------------------------------------------------------------------------
// LO PERSISTIDO NO SIEMPRE TRAE TODO, Y NO SIEMPRE SIGUE EN EL CATÁLOGO
//
// La PR #94 cerró que un `CompareItem` legítimo sólo necesita `id`,
// `modelSlug` y `family`: los datos de presentación —`name`, `color`,
// `capacity`, `price`— pueden faltar, porque el comparador puede resolverlos
// desde el catálogo vivo. Y un `modelSlug` retirado del catálogo debe
// ignorarse en silencio, no pintarse.
//
// Medido antes de esta corrección:
//
//   dos elementos mínimos     → PÁGINA EN BLANCO («… reading 'trim'»)
//   retirado al principio     → «Retirado» salía como producto fantasma Y los
//                               valores se atribuían al producto equivocado:
//                               etiquetas [Retirado, 17, 17 Pro] con valores
//                               [959 €, 1229 €, —], y «Más económico» acababa
//                               junto a 1229 €
//
// La causa es la misma en los dos: las etiquetas salían de `compare` en crudo
// mientras los valores salían de los contextos ya filtrados. Dos listas de
// distinta longitud indexadas a la vez. Esto tiene que ser imposible por
// construcción, no evitable con cuidado.
// ---------------------------------------------------------------------------

/** Un `CompareItem` con lo mínimo que el contrato de #94 considera legítimo. */
const minimo = (id: string, slug: string) => ({ id, modelSlug: slug, family: 'iphone' })

/** Siembra valores crudos: aquí importa lo que NO traen. */
function conCrudo(page: Page, lista: unknown[]) {
  return page.addInitScript((l) => {
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    localStorage.setItem('banana:compare', JSON.stringify(l))
  }, lista)
}

/** Producto, etiqueta, valor y destacado del primer bloque, en orden. */
async function alineacion(page: Page) {
  return page.evaluate(() => {
    const bloque = document.querySelector('[data-cmp-atributo]')
    return {
      productos: [...document.querySelectorAll('[data-cmp-producto] [data-cmp-nombre]')].map((e) =>
        (e.textContent ?? '').trim(),
      ),
      campo: (bloque?.querySelector('[data-cmp-campo]')?.textContent ?? '').trim(),
      filas: [...(bloque?.querySelectorAll('[data-cmp-valor]') ?? [])].map((v) => ({
        etiqueta: (v.querySelector('[data-cmp-etiqueta]')?.textContent ?? '').trim(),
        valor: (v.querySelector('[data-cmp-dato]')?.textContent ?? '').trim(),
        destaca: (v.querySelector('[data-cmp-destaca]')?.textContent ?? '').trim(),
      })),
    }
  })
}

test.describe('el comparador nativo resuelve lo persistido contra el catálogo', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('dos elementos con sólo id, modelSlug y family se comparan igual', async ({ page }) => {
    const errores: string[] = []
    page.on('pageerror', (e) => errores.push(e.message))

    await comoApp(page)
    await conCrudo(page, [minimo('a', '17'), minimo('b', '17-pro')])
    await page.goto('./comparar')

    await expect(page.locator('[data-cmp-app]'), 'la app se pinta').toHaveCount(1)
    expect(errores, `excepciones sin controlar: ${errores.join(' | ')}`).toEqual([])

    // Los nombres salen del catálogo, no del campo que no venía.
    const nombres = await page.locator('[data-cmp-producto] [data-cmp-nombre]').allTextContents()
    expect(nombres.map((n) => n.trim())).toEqual(['iPhone 17', 'iPhone 17 Pro'])

    // Y se comparan de verdad, con los valores del catálogo.
    const a = await alineacion(page)
    expect(a.filas.length, 'un valor por producto').toBe(2)
    expect(a.filas.every((f) => f.valor !== '' && f.valor !== '—')).toBe(true)

    // Lo persistido sigue siendo válido después de recargar.
    await page.reload()
    await expect(page.locator('[data-cmp-producto]')).toHaveCount(2)
    const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('banana:compare') ?? '[]'))
    expect(guardado.length).toBe(2)
  })

  for (const [donde, lista] of [
    ['al principio', [minimo('r', 'modelo-retirado'), minimo('a', '17'), minimo('b', '17-pro')]],
    ['en medio', [minimo('a', '17'), minimo('r', 'modelo-retirado'), minimo('b', '17-pro')]],
    ['al final', [minimo('a', '17'), minimo('b', '17-pro'), minimo('r', 'modelo-retirado')]],
  ] as const) {
    test(`un modelo retirado ${donde} no se pinta ni desalinea a los demás`, async ({ page }) => {
      await comoApp(page)
      await conCrudo(page, [...lista])
      await page.goto('./comparar')

      const a = await alineacion(page)
      expect(a.productos, 'el retirado no aparece como producto fantasma').toEqual(['iPhone 17', 'iPhone 17 Pro'])
      expect(a.filas.length, 'y sólo hay dos valores').toBe(2)
      expect(
        a.filas.map((f) => f.etiqueta),
        'las etiquetas conservan el orden de los válidos',
      ).toEqual(['17', '17 Pro'])

      // LA ALINEACIÓN, QUE ES LO QUE SE ROMPÍA: cada valor pertenece a su
      // producto. El iPhone 17 cuesta menos que el 17 Pro, siempre.
      if (a.campo === 'Precio') {
        const [normal, pro] = a.filas.map((f) => parseInt(f.valor.replace(/\D/g, ''), 10))
        expect(normal, `«17» debe costar menos que «17 Pro» (${normal} vs ${pro})`).toBeLessThan(pro)
        const ganador = a.filas.find((f) => f.destaca !== '')
        expect(ganador?.etiqueta, 'y «Más económico» va con el barato').toBe('17')
      }
    })
  }
})

// ---------------------------------------------------------------------------
// UN SOLO DOMINIO PARA LAS DOS SUPERFICIES
// ---------------------------------------------------------------------------

test.describe('app y web comparten el mismo dominio', () => {
  const TRES = [minimo('a', '17'), minimo('b', '17-pro'), minimo('c', '17-pro-max')]

  test('el máximo de productos es el mismo en las dos', async ({ page }) => {
    // Una sola fuente de verdad: si hubiera dos constantes, bastaría con que
    // una cambiara para que las superficies dejaran de coincidir.
    await comoApp(page)
    await conCrudo(page, TRES)
    await page.goto('./comparar')
    await expect(page.locator('[data-cmp-producto]')).toHaveCount(3)
    await expect(page.locator('[data-model-picker-trigger]'), 'con tres, la app no ofrece un cuarto').toHaveCount(0)
  })

  test('la web también resuelve lo persistido y no pinta el retirado', async ({ page }) => {
    // El defecto vivía en el dominio: la web indexaba las mismas dos listas.
    await conCrudo(page, [minimo('r', 'modelo-retirado'), minimo('a', '17'), minimo('b', '17-pro')])
    await page.goto('./comparar')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const nombres = await page.evaluate(() => {
      const grupo = [...document.querySelectorAll('[role="group"]')].find((g) =>
        /^Modelos comparados/.test(g.getAttribute('aria-label') ?? ''),
      )
      return [...(grupo?.querySelectorAll('p.font-bold') ?? [])]
        .map((p) => (p.textContent ?? '').trim())
        .filter((t) => t !== '' && !t.includes('€'))
    })
    expect(nombres, 'sin fantasma y con los nombres del catálogo').toEqual(['iPhone 17', 'iPhone 17 Pro'])
  })
})

// ---------------------------------------------------------------------------
// LA WEB SIGUE IGUAL (D-086)
// ---------------------------------------------------------------------------

for (const ancho of [390, 1280] as const) {
  test.describe(`el comparador web conserva su composición a ${ancho} px`, () => {
    test.use({ viewport: { width: ancho, height: 900 } })

    test('sigue siendo una tabla de columnas con su ancho mínimo', async ({ page }) => {
      // No es que esté mejor: es que D-086 congela la web.
      await conComparacion(page, [IPHONE.pro, IPHONE.normal])
      await page.goto('./comparar')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      await expect(page.locator('[data-cmp-app]'), 'la web no monta la composición de la app').toHaveCount(0)
      await expect(page.locator('[data-cmp-atributo]')).toHaveCount(0)

      const web = await page.evaluate(() => {
        const tabla = document.querySelector('main table')
        const conMinimo = [...document.querySelectorAll('main div')].filter(
          (d) => parseFloat(getComputedStyle(d).minWidth) >= 700,
        )
        return {
          hayTabla: !!tabla,
          columnas: tabla?.querySelectorAll('colgroup col').length ?? 0,
          filas: tabla?.querySelectorAll('tbody th[scope="row"]').length ?? 0,
          conMinimo: conMinimo.length,
          scrollersH: [...document.querySelectorAll('main *')].filter((e) =>
            /auto|scroll/.test(getComputedStyle(e).overflowX),
          ).length,
        }
      })
      expect(web.hayTabla, 'la web conserva su tabla').toBe(true)
      expect(web.columnas, 'con su columna de etiquetas y tres de producto').toBe(4)
      expect(web.filas, 'y sus filas de atributo').toBeGreaterThan(0)
      expect(web.conMinimo, 'y su ancho mínimo de tabla').toBeGreaterThan(0)
      expect(web.scrollersH, 'y su desplazador horizontal histórico').toBeGreaterThan(0)
    })
  })
}
