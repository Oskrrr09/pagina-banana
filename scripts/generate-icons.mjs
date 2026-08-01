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

// La tienda va en amarillo Banana; el panel interno en negro con el plátano
// amarillo, para que un agente que tenga las dos instaladas las distinga en el
// Dock sin leer el nombre.
const TIENDA = { bg: YELLOW, fg: INK }
const AGENTE = { bg: INK, fg: YELLOW }

// Rótulo "banana" real de la marca, tomado del mismo SVG que usa la web para
// no tener dos versiones del logotipo que puedan separarse.
const logoSvg = await readFile(join(root, 'public', 'img', 'logo-dark.svg'), 'utf8')
const logoCuerpo = logoSvg.slice(logoSvg.indexOf('<g'), logoSvg.lastIndexOf('</svg>'))

function rotulo(color) {
  // El logotipo mide 67x16. Se anida con su propio viewBox y se coloca
  // centrado bajo el plátano.
  return `<svg x="6" y="19" width="20" height="4.78" viewBox="0 0 67 16">
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
  <g transform="translate(0 -3)">${banana(0.42)}</g>
  ${rotulo(fg)}
</svg>`
}

const targets = [
  // --- Tienda (app nativa iOS/Android vía Capacitor) ---
  { file: 'icon-192.png', size: 192, svg: standard(TIENDA) },
  { file: 'icon-512.png', size: 512, svg: standard(TIENDA) },
  { file: 'icon-maskable-512.png', size: 512, svg: maskable(TIENDA) },
  // App Store exige 1024x1024 sin transparencia ni esquinas redondeadas:
  // las redondea Apple. Por eso usa el trazado `maskable`, que va a sangre.
  { file: 'icon-1024.png', size: 1024, svg: maskable(TIENDA) },
  // iOS no entiende `maskable` y recorta con su propio squircle, así que en la
  // web usa el estándar. 180 px es lo que pide desde el iPhone 6 Plus.
  { file: 'apple-touch-icon-180.png', size: 180, svg: standard(TIENDA) },

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
  { file: 'icon.png', size: 1024, svg: maskable(TIENDA) },
  { file: 'icon-only.png', size: 1024, svg: maskable(TIENDA) },
  { file: 'icon-foreground.png', size: 1024, svg: standard(TIENDA) },
  { file: 'icon-background.png', size: 1024, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${YELLOW}"/></svg>` },
  { file: 'splash.png', size: 2732, svg: splash(TIENDA) },
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
      `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    )
    await writeFile(join(dir, file), await page.screenshot({ omitBackground: true }))
    await page.close()
    console.log(`${dir === outDir ? 'public/icons' : 'resources'}/${file} — ${size}x${size}`)
  }
} finally {
  await browser.close()
}
