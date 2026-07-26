---
tipo: contexto
actualizado: 2026-07-26
---

# Contexto del proyecto

## Propósito observado

El repositorio implementa la “Fase 2” de un prototipo navegable para una nueva
web de Banana Computer. Su objetivo actual es demostrar arquitectura,
navegación, contenido y flujos de compra; no operar una tienda real.

La interfaz está en español y orientada a Canarias. El propio producto etiqueta
precios, stock, reseñas y condiciones no validadas para evitar confundir la
demostración con información comercial definitiva.

## Arquitectura

```text
index.html
└── src/main.tsx
    ├── BrowserRouter (basename = import.meta.env.BASE_URL)
    ├── StoreProvider
    └── App
        ├── Layout
        │   ├── Header / navegación
        │   ├── páginas comerciales
        │   └── Footer
        ├── CheckoutLayout
            ├── cabecera simplificada
            └── CheckoutPage
        └── ChatBubble (acceso global; chat aún no implementado)
```

- `src/pages/`: pantallas asociadas a las rutas.
- `src/components/layout/`: estructura global y navegación responsive.
- `src/components/ui/`: componentes reutilizables y accesibles.
- `src/components/product/`: tarjetas, imágenes, financiación y stock.
- `src/components/home/`: composiciones específicas de la portada.
- `src/data/`: catálogo, navegación, tiendas, textos y tipos.
- `src/lib/store.tsx`: estado y persistencia local.
- `src/index.css`: Tailwind v4, tokens, estilos base y accesibilidad.
- `public/`: fallback SPA, iconos, logotipos, campañas e imágenes de producto.

## Rutas implementadas

| Ruta | Responsabilidad |
| --- | --- |
| `/` | Inicio |
| `/:family` | Catálogo de familia |
| `/:family/:model` | Configurador/listado de colores y capacidades |
| `/:family/:model/:variant` | Ficha de variante |
| `/buscar` | Búsqueda |
| `/comparar` | Comparador |
| `/favoritos` | Favoritos |
| `/carrito` | Carrito |
| `/checkout/:step` | Checkout simulado, pasos 1 a 3 |
| `/servicios` | Servicios |
| `/plan-renove` | Plan Renove |
| `/tiendas` | Listado de tiendas |
| `/tiendas/:slug` | Ficha de tienda |
| `/soporte` | Centro de soporte |
| `*` | 404 |

React Router puntúa las rutas estáticas por encima de las dinámicas aunque las
dinámicas estén declaradas primero.

## Modelo de datos

`src/data/products.ts` construye un catálogo estático tipado:

- 6 familias visibles.
- 5 familias con catálogo.
- 18 modelos en total.
- Cada modelo define familia, slug, nombre, texto, precio inicial, financiación,
  colores, capacidades, disponibilidad, especificaciones y destacados.

`src/data/stores.ts` define cinco tiendas en Gran Canaria y Tenerife. Sus
direcciones y horarios se contrastaron con las fichas oficiales de Banana
Computer el 2026-07-26 y cada registro conserva su URL de origen. La interfaz
no afirma que una tienda esté abierta en tiempo real y avisa de posibles
variaciones en festivos.

La composición actual de la familia Mac se contrastó el 2026-07-26 con los
listados públicos de [Banana Computer](https://tienda.bananacomputer.com/productos/)
y [K-tuin](https://www.k-tuin.com/comprar-un-mac). Las imágenes se almacenan
localmente; precios, financiación y disponibilidad continúan tratados como
datos demostrativos y no se sincronizan con esas fuentes.

`src/data/content.ts` contiene servicios, ventajas, FAQ, soporte y Plan Renove.
La portada no incluye reseñas hasta disponer de opiniones verificadas.

No se realiza ninguna petición HTTP para obtener datos de negocio. Las únicas
conexiones declaradas por la página son la carga de Manrope e Inter desde Google
Fonts.

## Estado de cliente

`StoreProvider` expone carrito, favoritos y comparador. Los tres se inicializan
desde `localStorage` y se vuelven a serializar al cambiar:

- El carrito agrupa por identificador de familia/modelo/color/capacidad.
- Cada línea del carrito puede incluir `insured`; el coste se calcula por unidad
  y ficha, carrito y checkout comparten ese estado mediante `banana:cart`.
- Los favoritos guardan identificadores de modelo o de variante.
- El comparador admite un máximo de tres elementos y reinicia la selección al
  cambiar de familia.

Las familias iPhone y Mac enlazan cada modelo directamente a su variante
inicial. La ruta intermedia `/:family/:model` se conserva para accesos profundos
y permite elegir color y capacidad antes de abrir la ficha.

En la ficha, “Comprar” añade la variante y abre el primer paso del checkout;
“Añadir al carrito” la guarda y permite continuar navegando. El seguro elegido
se adjunta exclusivamente a esa variante.

No hay migración ni validación del esquema almacenado.

## Diseño y accesibilidad presentes

- Paleta amarilla Banana, tinta casi negra y superficies neutras.
- Manrope para display e Inter para cuerpo.
- Tailwind CSS v4 con tokens en `@theme`.
- Motion para modales, menús, acordeones, carrusel, reveals y cambios de
  variante.
- Foco visible, enlace “Saltar al contenido”, áreas táctiles amplias,
  disponibilidad expresada con texto y color, y tratamiento global de
  `prefers-reduced-motion`.
- El menú móvil funciona como diálogo modal con trampa de foco, cierre mediante
  Escape, devolución del foco y bloqueo temporal del scroll.
- El footer usa acordeones cerrados inicialmente en móvil y columnas estáticas
  desde 768 px.
- Imágenes raster locales para producto/campaña y placeholders explícitos en
  experiencias todavía simuladas.

## Construcción y despliegue

- Desarrollo: `npm run dev`.
- Producción: `npm run build` (`tsc -b && vite build`).
- Vista previa: `npm run preview`.
- Base de producción: `/pagina-banana/`.
- Despliegue: GitHub Actions a GitHub Pages desde `main`.
- `public/404.html` codifica rutas profundas y `index.html` las restaura para
  soportar una SPA en GitHub Pages.

## Documentos relacionados

- Estado verificable: [[00-estado-actual]]
- Decisiones constatadas: [[02-decisiones]]
- Próximos pasos: [[03-roadmap]]
- Riesgos y defectos: [[04-problemas-pendientes]]
