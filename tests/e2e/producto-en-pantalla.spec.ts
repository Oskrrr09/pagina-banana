import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// FASE A — EL PRODUCTO ENTRA EN PANTALLA.
//
// QUÉ CONTRATO PROTEGE ESTA SUITE
//
// La app dedicaba el primer viewport a explicarse: eyebrow, título, subtítulo,
// botón secundario, barra de filtros y contador de resultados. Medido antes de
// esta fase, a 320 px hay 398 px útiles entre las dos barras y la interfaz de
// `/iphone` consumía 411: el primer producto quedaba con **0 px visibles**.
//
// Lo que se exige aquí no es una maqueta concreta —eso envejece— sino que al
// abrir las tres puertas de compra se vea producto de verdad.
//
// POR QUÉ 120 PX DE IMAGEN Y 12 PX DE NOMBRE
//
// Una imagen que asoma 4 px se lee como una banda de color, no como un
// producto: por eso `boundingBox().y < viewportHeight` no sirve como criterio.
// 120 px es el mínimo en el que la fotografía se reconoce.
//
// Del texto se exige sólo el NOMBRE, no el precio, y con un mínimo propio: un
// umbral de «más de cero» dejaba pasar títulos cortados a 3 px, justo el
// recorte que aquí se rechaza para la imagen. El precio queda fuera del
// contrato a propósito —cabe más abajo en la tarjeta— porque exigirlo también
// obligaría a rediseñarla por dentro, que es Fase B y no toca aquí.
//
// EL ÁREA ÚTIL NO ES EL VIEWPORT
//
// La barra superior y la de pestañas son opacas. Lo que queda entre ellas es lo
// único que la persona ve sin desplazarse, así que la intersección se calcula
// contra esa franja y no contra la altura de la ventana.
// ============================================================================

/** Mínimo de imagen para que se lea como producto y no como una franja. */
const MINIMO_IMAGEN = 120

/**
 * Mínimo de NOMBRE para que se lea, y no sólo asome.
 *
 * La primera versión de esta suite pedía «nombre o precio» y lo daba por bueno
 * con cualquier intersección mayor que cero. Con eso, `/iphone` a 320 px pasaba
 * enseñando **3 px** del título: exactamente el recorte que esta misma suite
 * rechaza para la imagen. Y como buscaba en cualquier `p, span, h2, h3`, un
 * distintivo de «-15 %» podía hacer de «nombre o precio».
 *
 * Doce píxeles son media línea de un texto de 15 px: no es «el elemento toca el
 * viewport», es que se lee algo.
 */
const MINIMO_NOMBRE = 12

/** Modo aplicación nativa, con el mismo mecanismo que el resto de la suite. */
async function comoApp(page: Page, recientes?: string[]) {
  await page.addInitScript((lista) => {
    ;(window as { Capacitor?: unknown }).Capacitor = {}
    localStorage.setItem('banana:favorite-store-prompt', 'dismissed')
    // El historial de la app vive en el espacio de su identidad, no en la clave
    // del navegador: sin sesión, el espacio anónimo (D-088). Antes se sembraba
    // en `banana:recientes`, que es la del historial web y la app ya no lee.
    if (lista) localStorage.setItem('banana:recientes:app:anon', JSON.stringify(lista))
  }, recientes)
}

/**
 * Cuánto producto se ve de verdad.
 *
 * Devuelve, para la primera tarjeta de producto comercial de la pantalla, los
 * píxeles de imagen que caen dentro del área útil y si su nombre o su precio
 * caen también ahí. Se resuelve en el navegador porque hace falta cruzar varias
 * geometrías a la vez.
 */
async function productoVisible(page: Page) {
  return page.evaluate(
    (minimos) => {
      const alto = (sel: string) => document.querySelector(sel)?.getBoundingClientRect()
      const top = alto('[data-app-topbar]')
      const tab = alto('[data-app-tab-bar]')
      const util = { top: top ? top.bottom : 0, bottom: tab ? tab.top : window.innerHeight }

      const interseca = (r: DOMRect) => Math.max(0, Math.min(r.bottom, util.bottom) - Math.max(r.top, util.top))

      // Una tarjeta de producto es un enlace a una ficha con imagen dentro. Las
      // entradas de familia (`/mac`, `/iphone`) tienen una sola sección en la
      // ruta y quedan fuera: no son producto comercial.
      const tarjetas = [...document.querySelectorAll<HTMLElement>('a[href]')].filter((a) => {
        const href = a.getAttribute('href') ?? ''
        const partes = href
          .replace(/^\/pagina-banana/, '')
          .split('/')
          .filter(Boolean)
        return partes.length >= 2 && !!a.querySelector('img')
      })

      for (const tarjeta of tarjetas) {
        const img = tarjeta.querySelector('img')
        if (!img) continue
        const visibleImagen = interseca(img.getBoundingClientRect())
        if (visibleImagen < minimos.imagen) continue

        // EL NOMBRE, Y SÓLO EL NOMBRE
        //
        // Las dos tarjetas del catálogo ponen el nombre del producto en un `h3`
        // dentro del enlace. Se busca ése y no «cualquier texto»: un `span` con el
        // porcentaje de descuento no es el nombre de nada, y aceptarlo dejaba
        // pasar tarjetas donde lo único legible era el distintivo rojo.
        const h3 = tarjeta.querySelector<HTMLElement>('h3')
        const visibleNombre = h3 ? interseca(h3.getBoundingClientRect()) : 0

        return {
          ok: visibleNombre >= minimos.nombre,
          visibleImagen: Math.round(visibleImagen),
          visibleNombre: Math.round(visibleNombre),
          nombre: (h3?.textContent ?? '').trim(),
          href: tarjeta.getAttribute('href'),
          util: { top: Math.round(util.top), bottom: Math.round(util.bottom) },
        }
      }
      return {
        ok: false,
        visibleImagen: 0,
        visibleNombre: 0,
        nombre: '',
        href: null,
        util: { top: Math.round(util.top), bottom: Math.round(util.bottom) },
      }
      // SE PASAN LOS DOS MÍNIMOS, NO UNO
      //
      // Aquí iba `MINIMO_IMAGEN` a secas —un número— mientras dentro se leía
      // `minimos.imagen` y `minimos.nombre`. Sobre un número esas propiedades son
      // `undefined`, así que las dos comparaciones del navegador eran siempre
      // falsas: el bucle dejaba de descartar tarjetas por debajo del mínimo de
      // imagen y `ok` no podía ser cierto nunca.
      //
      // POR QUÉ EL CI NO LO CAZÓ. TypeScript no se queja porque el parámetro del
      // callback de `page.evaluate` se infiere como `any`. Y las pruebas no
      // fallaban porque **las aserciones que deciden se evalúan en Node** contra
      // las constantes reales —`visibleImagen` y `visibleNombre` frente a 120 y
      // 12—, no contra `ok`, que no se usa en ninguna. En las tres pantallas la
      // primera tarjeta con imagen es además la que cumple, así que filtrar o no
      // devolvía el mismo elemento. El fallo no relajaba el umbral: desactivaba
      // la búsqueda de una tarjeta mejor y dejaba `ok` muerto.
    },
    { imagen: MINIMO_IMAGEN, nombre: MINIMO_NOMBRE },
  )
}

const ANCHOS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const

/** Un producto real del catálogo, para sembrar «seguías mirando». */
const RECIENTE = 'iphone/17-pro'

for (const ventana of ANCHOS) {
  test.describe(`a ${ventana.width} px`, () => {
    test.use({ viewport: { width: ventana.width, height: ventana.height } })

    for (const [nombre, ruta] of [
      ['el catálogo de una familia', './iphone'],
      ['la tienda', './tienda'],
      ['el inicio', './'],
    ] as const) {
      test(`${nombre} abre enseñando producto`, async ({ page }) => {
        await comoApp(page)
        await page.goto(ruta)

        const p = await productoVisible(page)
        expect(
          p.visibleImagen,
          `${ruta}: la imagen del primer producto se ve ${p.visibleImagen} px dentro del área útil (${p.util.top}-${p.util.bottom}); hacen falta ${MINIMO_IMAGEN}`,
        ).toBeGreaterThanOrEqual(MINIMO_IMAGEN)
        expect(
          p.visibleNombre,
          `${ruta}: del nombre «${p.nombre}» sólo se leen ${p.visibleNombre} px; hacen falta ${MINIMO_NOMBRE}`,
        ).toBeGreaterThanOrEqual(MINIMO_NOMBRE)
      })
    }
  })
}

test.describe('el inicio con algo que estabas mirando', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('abre enseñando ese producto', async ({ page }) => {
    await comoApp(page, [RECIENTE])
    await page.goto('./')

    const p = await productoVisible(page)
    expect(p.visibleImagen, 'con recientes, el producto sigue entrando en pantalla').toBeGreaterThanOrEqual(
      MINIMO_IMAGEN,
    )
    expect(p.visibleNombre, `del nombre «${p.nombre}» se leen ${p.visibleNombre} px`).toBeGreaterThanOrEqual(
      MINIMO_NOMBRE,
    )
  })
})
