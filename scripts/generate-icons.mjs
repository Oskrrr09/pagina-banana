// Rasteriza el logo vectorial a los PNG que piden la PWA y la app nativa.
//
// Se hace con el Chromium que Playwright ya instala, no con una librería nueva:
// el logo es un SVG, así que renderizarlo a cada tamaño da un resultado nítido.
// Escalar `public/banana-icon.png` (144 px) hasta 512 se vería emborronado.
//
// Uso: node scripts/generate-icons.mjs
// Solo hay que reejecutarlo si cambia el logo; los PNG se versionan en git.

import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
const nativeDir = join(root, 'resources')

const YELLOW = '#FDC200'
const INK = '#1D1D1F'

// Trazo del plátano, idéntico al de `public/banana.svg` (viewBox 0 0 32 32).
const BANANA =
  'M8 8.5c0 7.2 3.2 13 11.2 14 1 .1 1.6-1 .7-1.6-5.4-3.4-7.4-7.6-7.2-12.3.05-1-1.4-1.2-2-.5-.8.9-2.2.8-2.7.4Z'

// El trazo ocupa ~13x14.6 con su centro en (14, 15.3), no en (16, 16): en el
// favicon de 32 px ese desvío no se aprecia, pero en un icono de 512 se ve
// descolgado hacia la izquierda. Lo recolocamos en el centro real del lienzo.
function banana(scale) {
  return `<g transform="translate(16 16) scale(${scale}) translate(-14 -15.3)">
    <path d="${BANANA}" fill="var(--fg)"/>
  </g>`
}

// Icono normal: cuadrado de esquinas redondeadas, como el favicon.
function standard({ bg, fg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="--fg:${fg}">
  <rect width="32" height="32" rx="7" fill="${bg}"/>
  ${banana(1)}
</svg>`
}

// Icono `maskable`: Android lo recorta con la forma que elija el fabricante
// (círculo, squircle, gota). El fondo va a sangre y el dibujo se queda dentro
// de la zona segura, que es el círculo central del 80% del lienzo. A escala
// 1.15 la semidiagonal del trazo es ~11.3, por debajo del radio seguro de 12.8.
function maskable({ bg, fg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="--fg:${fg}">
  <rect width="32" height="32" fill="${bg}"/>
  ${banana(1.15)}
</svg>`
}

// El panel interno va en negro con el plátano amarillo, para que un agente que
// tenga las dos aplicaciones instaladas las distinga en el Dock sin leer el
// nombre. La tienda NO usa este trazo: usa el icono oficial de Banana.
const AGENTE = { bg: INK, fg: YELLOW }
// Paleta de la pantalla de carga de la tienda.
const SPLASH = { bg: YELLOW, fg: INK }

// ---------------------------------------------------------------------------
// Icono oficial de la tienda
//
// Es el plátano abierto en blanco sobre degradado naranja, el mismo que Banana
// publica en su web. Se usa tal cual en vez de redibujarlo: es su marca.
//
// Solo existe en mapa de bits, y el mayor que publican mide 180x180. Eso da
// exacto para el icono de la pantalla de inicio de un iPhone (60pt @3x = 180px)
// y para todo Android; los tamaños mayores —el de 1024 que pide App Store— se
// amplían y se ven algo blandos. Antes de publicar hay que pedirle a Banana el
// original en vector o en alta resolución.
const iconoOficial = await readFile(join(root, 'public', 'apple-touch-icon.png'))
const ICONO_OFICIAL = `data:image/png;base64,${iconoOficial.toString('base64')}`

/** El icono oficial ocupando todo el lienzo. */
function oficial() {
  return `<img src="${ICONO_OFICIAL}" alt="">`
}

/**
 * Versión para el icono adaptativo de Android: el dibujo se encoge para caber
 * en la zona segura (el círculo central del 80%), sobre fondo transparente.
 */
function oficialEnZonaSegura() {
  return `<div style="position:absolute;inset:0;display:grid;place-items:center">
    <img src="${ICONO_OFICIAL}" alt="" style="width:72%;height:72%">
  </div>`
}

// Rótulo "banana" real de la marca, tomado del mismo SVG que usa la web para
// no tener dos versiones del logotipo que puedan separarse.
const logoSvg = await readFile(join(root, 'public', 'img', 'logo-dark.svg'), 'utf8')
const logoCuerpo = logoSvg.slice(logoSvg.indexOf('<g'), logoSvg.lastIndexOf('</svg>'))

function rotulo(color) {
  // El logotipo mide 67x16. Se anida con su propio viewBox, centrado.
  //
  // La pantalla de carga lleva **solo el rótulo**, no el icono: el icono
  // oficial trae su propio fondo naranja y sobre el amarillo de la pantalla
  // se ve como una pegatina pegada encima.
  return `<svg x="4" y="13.4" width="24" height="5.73" viewBox="0 0 67 16">
    ${logoCuerpo.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${color}"`)}
  </svg>`
}

// Pantalla de carga de la app nativa. Capacitor la recorta al tamaño de cada
// dispositivo desde el centro, así que tiene que ser cuadrada y con el dibujo
// pequeño y centrado: cualquier cosa cerca del borde se pierde en pantallas
// alargadas.
//
// Aquí sí cabe el logotipo completo. En el icono no: a 48px el rótulo no se
// lee, y por eso el icono se queda solo con el plátano.
function splash({ bg, fg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="--fg:${fg}">
  <rect width="32" height="32" fill="${bg}"/>
  ${rotulo(fg)}
</svg>`
}

const targets = [
  // --- Tienda (app nativa iOS/Android vía Capacitor) ---
  // Todos salen del icono oficial, a sangre: ya viene con su fondo y sus
  // esquinas, y son iOS y Android quienes recortan la forma que toque.
  { file: 'icon-192.png', size: 192, svg: oficial() },
  { file: 'icon-512.png', size: 512, svg: oficial() },
  { file: 'icon-maskable-512.png', size: 512, svg: oficial() },
  { file: 'icon-1024.png', size: 1024, svg: oficial() },
  { file: 'apple-touch-icon-180.png', size: 180, svg: oficial() },

  // --- Panel de agente (PWA instalable) ---
  { file: 'agente-192.png', size: 192, svg: standard(AGENTE) },
  { file: 'agente-512.png', size: 512, svg: standard(AGENTE) },
  { file: 'agente-maskable-512.png', size: 512, svg: maskable(AGENTE) },
  { file: 'agente-apple-touch-180.png', size: 180, svg: standard(AGENTE) },
]

// Recursos que consume `npx @capacitor/assets generate` para producir los
// tamaños concretos de iOS y Android. Van fuera de `public/` porque no son
// parte de la web: solo entran en el binario nativo.
const nativeTargets = [
  { file: 'icon.png', size: 1024, svg: oficial() },
  { file: 'icon-only.png', size: 1024, svg: oficial() },
  { file: 'icon-foreground.png', size: 1024, svg: oficialEnZonaSegura() },
  {
    file: 'icon-background.png',
    size: 1024,
    // Degradado de marca real de Banana (amarillo arriba, naranja abajo), el
    // mismo que usa su web y el propio icono oficial.
    svg: `<div style="position:absolute;inset:0;background:linear-gradient(to bottom,#FDC200,#FE8401)"></div>`,
  },
  { file: 'splash.png', size: 2732, svg: splash(SPLASH) },
  // Android e iOS en modo oscuro. Se invierte el fondo, no el plátano.
  { file: 'splash-dark.png', size: 2732, svg: splash({ bg: INK, fg: YELLOW }) },
]

const browser = await chromium.launch()
try {
  await mkdir(outDir, { recursive: true })
  await mkdir(nativeDir, { recursive: true })
  for (const { file, size, svg, dir } of [
    ...targets.map((t) => ({ ...t, dir: outDir })),
    ...nativeTargets.map((t) => ({ ...t, dir: nativeDir })),
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    })
    await page.setContent(
      `<style>
        html,body{margin:0;padding:0;width:${size}px;height:${size}px;position:relative}
        svg{display:block;width:${size}px;height:${size}px}
        /* El icono oficial es un PNG de 180px: hay que estirarlo al lienzo,
           si no se dibuja a su tamaño natural en una esquina. */
        img{display:block;width:100%;height:100%;object-fit:cover}
      </style>${svg}`,
    )
    await writeFile(join(dir, file), await page.screenshot({ omitBackground: true }))
    await page.close()
    console.log(`${dir === outDir ? 'public/icons' : 'resources'}/${file} — ${size}x${size}`)
  }
} finally {
  await browser.close()
}
