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
        └── Layout
            ├── Header / navegación
            ├── páginas
            └── Footer
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
- 11 modelos en total.
- Cada modelo define familia, slug, nombre, texto, precio inicial, financiación,
  colores, capacidades, disponibilidad, especificaciones y destacados.

`src/data/stores.ts` define cinco tiendas de ejemplo en Gran Canaria y Tenerife.
`src/data/content.ts` contiene servicios, ventajas, FAQ, soporte, Plan Renove y
una reseña de muestra.

No se realiza ninguna petición HTTP para obtener datos de negocio. Las únicas
conexiones declaradas por la página son la carga de Manrope e Inter desde Google
Fonts.

## Estado de cliente

`StoreProvider` expone carrito, favoritos y comparador. Los tres se inicializan
desde `localStorage` y se vuelven a serializar al cambiar:

- El carrito agrupa por identificador de familia/modelo/color/capacidad.
- Los favoritos guardan identificadores de modelo o de variante.
- El comparador admite un máximo de tres elementos y reinicia la selección al
  cambiar de familia.

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
