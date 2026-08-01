import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { CATALOGO } from '../../src/i18n/catalogo'

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
])

/** Medidas y cifras sueltas: «256GB», «6,3"», «12 MP»… */
function esSoloDato(texto: string): boolean {
  return /^[\d\s.,/"'·×x–-]+(GB|TB|MP|Hz|W|mm|nits|h|"|')?$/i.test(texto)
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
    if (SIN_TRADUCIR.has(texto) || esSoloDato(texto)) continue
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
  const dir = join(process.cwd(), 'src/data/products')
  const fuente = readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n')
  const huerfanas = Object.keys(CATALOGO).filter((k) => !fuente.includes(`'${k}'`))

  expect(huerfanas, `Sobran en src/i18n/catalogo.ts:\n  ${huerfanas.join('\n  ')}`).toEqual([])
})
