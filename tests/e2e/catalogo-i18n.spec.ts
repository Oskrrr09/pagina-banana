import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { CATALOGO } from '../../src/i18n/catalogo'
import { ACCESORIOS } from '../../src/i18n/catalogo-accesorios'
import { ASISTENTE } from '../../src/i18n/asistente'

// Cobertura de traducción del catálogo.
//
// Los reclamos de modelo, las características y las especificaciones viven en
// `src/data/products/` con su texto en castellano y se traducen por búsqueda
// en `src/i18n/catalogo.ts`. Eso es cómodo de mantener pero **no lo comprueba
// el compilador**: si alguien añade un modelo con una característica nueva,
// TypeScript no se entera y esa línea sale en castellano dentro de la tienda
// en alemán.
//
// Esta prueba recorre el catálogo real y lo verifica.

/**
 * Textos que **no se traducen a propósito** porque son nombres propios o
 * medidas: se escriben igual en los cinco idiomas.
 */
const SIN_TRADUCIR = new Set([
  'USB-C',
  'IP68',
  'Face ID',
  'Touch ID',
  'macOS',
  'MagSafe',
  'Thunderbolt',
  'Thunderbolt / USB-4',
  'HDMI',
  'Apple Intelligence',
  'Apple Pencil Pro',
  'Apple Pencil (USB-C)',
  'Apple Pencil Pro y USB-C',
  'Apple A16',
  'Apple A17 Pro',
  'Apple H1',
  'Apple H2',
  'Apple M4',
  'Apple M5',
  'S10 SiP',
  'S11 SiP',
  'WR50',
  'WR50 · IP6X',
  'WR100 · EN13319 · MIL-STD-810H',
  'Ultra Retina XDR OLED (11" o 13")',
  'Liquid Retina (11" o 13")',
  'Liquid Retina 11"',
  'Liquid Retina 8,3"',
  'Gigabit Ethernet',
  '1 m / 2 m',
  // Accesorios
  'Bluetooth',
  'IP67',
  'Force Touch',
  'Multi-Touch',
  'iPhone',
  'iPad',
  'Mac',
  'Apple Watch',
  'AirTag',
  'AirPods',
  'Magic Mouse (USB-C)',
  'Magic Trackpad (USB-C)',
  'Apple Pencil (USB-C)',
  'Apple Pencil Pro',
])

/**
 * Referencias de pieza de Apple («MHVQ4ZM/A»). Son códigos de catálogo, no
 * texto: idénticos en cualquier idioma.
 */
function esReferenciaApple(texto: string): boolean {
  return /^M[A-Z0-9]{6}\/[A-Z]$/.test(texto)
}

/** Medidas y cifras sueltas: «256GB», «6,3"», «12 MP»… */
function esSoloDato(texto: string): boolean {
  return /^[\d\s.,/"'·×x–-]+(GB|TB|MP|Hz|W|mm|nits|h|m|"|')?$/i.test(texto)
}

/** Un texto se salta la comprobación si no hay nada que traducir en él. */
function seSalta(texto: string): boolean {
  return SIN_TRADUCIR.has(texto) || esSoloDato(texto) || esReferenciaApple(texto)
}

/**
 * Se lee el código fuente en vez de importar los datos porque
 * `src/data/products/_shared.ts` usa `import.meta.env.BASE_URL`, que solo
 * existe dentro de Vite: importarlo desde Playwright revienta.
 */
function recogerTextos(): { texto: string; origen: string }[] {
  const dir = join(process.cwd(), 'src/data/products')
  const out: { texto: string; origen: string }[] = []

  for (const fichero of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    const src = readFileSync(join(dir, fichero), 'utf8')

    for (const m of src.matchAll(/tagline: '([^']+)'/g)) {
      out.push({ texto: m[1], origen: `${fichero} · reclamo` })
    }
    for (const bloque of src.matchAll(/highlights:\s*\[([\s\S]*?)\]/g)) {
      for (const m of bloque[1].matchAll(/'([^']+)'/g)) {
        out.push({ texto: m[1], origen: `${fichero} · característica` })
      }
    }
    for (const m of src.matchAll(/label: '([^']+)'/g)) {
      out.push({ texto: m[1], origen: `${fichero} · etiqueta de especificación` })
    }
    for (const m of src.matchAll(/value: '([^']+)'/g)) {
      out.push({ texto: m[1], origen: `${fichero} · valor de especificación` })
    }
  }

  expect(out.length, 'no se ha leído ningún texto del catálogo').toBeGreaterThan(50)
  return out
}

test('todo el texto del catálogo tiene traducción a los cuatro idiomas', () => {
  const faltan: string[] = []

  for (const { texto, origen } of recogerTextos()) {
    if (seSalta(texto)) continue
    const fila = CATALOGO[texto]
    if (!fila) {
      faltan.push(`«${texto}» (${origen})`)
      continue
    }
    fila.forEach((valor, i) => {
      if (!valor || !valor.trim()) {
        faltan.push(`«${texto}» sin ${['inglés', 'alemán', 'francés', 'italiano'][i]} (${origen})`)
      }
    })
  }

  expect(
    faltan,
    `Faltan traducciones de catálogo. Añádelas en src/i18n/catalogo.ts, o al ` +
      `conjunto SIN_TRADUCIR de esta prueba si es un nombre propio:\n  ` +
      faltan.join('\n  '),
  ).toEqual([])
})

test('el mapa de catálogo no acumula entradas que ya no usa nadie', () => {
  // Traducciones huérfanas: texto que se tradujo y que ya no está en ningún
  // producto. No rompen nada, pero engordan el fichero y confunden.
  // Se busca en el código fuente entero y no solo en lo que el extractor sabe
  // parsear: algunos textos van como valor por defecto de una función
  // auxiliar (`iphoneSpecs(chip, screen, camera = 'Doble avanzado')`) y no
  // como `value: '...'`.
  // Se miran todos los módulos de datos, no solo los productos: el mapa
  // también cubre nombres del índice de búsqueda y servicios de tienda.
  const dir = join(process.cwd(), 'src/data/products')
  const fuente = [
    ...readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .map((f) => readFileSync(join(dir, f), 'utf8')),
    readFileSync(join(process.cwd(), 'src/data/searchIndex.ts'), 'utf8'),
    readFileSync(join(process.cwd(), 'src/data/stores.ts'), 'utf8'),
    readFileSync(join(process.cwd(), 'src/pages/StoreDetailPage.tsx'), 'utf8'),
    readFileSync(join(process.cwd(), 'src/components/search/SearchResultCards.tsx'), 'utf8'),
  ].join('\n')
  const huerfanas = Object.keys(CATALOGO).filter((k) => !fuente.includes(`'${k}'`))

  expect(huerfanas, `Sobran en src/i18n/catalogo.ts:\n  ${huerfanas.join('\n  ')}`).toEqual([])
})

/**
 * Los accesorios tienen más texto que los productos y, sobre todo, tienen
 * **notas de compatibilidad**: «no compatible con Pro Max», «requiere un Mac
 * con chip de Apple». Esas son las líneas que evitan una devolución, así que
 * son las que menos pueden quedarse en castellano.
 *
 * Se leen uniendo las cadenas concatenadas con `+`, porque casi todas las
 * descripciones están partidas en varias líneas por el ancho del fichero y
 * buscar literal a literal daría medias frases.
 */
function recogerTextosAccesorios(): { texto: string; origen: string }[] {
  const dir = join(process.cwd(), 'src/data/accessories')
  const out: { texto: string; origen: string }[] = []

  /** Une los literales de un bloque respetando la concatenación con `+`. */
  function literales(bloque: string): string[] {
    const res: string[] = []
    let actual: string | null = null
    for (const tok of bloque.matchAll(/'((?:[^'\\]|\\.)*)'|(,)/g)) {
      if (tok[1] !== undefined) actual = (actual ?? '') + tok[1]
      else if (actual !== null) {
        res.push(actual)
        actual = null
      }
    }
    if (actual !== null) res.push(actual)
    return res.map((s) => s.replace(/\\'/g, "'").trim()).filter(Boolean)
  }

  for (const fichero of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    if (fichero === '_shared.ts') continue
    const src = readFileSync(join(dir, fichero), 'utf8')

    const campos: [string, string][] = [
      ['name', 'nombre'],
      ['tagline', 'reclamo'],
      ['description', 'descripción'],
      ['availabilityLabel', 'disponibilidad'],
      ['label', 'etiqueta'],
      ['value', 'valor'],
    ]
    for (const [campo, etiqueta] of campos) {
      const re = new RegExp(`\\b${campo}:\\s*((?:'(?:[^'\\\\]|\\\\.)*'\\s*\\+?\\s*)+)`, 'g')
      for (const m of src.matchAll(re)) {
        for (const texto of literales(m[1] + ',')) {
          out.push({ texto, origen: `${fichero} · ${etiqueta}` })
        }
      }
    }
    for (const [clave, etiqueta] of [
      ['highlights', 'característica'],
      ['notes', 'nota de compatibilidad'],
    ]) {
      // Se corta en el primer `]`: ninguno de estos arrays anida corchetes.
      // Anclarlo a `\n  ]` parecía más seguro y era justo lo contrario —con un
      // `highlights: [...]` escrito en una sola línea se saltaba hasta el
      // cierre del array siguiente y se tragaba los slugs de `models`.
      const re = new RegExp(`${clave}:\\s*\\[([^\\]]*)\\]`, 'g')
      for (const bloque of src.matchAll(re)) {
        for (const texto of literales(bloque[1] + ',')) {
          out.push({ texto, origen: `${fichero} · ${etiqueta}` })
        }
      }
    }
  }

  expect(out.length, 'no se ha leído ningún texto de accesorios').toBeGreaterThan(50)
  return out
}

test('todo el texto de los accesorios tiene traducción a los cuatro idiomas', () => {
  const faltan: string[] = []

  for (const { texto, origen } of recogerTextosAccesorios()) {
    if (seSalta(texto)) continue
    const fila = ACCESORIOS[texto] ?? CATALOGO[texto]
    if (!fila) {
      faltan.push(`«${texto}» (${origen})`)
      continue
    }
    fila.forEach((valor, i) => {
      if (!valor || !valor.trim()) {
        faltan.push(`«${texto}» sin ${['inglés', 'alemán', 'francés', 'italiano'][i]} (${origen})`)
      }
    })
  }

  expect(
    faltan,
    `Faltan traducciones de accesorios. Añádelas en ` +
      `src/i18n/catalogo-accesorios.ts, o al conjunto SIN_TRADUCIR de esta ` +
      `prueba si es un nombre propio:\n  ` +
      faltan.join('\n  '),
  ).toEqual([])
})

test('el mapa de accesorios no acumula entradas que ya no usa nadie', () => {
  const dir = join(process.cwd(), 'src/data/accessories')
  const fuente = readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n')

  // Las descripciones largas van partidas en varias líneas, así que buscar la
  // frase entera nunca acertaría: se busca su primer trozo hasta la primera
  // coma o punto, que sí está en una sola línea.
  const huerfanas = Object.keys(ACCESORIOS).filter((k) => {
    if (fuente.includes(`'${k}'`)) return false
    const inicio = k.split(/[.,;]/)[0].slice(0, 40)
    return !fuente.includes(inicio)
  })

  expect(
    huerfanas,
    `Sobran en src/i18n/catalogo-accesorios.ts:\n  ${huerfanas.join('\n  ')}`,
  ).toEqual([])
})

/**
 * El asistente «Encuentra tu Apple» tiene su propio mapa porque sus textos
 * viven en `src/data/productDecisionData.ts`, un módulo sin React.
 *
 * Esta prueba comprueba dos cosas distintas y las dos importan:
 *
 *  - Que las preguntas y opciones tengan traducción.
 *  - Que **no se haya traducido ningún `value`**. Los `value` son los
 *    identificadores con los que el motor filtra y puntúa; si alguno acabara
 *    en el mapa y se tradujera, el filtro dejaría de encontrar coincidencias y
 *    el asistente diría que ningún modelo encaja, sin error ni aviso.
 */
test('las preguntas del asistente tienen traducción y sus identificadores no', () => {
  const src = readFileSync(join(process.cwd(), 'src/data/productDecisionData.ts'), 'utf8')

  const faltan: string[] = []
  for (const [campo, etiqueta] of [
    ['prompt', 'pregunta'],
    ['help', 'ayuda'],
    ['label', 'opción'],
  ] as const) {
    const re = new RegExp(`\\b${campo}: '((?:[^'\\\\]|\\\\.)*)'`, 'g')
    for (const m of src.matchAll(re)) {
      const texto = m[1].replace(/\\'/g, "'")
      // Las etiquetas con marcador `{...}` llevan un valor dentro y se
      // comprueban igual: la clave es el texto con el marcador sin sustituir.
      if (!ASISTENTE[texto]) faltan.push(`«${texto}» (${etiqueta})`)
    }
  }
  expect(
    faltan,
    `Faltan traducciones del asistente. Añádelas en src/i18n/asistente.ts:\n  ` +
      faltan.join('\n  '),
  ).toEqual([])

  const identificadores = new Set(
    [...src.matchAll(/\bvalue: '((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]),
  )
  // Estos son a la vez identificador y texto visible: el motor los compara en
  // crudo (`answers.specific['iphone.size'] === 'grande'`) y además los pinta
  // dentro de un motivo («Tamaño grande como preferiste»). Están en el mapa a
  // propósito, y es seguro porque la traducción solo ocurre al pintar: el dato
  // que compara el motor no pasa nunca por `traducirCatalogo`.
  for (const excepcion of ['no', 'grande', 'compacto', 'equilibrado', 'in-ear']) {
    identificadores.delete(excepcion)
  }
  const traducidos = [...identificadores].filter((v) => ASISTENTE[v])
  expect(
    traducidos,
    `Estos son identificadores del motor de decisión y NO pueden estar en ` +
      `src/i18n/asistente.ts — traducirlos rompe el filtrado en silencio:\n  ` +
      traducidos.join('\n  '),
  ).toEqual([])
})
