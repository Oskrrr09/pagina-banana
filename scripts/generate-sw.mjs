// Genera `dist/sw.js` después de `vite build`.
//
// Por qué generarlo y no escribirlo a mano en `public/`: Vite pone un hash en
// el nombre de cada bundle (`index-B7xK2p.js`), así que una lista de precache
// escrita a mano se queda obsoleta en el primer build. Aquí se lee el
// `index.html` ya construido y se precachean exactamente los ficheros que ese
// HTML referencia. La versión de la caché sale del contenido, así que cambia
// sola cuando cambia el bundle y el service worker antiguo se limpia.
//
// No se usa Workbox a propósito: son ~30 líneas de estrategias y una
// dependencia menos que auditar en un prototipo.

import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

const html = await readFile(join(dist, 'index.html'), 'utf8')

// La base (`/pagina-banana/`) se deduce del propio HTML en vez de repetirla
// aquí, para que no haya dos sitios que puedan discrepar con vite.config.ts.
const baseMatch = html.match(/(?:src|href)="(\/[^"]*?\/)assets\//)
if (!baseMatch) {
  throw new Error('No se encontró ninguna referencia a /assets/ en dist/index.html')
}
const BASE = baseMatch[1]

// Bundles JS/CSS que el HTML referencia de verdad.
const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((m) => m[1])

// Iconos y logos: sin ellos la app instalada se ve rota en el primer arranque
// sin conexión. Solo los del panel: los `icon-*` son para el binario nativo de
// la tienda (Capacitor) y en la web no los pide nadie.
const iconFiles = (await readdir(join(dist, 'icons'))).filter((f) => f.startsWith('agente-'))

const precache = [
  BASE,
  ...new Set(assets),
  `${BASE}manifest-agente.webmanifest`,
  `${BASE}banana.svg`,
  `${BASE}img/logo-dark.svg`,
  ...iconFiles.map((f) => `${BASE}icons/${f}`),
]

const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12)

const sw = `// Generado por scripts/generate-sw.mjs — no editar a mano.
// Versión derivada del contenido del build: cambia sola en cada despliegue.
const CACHE = 'banana-${version}'
const BASE = ${JSON.stringify(BASE)}
const INDEX = BASE
const PRECACHE = ${JSON.stringify(precache, null, 2)}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      // 'reload' evita que el propio precache se sirva de la caché HTTP del
      // navegador, que es justo lo que queremos invalidar al desplegar.
      await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.filter((n) => n.startsWith('banana-') && n !== CACHE).map((n) => caches.delete(n)),
      )
      await self.clients.claim()
    })(),
  )
})

// Permite que la página fuerce la actualización sin esperar a cerrar pestañas.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') void self.skipWaiting()
})

function cacheable(response) {
  return response && response.status === 200 && response.type === 'basic'
}

// Assets con hash en el nombre: si están, no cambian nunca. Cache primero.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  // Las entradas del precache se crean desde rutas /base/assets/.... Al
  // pedirlas después desde un documento profundo, algunos motores conservan
  // metadatos distintos en el Request del módulo. Resolver por pathname en
  // la caché versionada evita que una diferencia irrelevante fuerce red.
  const cached = await cache.match(new URL(request.url).pathname, { ignoreSearch: true })
  if (cached) return cached
  const response = await fetch(request)
  if (cacheable(response)) {
    void cache.put(request, response.clone())
  }
  return response
}

// Imágenes y fuentes: se sirve lo que haya y se refresca por detrás.
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const network = fetch(request)
    .then(async (response) => {
      if (response && (response.status === 200 || response.type === 'opaque')) {
        const cache = await caches.open(CACHE)
        void cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)
  return cached || (await network) || Response.error()
}

// Navegación: red primero, para no dejar nunca una demostración con contenido
// viejo. Sin conexión cae al index cacheado y el enrutador de React resuelve
// la ruta, que es lo que hace que la app instalada siga navegando offline.
async function navigate(request) {
  try {
    const response = await fetch(request)
    if (cacheable(response)) {
      const cache = await caches.open(CACHE)
      void cache.put(INDEX, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(INDEX)
    if (cached) return cached
    throw new Error('offline')
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    // Solo las fuentes de Google. Supabase y cualquier otra API van SIEMPRE a
    // la red: cachear respuestas de sesión o de chat daría datos falsos.
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(staleWhileRevalidate(request))
    }
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request))
    return
  }

  if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (/\\.(png|webp|jpe?g|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
`

await writeFile(join(dist, 'sw.js'), sw)
console.log(`dist/sw.js — caché banana-${version}, ${precache.length} ficheros en precache`)
