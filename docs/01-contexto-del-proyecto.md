---
tipo: contexto
actualizado: 2026-08-04
---

# Contexto del proyecto

## Propósito

Banana Computer es un prototipo navegable de tienda Apple orientado a
Canarias. Sirve para demostrar arquitectura, contenido, navegación, compra,
atención y aplicaciones; no opera una tienda real.

Precios, stock, financiación, pedidos, reservas, reseñas, descuentos y demás
condiciones comerciales siguen siendo datos demostrativos. Las cuentas de
cliente y agente también son ficticias.

## Arquitectura ejecutable

```text
src/main.tsx
├── BrowserRouter (basename = import.meta.env.BASE_URL)
├── proveedores de idioma, autenticación, tienda y checkout
└── App
    ├── Layout de la tienda web / shell propio de la app nativa
    │   (y, donde hace falta, composiciones de página distintas: ver D-085)
    ├── CheckoutLayout
    ├── AgentAppScope + panel /agente
    └── ChatBubble

src/data/                 catálogo, accesorios, tiendas y contenido
src/lib/                  estado, Supabase, auth, reservas, PWA e i18n
src/components/           UI, layouts, producto, buscador y panel
src/pages/                pantallas asociadas a rutas
supabase/migrations/      fuente ejecutable única del esquema
tests/schema/             PostgreSQL/PGlite: instalación, migración y RLS
tests/rls/                GoTrue, PostgREST y Storage contra Supabase dedicado
tests/e2e/                recorridos de navegador y accesibilidad
```

El catálogo de dispositivos se divide por familia en `src/data/products/` y
los accesorios en `src/data/accessories/`. Las tiendas viven en
`src/data/stores.ts`; el contenido general, en `src/data/content.ts`.

## Superficies del producto

- **Tienda web:** portada, cinco familias de dispositivos, accesorios,
  buscador, comparador, favoritos, carrito, checkout demostrativo, servicios,
  Plan Renove, tiendas, soporte y recomendador determinista.
- **Cuenta de cliente:** registro, acceso, perfil, direcciones, pedidos
  demostrativos, reservas y descuento educativo.
- **Chat de Bananito:** Supabase Realtime con sesión anónima verificable;
  fallback local cuando no existen credenciales.
- **Panel de agentes:** autenticación separada, bandeja, asignación,
  conversación, ficha del visitante y revisión de descuentos. Se distribuye
  como PWA con service worker, badge y notificaciones.
- **App nativa de tienda:** mismo código empaquetado con Capacitor, shell propio
  y proyectos iOS/Android versionados. Lo que diverge **no se limita al
  armazón**: una página puede tener dos composiciones —`Home` y `FamilyPage` ya
  las tienen— cuando las dos plataformas necesitan estructuras distintas. Ver
  [[02-decisiones#D-085]].
  Los proyectos iOS/Android están versionados. Ambos binarios se han compilado y
  ejecutado en simulador o emulador; publicarlos exige autorización y cuentas
  comerciales de Banana.

## Rutas principales

| Ruta | Responsabilidad |
| --- | --- |
| `/` | Portada |
| `/:family`, `/:family/:model`, `/:family/:model/:variant` | Catálogo y ficha |
| `/accesorios`, `/accesorios/:slug` | Catálogo y ficha de accesorios |
| `/buscar`, `/comparar`, `/elige-tu-apple` | Descubrimiento y decisión |
| `/favoritos`, `/carrito`, `/checkout/:step` | Compra demostrativa |
| `/login`, `/registro`, `/cuenta` | Cuenta de cliente |
| `/servicios`, `/plan-renove`, `/soporte`, `/servicio-tecnico` | Servicios y ayuda |
| `/tiendas`, `/tiendas/:slug` | Directorio de tiendas |
| `/agente/login`, `/agente` | Acceso y panel de agentes |

Las rutas se sirven bajo `/pagina-banana/` en GitHub Pages. React Router usa
`import.meta.env.BASE_URL`; el build de Capacitor usa base `/`.

## Persistencia y backend

- Carrito, favoritos, comparador, avisos y tienda favorita utilizan
  `localStorage`.
- Checkout y pedido confirmado utilizan `sessionStorage` cuando se navega como
  invitado.
- Con sesión, perfiles, pedidos, reservas, chat y justificantes se reflejan en
  Supabase.
- Cliente y agente usan instancias de Supabase separadas para que sus sesiones
  puedan convivir en el mismo navegador.
- La clave anónima es pública por diseño. La autorización depende de JWT, RLS y
  RPC; ninguna clave `service_role` puede entrar en variables `VITE_*` ni en el
  bundle.

La fuente SQL única es `supabase/migrations/`; sus archivos se aplican en orden.
`supabase/schema.sql` es solo un puntero para impedir que vuelva a aplicarse un
estado obsoleto.

## Calidad y despliegue

La comprobación completa es:

```bash
npm ci
npm run check
npm run check:full
```

`check` incluye Prettier, ESLint, tipos, Vitest, instalación y actualización
del esquema sobre PostgreSQL/PGlite y build sin credenciales. `check:full`
añade Playwright contra el artefacto: cobertura completa Chromium, smoke
Firefox/WebKit/Safari móvil, móvil Chromium y panel aislado.

Las pruebas de `tests/rls/` son aparte: `npm run test:integration` necesita
Docker y levanta un Supabase local efímero para comprobar GoTrue, PostgREST,
Storage y cierre de sesión PWA offline reales. Un preflight bloqueado no
cuenta como verificación aprobada.

GitHub Actions encadena calidad → build → E2E → RLS → Pages. Solo un
push a `main` publica, y el despliegue debe fallar si no existen las
credenciales del proyecto RLS dedicado.

## Diseño y accesibilidad

- Modo claro fijo, Tailwind CSS v4 y Motion.
- Foco visible, nombres accesibles, controles táctiles, texto además de color,
  trampa de foco en diálogos y `prefers-reduced-motion`.
- Suelo de 16 px en campos táctiles para evitar el zoom automático de iOS.
- Suite axe sin excepciones globales sobre las rutas principales.
- Web en castellano, inglés, alemán, francés e italiano; la app nativa se
  mantiene en castellano. Las traducciones no españolas son demostrativas.

## Límites actuales

No existen pago, inventario, financiación, emails, newsletter, notificaciones
de reservas/descuentos ni datos comerciales reales. Tampoco se ha validado la
migración de seguridad contra un Supabase dedicado: ese es el bloqueo para
integrar y desplegar la rama de cierre de seguridad.

## Documentos relacionados

- Estado verificable: [[00-estado-actual]]
- Decisiones: [[02-decisiones]]
- Roadmap: [[03-roadmap]]
- Riesgos y defectos: [[04-problemas-pendientes]]
- Guía de app nativa: [[06-app-nativa]]
